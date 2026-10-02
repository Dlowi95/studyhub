const mongoose = require("mongoose");
const User = require("../models/user");
const Document = require("../models/Document");

const isValidId = (value) => mongoose.isObjectIdOrHexString(value);

const documentProjection = "title description fileUrl fileName fileType fileSize subjectId subjectName uploaderId status tags viewCount downloadCount avgRating createdAt updatedAt";

const publicDocument = (document) => {
  if (!document) return null;
  const value = typeof document.toObject === "function" ? document.toObject() : document;
  return { ...value, id: value._id };
};

exports.getMyBookmarks = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate({
      path: "bookmarkedDocuments",
      match: { status: "approved" },
      select: documentProjection,
      populate: { path: "uploaderId", select: "name" },
    });

    if (!user) return res.status(401).json({ message: "Tài khoản không còn tồn tại" });
    const bookmarks = (user.bookmarkedDocuments || []).filter(Boolean).map(publicDocument);
    return res.json({ bookmarks, count: bookmarks.length });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi lấy tài liệu đã lưu", error: error.message });
  }
};

exports.getBookmarkStatus = async (req, res) => {
  try {
    const { documentId } = req.params;
    if (!isValidId(documentId)) return res.status(400).json({ message: "Mã tài liệu không hợp lệ" });
    const user = await User.findById(req.user._id).select("bookmarkedDocuments");
    if (!user) return res.status(401).json({ message: "Tài khoản không còn tồn tại" });
    const document = await Document.exists({ _id: documentId, status: "approved" });
    return res.json({ bookmarked: Boolean(document && user.bookmarkedDocuments?.some((id) => id.toString() === documentId)) });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi kiểm tra tài liệu đã lưu", error: error.message });
  }
};

exports.addBookmark = async (req, res) => {
  try {
    const { documentId } = req.params;
    if (!isValidId(documentId)) return res.status(400).json({ message: "Mã tài liệu không hợp lệ" });
    const document = await Document.findOne({ _id: documentId, status: "approved" }).select(documentProjection);
    if (!document) return res.status(404).json({ message: "Tài liệu không tồn tại hoặc chưa được duyệt" });

    await User.findByIdAndUpdate(req.user._id, { $addToSet: { bookmarkedDocuments: document._id } });
    return res.status(201).json({ bookmarked: true, document: publicDocument(document) });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi lưu tài liệu", error: error.message });
  }
};

exports.removeBookmark = async (req, res) => {
  try {
    const { documentId } = req.params;
    if (!isValidId(documentId)) return res.status(400).json({ message: "Mã tài liệu không hợp lệ" });
    await User.findByIdAndUpdate(req.user._id, { $pull: { bookmarkedDocuments: documentId } });
    return res.json({ bookmarked: false, documentId });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi bỏ lưu tài liệu", error: error.message });
  }
};
