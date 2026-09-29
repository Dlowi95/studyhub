const fs = require("fs");
const path = require("path");
const User = require("../models/user");
const Document = require("../models/Document");
const Review = require("../models/review");
const Report = require("../models/report");
const { deleteDocumentPhysicalFile } = require("../utils/fileCleanup");
const { extractOfficePreview } = require("../utils/officePreview");

const uploadDirectory = path.resolve(__dirname, "..", "uploads");
const maxPreviewSize = 25 * 1024 * 1024;
const previewMimeTypes = {
  pdf: "application/pdf",
  txt: "text/plain; charset=utf-8",
};

const getDocumentPreviewFormat = (document) => {
  const fileName = String(document.fileName || "").toLowerCase();
  const fileType = String(document.fileType || "").toLowerCase();
  const fileUrl = String(document.fileUrl || "").toLowerCase().split("?")[0];

  if (fileName.endsWith(".pdf") || fileUrl.endsWith(".pdf") || fileType.includes("pdf")) return "pdf";
  if (fileName.endsWith(".txt") || fileUrl.endsWith(".txt") || fileType.includes("text") || fileType === "txt") return "txt";
  if (fileName.endsWith(".docx") || fileUrl.endsWith(".docx") || fileType.includes("wordprocessing") || fileType === "docx") return "docx";
  if (fileName.endsWith(".pptx") || fileUrl.endsWith(".pptx") || fileType.includes("presentation") || fileType === "pptx") return "pptx";
  if (fileName.endsWith(".xlsx") || fileUrl.endsWith(".xlsx") || fileType.includes("spreadsheet") || fileType === "xlsx") return "xlsx";
  return "";
};

const readPreviewSource = async (fileUrl) => {
  const parsedUrl = new URL(fileUrl, "http://studyhub.local");

  if (parsedUrl.pathname.startsWith("/uploads/")) {
    const localFileName = path.basename(decodeURIComponent(parsedUrl.pathname));
    const localPath = path.resolve(uploadDirectory, localFileName);
    if (!localPath.startsWith(`${uploadDirectory}${path.sep}`)) {
      throw new Error("Đường dẫn tệp không hợp lệ");
    }
    const stats = await fs.promises.stat(localPath);
    if (stats.size > maxPreviewSize) throw new Error("Tệp vượt quá giới hạn xem trước 25MB");
    return fs.promises.readFile(localPath);
  }

  const isCloudinarySource =
    parsedUrl.protocol === "https:" &&
    (parsedUrl.hostname === "res.cloudinary.com" || parsedUrl.hostname.endsWith(".cloudinary.com"));
  if (!isCloudinarySource) {
    throw new Error("Nguồn tệp này không được phép xem trước");
  }

  const response = await fetch(parsedUrl, {
    redirect: "follow",
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error("Không thể đọc tệp từ kho lưu trữ");

  const contentLength = Number(response.headers.get("content-length") || 0);
  if (contentLength > maxPreviewSize) throw new Error("Tệp vượt quá giới hạn xem trước 25MB");

  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length > maxPreviewSize) throw new Error("Tệp vượt quá giới hạn xem trước 25MB");
  return buffer;
};

const parseTags = (tagsValue) => {
  if (Array.isArray(tagsValue)) return tagsValue.map((tag) => String(tag).trim()).filter(Boolean);
  if (typeof tagsValue === "string") {
    return tagsValue
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }
  return [];
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({}, "-passwordHash").sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching users", error: error.message });
  }
};

exports.getAllDocuments = async (req, res) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};

    const documents = await Document.find(query)
      .populate("uploaderId", "name email")
      .sort({ createdAt: -1 });

    res.json(documents);
  } catch (error) {
    res.status(500).json({ message: "Server error fetching documents", error: error.message });
  }
};

exports.getDocumentById = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id).populate("uploaderId", "name email");

    if (!document) {
      return res.status(404).json({ message: "Tài liệu không tồn tại" });
    }

    return res.json(document);
  } catch (error) {
    return res.status(500).json({ message: "Server error fetching document", error: error.message });
  }
};

exports.previewDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id).lean();
    if (!document) {
      return res.status(404).json({ message: "Tài liệu không tồn tại" });
    }

    const format = getDocumentPreviewFormat(document);
    if (!format) {
      return res.status(415).json({
        message: "Định dạng này chưa hỗ trợ xem trước an toàn",
      });
    }

    const buffer = await readPreviewSource(document.fileUrl);
    if (["docx", "pptx", "xlsx"].includes(format)) {
      const preview = extractOfficePreview(buffer, format);
      res.setHeader("Cache-Control", "private, no-store");
      res.setHeader("X-Content-Type-Options", "nosniff");
      return res.json(preview);
    }

    const originalName = document.fileName || `tai-lieu.${format}`;
    const safeAsciiName = originalName.replace(/[^\x20-\x7E]/g, "_").replace(/["\\]/g, "_");

    res.setHeader("Content-Type", previewMimeTypes[format]);
    res.setHeader(
      "Content-Disposition",
      `inline; filename="${safeAsciiName}"; filename*=UTF-8''${encodeURIComponent(originalName)}`
    );
    res.setHeader("Content-Length", buffer.length);
    res.setHeader("Cache-Control", "private, no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Content-Security-Policy", "sandbox; default-src 'none'");
    return res.send(buffer);
  } catch (error) {
    const status = error?.code === "ENOENT" ? 404 : 502;
    return res.status(status).json({
      message: error?.code === "ENOENT" ? "Không tìm thấy tệp trên máy chủ" : error.message || "Không thể tạo bản xem trước",
    });
  }
};

exports.createDocument = async (req, res) => {
  try {
    const {
      title,
      description,
      fileUrl,
      fileName,
      fileType,
      subjectName,
      tags,
      status,
    } = req.body;

    if (!title || !subjectName || !fileUrl) {
      return res.status(400).json({ message: "Thiếu tiêu đề, học phần hoặc đường dẫn file" });
    }

    const nextStatus = ["pending", "approved", "rejected"].includes(status) ? status : "pending";

    const document = await Document.create({
      title: String(title).trim(),
      description: description || "",
      fileUrl,
      fileName: fileName || "",
      fileType: fileType || "FILE",
      subjectName: subjectName || "Khác",
      tags: parseTags(tags),
      status: nextStatus,
      uploaderId: req.user?._id || null,
    });

    return res.status(201).json({
      message: "Tạo tài liệu thành công",
      document,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error creating document", error: error.message });
  }
};

exports.updateDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ message: "Tài liệu không tồn tại" });
    }

    const {
      title,
      description,
      fileUrl,
      fileName,
      fileType,
      subjectName,
      tags,
      status,
    } = req.body;

    if (title !== undefined) document.title = String(title).trim();
    if (description !== undefined) document.description = description || "";
    if (fileUrl !== undefined) document.fileUrl = fileUrl;
    if (fileName !== undefined) document.fileName = fileName || "";
    if (fileType !== undefined) document.fileType = fileType || "FILE";
    if (subjectName !== undefined) document.subjectName = subjectName || "Khác";
    if (tags !== undefined) document.tags = parseTags(tags);
    if (status !== undefined) {
      if (!["pending", "approved", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Status không hợp lệ" });
      }
      document.status = status;
    }

    await document.save();

    return res.json({
      message: "Cập nhật tài liệu thành công",
      document,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error updating document", error: error.message });
  }
};

exports.deleteDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ message: "Tài liệu không tồn tại" });
    }

    // Xoá file vật lý & xoá cascade reviews, reports
    await Promise.allSettled([
      deleteDocumentPhysicalFile(document.fileUrl),
      Review.deleteMany({ documentId: req.params.id }),
      Report.deleteMany({ documentId: req.params.id }),
    ]);

    await Document.findByIdAndDelete(req.params.id);

    return res.json({
      message: "Xoá tài liệu thành công",
      documentId: req.params.id,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error deleting document", error: error.message });
  }
};

exports.updateDocumentStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Status không hợp lệ" });
    }

    const document = await Document.findByIdAndUpdate(req.params.id, { status }, { new: true }).populate("uploaderId", "name email");

    if (!document) {
      return res.status(404).json({ message: "Tài liệu không tồn tại" });
    }

    return res.json({
      message: "Cập nhật trạng thái tài liệu thành công",
      document,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error updating document status", error: error.message });
  }
};

exports.updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["active", "blocked"].includes(status)) {
      return res.status(400).json({ message: "Invalid status value. Use 'active' or 'blocked'" });
    }

    // Admin should not block themselves
    if (req.user._id.toString() === id) {
      return res.status(400).json({ message: "You cannot change your own status" });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.status = status;
    await user.save();

    res.json({
      message: `User account is now ${status}`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error updating user status", error: error.message });
  }
};

// PUT /api/admin/users/:id/role (Yêu cầu 3)
exports.updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    const validRoles = ["student", "moderator", "admin"];
    if (!validRoles.includes(role)) {
      return res.status(400).json({
        message: "Vai trò không hợp lệ. Chỉ chấp nhận: 'student', 'moderator' hoặc 'admin'",
      });
    }

    // Không cho phép Admin tự đổi vai trò của chính mình
    if (req.user._id.toString() === id) {
      return res.status(400).json({
        message: "Bạn không thể tự thay đổi vai trò của chính mình",
      });
    }

    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    }

    user.role = role;
    await user.save();

    res.json({
      message: `Đã cập nhật vai trò người dùng thành '${role}' thành công`,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Lỗi server khi cập nhật vai trò người dùng",
      error: error.message,
    });
  }
};
