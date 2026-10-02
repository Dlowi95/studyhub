const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Match Vietnamese with or without accents without interpreting user input as regex.
const accentGroups = {
  a: "aàáạảãâầấậẩẫăằắặẳẵ", e: "eèéẹẻẽêềếệểễ",
  i: "iìíịỉĩ", o: "oòóọỏõôồốộổỗơờớợởỡ",
  u: "uùúụủũưừứựửữ", y: "yỳýỵỷỹ", d: "dđ",
};
const searchPattern = (value) => Array.from(value.normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "").replace(/đ/gi, "d").toLowerCase())
  .map((char) => accentGroups[char] ? `[${accentGroups[char]}]` : escapeRegex(char)).join("");

function buildPublicDocumentQuery(params = {}) {
  const query = { status: "approved" };
  const invalid = (message) => { const error = new Error(message); error.status = 400; throw error; };
  const minNumber = (key, max) => {
    const value = params[key];
    if (value === undefined || value === "") return undefined;
    if (typeof value !== "string" || !/^\d+(\.\d+)?$/.test(value) || Number(value) > max) invalid(`Bộ lọc ${key} không hợp lệ`);
    return Number(value);
  };
  const minRating = minNumber("minRating", 5);
  const minDownloads = minNumber("minDownloads", 1000000000);
  if (minRating !== undefined) query.avgRating = { $gte: minRating };
  if (minDownloads !== undefined) {
    if (!Number.isInteger(minDownloads)) invalid("Lượt tải tối thiểu phải là số nguyên");
    query.downloadCount = { $gte: minDownloads };
  }
  const parseDay = (value) => {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) invalid("Ngày đăng phải có định dạng YYYY-MM-DD");
    const day = new Date(`${value}T00:00:00Z`);
    if (Number.isNaN(day.getTime()) || day.toISOString().slice(0, 10) !== value) invalid("Ngày đăng không hợp lệ");
    // Date inputs represent calendar days in Vietnam, including the entire end day.
    return new Date(day.getTime() - 7 * 60 * 60 * 1000);
  };
  const from = params.from ? parseDay(params.from) : null;
  const to = params.to ? parseDay(params.to) : null;
  if (from && to && from > to) invalid("Ngày bắt đầu phải trước hoặc bằng ngày kết thúc");
  if (from || to) query.createdAt = { ...(from ? { $gte: from } : {}), ...(to ? { $lt: new Date(to.getTime() + 86400000) } : {}) };
  const subject = typeof params.subject === "string" ? params.subject.trim().slice(0, 120) : "";
  if (subject) query.subjectName = { $regex: `^${escapeRegex(subject)}$`, $options: "i" };
  const type = params.fileType || params.type;
  if (typeof type === "string" && type.trim()) {
    query.fileType = { $regex: `^${escapeRegex(type.trim().slice(0, 20))}$`, $options: "i" };
  }
  const q = typeof params.q === "string" ? params.q.trim().slice(0, 200) : "";
  const fields = { all: ["title", "description", "subjectName", "tags"], title: ["title"], tags: ["tags"] };
  const searchIn = params.searchIn || "all";
  const match = params.match || "all";
  if (!Object.hasOwn(fields, searchIn)) invalid("Phạm vi tìm kiếm không hợp lệ");
  if (!["all", "phrase"].includes(match)) invalid("Cách khớp từ khóa không hợp lệ");
  if (q) {
    const terms = match === "phrase" ? [q.replace(/\s+/g, " ")] : q.split(/\s+/);
    query.$and = terms.map((term) => ({
      $or: fields[searchIn].map((field) => ({
        [field]: { $regex: searchPattern(term), $options: "i" },
      })),
    }));
  }
  const sorts = {
    latest: { createdAt: -1, _id: -1 },
    popular: { downloadCount: -1, createdAt: -1, _id: -1 },
    rating: { avgRating: -1, createdAt: -1, _id: -1 },
  };
  return {
    query, sort: sorts[params.sort] || sorts.latest,
    page: Math.min(100000, Math.max(1, parseInt(params.page, 10) || 1)),
    limit: Math.min(100, Math.max(1, parseInt(params.limit, 10) || 20)),
  };
}
module.exports = { buildPublicDocumentQuery, searchPattern };
