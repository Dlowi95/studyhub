const User = require("../models/user");
const Document = require("../models/Document");
const Notification = require("../models/Notification");
const Review = require("../models/review");
const Report = require("../models/report");
const { deleteDocumentPhysicalFile } = require("../utils/fileCleanup");
const { checkDocumentSource } = require("../utils/documentStorage");
const {
  sendDocumentPreviewError,
  sendSafeDocumentPreview,
} = require("../utils/safeDocumentPreview");
const { notifyDocumentStatus } = require("../utils/notificationService");

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

    const items = await Promise.all(
      documents.map(async (document) => {
        const sourceStatus = await checkDocumentSource(document.fileUrl);
        return {
          ...document.toObject(),
          fileAvailable: sourceStatus.available,
          fileIssue: sourceStatus.issue,
          storageProvider: document.storageProvider || sourceStatus.storage,
        };
      })
    );

    res.json(items);
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

    return await sendSafeDocumentPreview(document, res);
  } catch (error) {
    return sendDocumentPreviewError(res, error);
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
      deleteDocumentPhysicalFile(document),
      Review.deleteMany({ documentId: req.params.id }),
      Report.deleteMany({ documentId: req.params.id }),
      Notification.deleteMany({ relatedDocumentId: req.params.id }),
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

    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ message: "Tài liệu không tồn tại" });
    }

    if (status === "approved") {
      const sourceStatus = await checkDocumentSource(document.fileUrl);
      if (sourceStatus.available === false) {
        return res.status(409).json({
          message: sourceStatus.issue || "Không thể duyệt vì tệp nguồn không còn khả dụng",
          code: "DOCUMENT_FILE_MISSING",
        });
      }
    }

    const previousStatus = document.status;
    document.status = status;
    await document.save();
    if (previousStatus !== status) {
      await notifyDocumentStatus(document, status).catch((notificationError) => {
        console.error("Không thể tạo thông báo trạng thái tài liệu:", notificationError.message);
      });
    }
    await document.populate("uploaderId", "name email");

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
