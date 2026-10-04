const Document = require("../models/Document");
const Subject = require("../models/Subject");
const mongoose = require("mongoose");
const { recordAuditEvent } = require("../utils/auditLog");

const cleanSubjectName = (value = "") => String(value).trim().replace(/\s+/g, " ");
const getSubjectNameKey = (value = "") => cleanSubjectName(value).toLocaleLowerCase("vi-VN");
const cleanSubjectCode = (value = "") => String(value).trim().toUpperCase();
const getNextSubjectCode = async () => {
  const existingCodes = await Subject.find({ code: /^IT\d+$/i }).select("code").lean();
  const maxNumber = existingCodes.reduce((max, subject) => {
    const match = /^IT(\d+)$/i.exec(subject.code || "");
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
  return `IT${String(maxNumber + 1).padStart(3, "0")}`;
};
const subjectNameFilter = (name) => ({ subjectName: { $regex: `^${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" } });
const inputError = (message, status = 400) => Object.assign(new Error(message), { status });
const validateSubject = (body) => {
  if (typeof body.name !== "string") throw inputError("Tên học phần phải từ 2 đến 120 ký tự");
  const name = cleanSubjectName(body.name);
  const code = typeof body.code === "string" ? cleanSubjectCode(body.code) : "";
  if (name.length < 2 || name.length > 120) throw inputError("Tên học phần phải từ 2 đến 120 ký tự");
  if (body.code !== undefined && typeof body.code !== "string") throw inputError("Mã học phần không hợp lệ");
  if (code && !/^[A-Z0-9][A-Z0-9._-]{0,19}$/.test(code)) throw inputError("Mã học phần tối đa 20 ký tự: chữ, số, dấu chấm, gạch ngang hoặc gạch dưới");
  if (body.active !== undefined && typeof body.active !== "boolean") throw inputError("Trạng thái học phần không hợp lệ");
  return { name, nameKey: getSubjectNameKey(name), code, active: body.active ?? true };
};
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
          _id: { subjectName: "$subjectName", resourceId: { $ifNull: ["$variantGroupId", "$_id"] } },
          views: { $sum: "$viewCount" },
          downloads: { $sum: "$downloadCount" },
        },
      },
      {
        $group: {
          _id: "$_id.subjectName",
          count: { $sum: 1 },
          views: { $sum: "$views" },
          downloads: { $sum: "$downloads" },
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
    if (subject.deleted) return [];
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

  return result.sort((first, second) => {
    if (first.code && second.code) {
      const codeOrder = first.code.localeCompare(second.code, "en", { numeric: true, sensitivity: "base" });
      if (codeOrder) return codeOrder;
    } else if (first.code || second.code) {
      return first.code ? -1 : 1;
    }
    return first.name.localeCompare(second.name, "vi");
  });
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
    const validated = validateSubject(req.body || {});
    const { name, nameKey, active } = validated;
    const code = validated.code || await getNextSubjectCode();

    const duplicateQuery = code ? { $or: [{ nameKey }, { code }] } : { nameKey };
    const existingSubject = await Subject.findOne(duplicateQuery).lean();
    if (existingSubject) {
      if (existingSubject.deleted && existingSubject.nameKey === nameKey) {
        const codeConflict = code ? await Subject.exists({ code, _id: { $ne: existingSubject._id } }) : null;
        if (codeConflict) return res.status(409).json({ message: "Mã học phần đã tồn tại" });
        existingSubject.name = name;
        existingSubject.code = code || undefined;
        existingSubject.active = active;
        existingSubject.deleted = false;
        await Subject.updateOne({ _id: existingSubject._id }, {
          $set: { name, nameKey, active, deleted: false, ...(code ? { code } : {}) },
          ...(!code ? { $unset: { code: 1 } } : {}),
        });
        return res.status(201).json({ message: "Đã khôi phục học phần", subject: existingSubject });
      }
      return res.status(409).json({ message: "Tên hoặc mã học phần đã tồn tại" });
    }

    const subject = await Subject.create({
      name,
      nameKey,
      active,
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
    return res.status(error.status || 500).json({ message: error.status ? error.message : "Không thể thêm học phần", error: error.message });
  }
};

// Legacy catalog entries are promoted within the same transaction as the edit/delete.
const findManagedSubject = async (id, session) => {
  if (typeof id === "string" && id.startsWith("legacy:")) {
    const key = id.slice(7);
    const saved = await Subject.findOne({ nameKey: key }).session(session);
    if (saved) {
      if (saved.deleted) throw inputError("Học phần đã bị xóa", 404);
      return saved;
    }
    const list = await buildSubjectList({ includeInactive: true });
    const legacy = list.find((item) => item.id === id);
    if (!legacy) throw inputError("Học phần không tồn tại", 404);
    const [subject] = await Subject.create([{ name: legacy.name, nameKey: key }], { session });
    return subject;
  }
  if (!mongoose.isObjectIdOrHexString(id)) throw inputError("Mã học phần không hợp lệ");
  const subject = await Subject.findById(id).session(session);
  if (!subject || subject.deleted) throw inputError("Học phần không tồn tại", 404);
  return subject;
};

exports.updateSubject = async (req, res) => {
  try {
    const next = validateSubject(req.body || {});
    let result;
    await mongoose.connection.transaction(async (session) => {
      const subject = await findManagedSubject(req.params.id, session);
      const previous = { name: subject.name, code: subject.code || "", active: subject.active };
      const duplicates = await Subject.find({
        _id: { $ne: subject._id },
        $or: [{ nameKey: next.nameKey }, ...(next.code ? [{ code: next.code }] : [])],
      }).session(session);
      if (duplicates.some(item => !item.deleted)) throw inputError("Tên hoặc mã học phần đã tồn tại", 409);
      // A previously removed name can be reused, including undoing a rename.
      for (const duplicate of duplicates) await Subject.deleteOne({ _id: duplicate._id }, { session });
      const documents = { $or: [{ subjectId: subject._id }, subjectNameFilter(previous.name)] };
      Object.assign(subject, next, { code: next.code || undefined });
      await subject.save({ session });
      const updated = await Document.updateMany(documents, { $set: { subjectId: subject._id, subjectName: next.name } }, { session });
      // Keep a tombstone for renamed built-in entries so fallback names cannot reappear.
      if (getSubjectNameKey(previous.name) !== next.nameKey && defaultSubjectNames.some((name) => getSubjectNameKey(name) === getSubjectNameKey(previous.name))) {
        await Subject.create([{ name: previous.name, nameKey: getSubjectNameKey(previous.name), active: false, deleted: true }], { session });
      }
      result = { subject, previous, updatedDocuments: updated.modifiedCount };
    });
    await recordAuditEvent({ actor: req.user, action: "subject_updated", entityType: "Subject", entityId: result.subject._id, metadata: { title: result.subject.name, previous: result.previous, updatedDocuments: result.updatedDocuments } });
    return res.json({ message: "Cập nhật học phần thành công", subject: result.subject, updatedDocuments: result.updatedDocuments });
  } catch (error) {
    return res.status(error.code === 11000 ? 409 : error.status || 500).json({ message: error.code === 11000 ? "Tên hoặc mã học phần đã tồn tại" : error.status ? error.message : "Không thể cập nhật học phần" });
  }
};

exports.deleteSubject = async (req, res) => {
  try {
    let subject;
    await mongoose.connection.transaction(async (session) => {
      subject = await findManagedSubject(req.params.id, session);
      const count = await Document.countDocuments({ $or: [{ subjectId: subject._id }, subjectNameFilter(subject.name)] }).session(session);
      if (count > 0) throw inputError(`Học phần đang có ${count} tài liệu. Hãy ngừng sử dụng hoặc chuyển tài liệu sang học phần khác trước khi xóa.`, 409);
      subject.deleted = true;
      subject.active = false;
      subject.code = undefined;
      await subject.save({ session });
    });
    await recordAuditEvent({ actor: req.user, action: "subject_deleted", entityType: "Subject", entityId: subject._id, metadata: { title: subject.name } });
    return res.json({ message: "Đã xóa học phần khỏi danh mục", subjectId: req.params.id });
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.status ? error.message : "Không thể xóa học phần" });
  }
};

exports.cleanSubjectName = cleanSubjectName;
exports.getSubjectNameKey = getSubjectNameKey;
