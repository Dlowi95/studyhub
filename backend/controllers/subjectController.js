const Document = require("../models/Document");
const Subject = require("../models/Subject");

const cleanSubjectName = (value = "") => String(value).trim().replace(/\s+/g, " ");
const getSubjectNameKey = (value = "") => cleanSubjectName(value).toLocaleLowerCase("vi-VN");
const cleanSubjectCode = (value = "") => String(value).trim().toUpperCase();
const defaultSubjectNames = [
  "Giải tích",
  "Đại số tuyến tính",
  "Triết học Mác-Lênin",
  "Cấu trúc dữ liệu & Giải thuật",
  "Lập trình C/C++",
  "Vật lý đại cương",
  "Kinh tế vĩ mô",
  "Mạng máy tính",
  "Công nghệ phần mềm",
  "Cơ sở dữ liệu",
  "Lập trình Web",
  "An toàn thông tin",
  "Khác",
];

const buildSubjectList = async ({ includeInactive = false } = {}) => {
  const [savedSubjects, documentUsage] = await Promise.all([
    Subject.find({}).sort({ name: 1 }).lean(),
    Document.aggregate([
      { $match: { subjectName: { $type: "string", $ne: "" }, ...(!includeInactive ? { status: "approved" } : {}) } },
      {
        $group: {
          _id: "$subjectName",
          count: { $sum: 1 },
          views: { $sum: "$viewCount" },
          downloads: { $sum: "$downloadCount" },
        },
      },
    ]),
  ]);

  const usageByName = new Map();
  documentUsage.forEach((item) => {
    const name = cleanSubjectName(item._id || "Khác") || "Khác";
    const key = getSubjectNameKey(name);
    const current = usageByName.get(key) || { name, count: 0, views: 0, downloads: 0 };
    current.count += item.count || 0;
    current.views += item.views || 0;
    current.downloads += item.downloads || 0;
    usageByName.set(key, current);
  });

  const result = savedSubjects.flatMap((subject) => {
    const usage = usageByName.get(subject.nameKey) || { count: 0, views: 0, downloads: 0 };
    usageByName.delete(subject.nameKey);
    if (!includeInactive && subject.active === false) return [];
    return [{
      id: subject._id,
      _id: subject._id,
      name: subject.name,
      code: subject.code || "",
      active: subject.active,
      count: usage.count,
      views: usage.views,
      downloads: usage.downloads,
    }];
  });

  const savedNameKeys = new Set(savedSubjects.map((subject) => subject.nameKey));
  defaultSubjectNames.forEach((name) => {
    const key = getSubjectNameKey(name);
    if (!savedNameKeys.has(key) && !usageByName.has(key)) {
      usageByName.set(key, { name, count: 0, views: 0, downloads: 0, isDefault: true });
    }
  });

  usageByName.forEach((usage, key) => {
    result.push({
      id: `legacy:${key}`,
      name: usage.name,
      code: "",
      active: true,
      count: usage.count,
      views: usage.views,
      downloads: usage.downloads,
      legacy: true,
      default: Boolean(usage.isDefault),
    });
  });

  return result.sort((first, second) => first.name.localeCompare(second.name, "vi"));
};

exports.getPublicSubjects = async (req, res) => {
  try {
    const subjects = await buildSubjectList();
    return res.json({ subjects });
  } catch (error) {
    return res.status(500).json({ message: "Không thể lấy danh sách học phần", error: error.message });
  }
};

exports.getAdminSubjects = async (req, res) => {
  try {
    const subjects = await buildSubjectList({ includeInactive: true });
    return res.json({ subjects });
  } catch (error) {
    return res.status(500).json({ message: "Không thể lấy danh sách học phần", error: error.message });
  }
};

exports.createSubject = async (req, res) => {
  try {
    const name = cleanSubjectName(req.body?.name);
    const nameKey = getSubjectNameKey(name);
    const code = cleanSubjectCode(req.body?.code);

    if (name.length < 2 || name.length > 120) {
      return res.status(400).json({ message: "Tên học phần phải từ 2 đến 120 ký tự" });
    }

    if (code && !/^[A-Z0-9][A-Z0-9._-]{0,19}$/.test(code)) {
      return res.status(400).json({
        message: "Mã học phần chỉ gồm chữ in hoa, số, dấu chấm, gạch ngang hoặc gạch dưới",
      });
    }

    const duplicateQuery = code ? { $or: [{ nameKey }, { code }] } : { nameKey };
    const existingSubject = await Subject.findOne(duplicateQuery).lean();
    if (existingSubject) {
      return res.status(409).json({ message: "Tên hoặc mã học phần đã tồn tại" });
    }

    const subject = await Subject.create({
      name,
      nameKey,
      ...(code ? { code } : {}),
    });
    const count = await Document.countDocuments({
      subjectName: { $regex: `^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
    });

    return res.status(201).json({
      message: "Thêm học phần thành công",
      subject: {
        id: subject._id,
        _id: subject._id,
        name: subject.name,
        code: subject.code || "",
        active: subject.active,
        count,
        views: 0,
        downloads: 0,
      },
    });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: "Tên hoặc mã học phần đã tồn tại" });
    }
    return res.status(500).json({ message: "Không thể thêm học phần", error: error.message });
  }
};

exports.cleanSubjectName = cleanSubjectName;
exports.getSubjectNameKey = getSubjectNameKey;
