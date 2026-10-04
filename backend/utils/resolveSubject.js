const mongoose = require("mongoose");
const Subject = require("../models/Subject");

async function resolveSubject(subjectId, subjectName) {
  const name = typeof subjectName === "string" ? subjectName.trim().replace(/\s+/g, " ") : "";
  if ((!subjectId && name.length < 2) || name.length > 120) {
    const error = new Error("Tên học phần phải từ 2 đến 120 ký tự");
    error.status = 400;
    throw error;
  }
  if (subjectId && !mongoose.isObjectIdOrHexString(subjectId)) {
    const error = new Error("Mã học phần không hợp lệ"); error.status = 400; throw error;
  }
  const saved = subjectId
    ? await Subject.findById(subjectId).lean()
    : await Subject.findOne({ nameKey: name.toLocaleLowerCase("vi-VN") }).lean();
  if ((subjectId && !saved) || saved?.active === false || saved?.deleted === true) {
    const error = new Error("Học phần không tồn tại hoặc đã ngừng hoạt động"); error.status = 400; throw error;
  }
  return { subjectId: saved?._id || null, subjectName: saved?.name || name };
}
module.exports = { resolveSubject };
