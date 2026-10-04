const User = require("../models/user");
const Document = require("../models/Document");
const mongoose = require("mongoose");
const { removeDocument } = require("../utils/removeDocument");
const { resolveSubject } = require("../utils/resolveSubject");
const { applyModerationNote } = require("../utils/moderationNote");
const { checkDocumentSource } = require("../utils/documentStorage");
const {
  sendDocumentPreviewError,
  sendSafeDocumentPreview,
} = require("../utils/safeDocumentPreview");
const { notifyDocumentStatus, notifyFollowersOfNewDocument } = require("../utils/notificationService");
const AuditLog = require("../models/AuditLog");
const { recordAuditEvent } = require("../utils/auditLog");

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
    // Moderators only need the active review queue; never expose the full catalog here.
    const query = req.user?.role === "moderator" ? { status: "pending" } : (status ? { status } : {});

    const documents = await Document.find(query)
      .populate("uploaderId", req.user?.role === "moderator" ? "name" : "name email")
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
    const document = await Document.findById(req.params.id).populate("uploaderId", req.user?.role === "moderator" ? "name" : "name email");

    if (!document || (req.user?.role === "moderator" && document.status !== "pending")) {
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
    if (!document || (req.user?.role === "moderator" && document.status !== "pending")) {
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

    if (typeof title !== "string" || !title.trim() || title.trim().length > 200 || !subjectName || !fileUrl) {
      return res.status(400).json({ message: "Thiếu tiêu đề, học phần hoặc đường dẫn file" });
    }

    const nextStatus = ["pending", "approved", "rejected"].includes(status) ? status : "pending";
    const subject = await resolveSubject(req.body.subjectId, subjectName);
    if (nextStatus === "approved") {
      const source = await checkDocumentSource(fileUrl);
      if (source.available === false) return res.status(409).json({ message: source.issue || "Tệp nguồn không khả dụng" });
    }

    const document = await Document.create({
      title: String(title).trim(),
      description: description || "",
      fileUrl,
      fileName: fileName || "",
      fileType: fileType || "FILE",
      ...subject,
      tags: parseTags(tags),
      status: nextStatus,
      uploaderId: req.user?._id || null,
    });

    return res.status(201).json({
      message: "Tạo tài liệu thành công",
      document,
    });
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.status ? error.message : "Server error creating document", error: error.message });
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

    const previousStatus = document.status;
    if (title !== undefined && (typeof title !== "string" || !title.trim() || title.trim().length > 200)) {
      return res.status(400).json({ message: "Tiêu đề phải từ 1 đến 200 ký tự" });
    }
    if (title !== undefined) document.title = String(title).trim();
    if (description !== undefined) document.description = description || "";
    if (fileUrl !== undefined) document.fileUrl = fileUrl;
    if (fileName !== undefined) document.fileName = fileName || "";
    if (fileType !== undefined) {
      const nextFileType = String(fileType || "FILE").trim().toUpperCase();
      if (document.variantGroupId && nextFileType !== document.fileType) {
        const duplicateFormat = await Document.exists({
          variantGroupId: document.variantGroupId,
          _id: { $ne: document._id },
          variantFormatKey: nextFileType,
        });
        if (duplicateFormat) return res.status(409).json({ message: `Nhóm tài liệu đã có bản ${nextFileType}.` });
      }
      document.fileType = nextFileType;
    }
    if (subjectName !== undefined || req.body.subjectId !== undefined) {
      Object.assign(document, await resolveSubject(req.body.subjectId, subjectName));
    }
    if (tags !== undefined) document.tags = parseTags(tags);
    if (status !== undefined) {
      if (!["pending", "approved", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Status không hợp lệ" });
      }
      document.status = status;
      applyModerationNote(document, status, req.body.moderationNote);
    }
    if (document.variantGroupId) {
      document.variantFormatKey = document.status === "rejected" ? undefined : document.fileType;
    }

    if (document.status === "approved" && (previousStatus !== "approved" || fileUrl !== undefined)) {
      const source = await checkDocumentSource(document.fileUrl);
      if (source.available === false) return res.status(409).json({ message: source.issue || "Tệp nguồn không khả dụng" });
    }
    await document.save();
    if (document.variantGroupId) {
      await Document.updateMany(
        { variantGroupId: document.variantGroupId, _id: { $ne: document._id } },
        {
          $set: {
            title: document.title,
            description: document.description,
            subjectId: document.subjectId,
            subjectName: document.subjectName,
            tags: document.tags,
          },
        }
      );
    }
    if (previousStatus !== document.status) await notifyDocumentStatus(document, document.status).catch((error) => {
      console.error("Không thể tạo thông báo trạng thái tài liệu:", error.message);
    });
    if (previousStatus !== "approved" && document.status === "approved") {
      await notifyFollowersOfNewDocument(document).catch((error) => {
        console.error("Không thể thông báo tài liệu mới cho người theo dõi:", error.message);
      });
    }

    return res.json({
      message: "Cập nhật tài liệu thành công",
      document,
    });
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.status ? error.message : "Server error updating document", error: error.message });
  }
};

exports.deleteDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id);

    if (!document) {
      return res.status(404).json({ message: "Tài liệu không tồn tại" });
    }

    await removeDocument(document);

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

    if (req.user?.role === "moderator" && (document.status !== "pending" || !["approved", "rejected"].includes(status))) {
      return res.status(403).json({ message: "Kiểm duyệt viên chỉ được xử lý tài liệu đang chờ duyệt" });
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
    applyModerationNote(document, status, req.body.moderationNote);
    document.status = status;
    if (document.variantGroupId) {
      document.variantFormatKey = status === "rejected" ? undefined : document.fileType;
    }
    await document.save();
    if (previousStatus !== status) {
      await recordAuditEvent({
        actor: req.user,
        action: "document_status_changed",
        entityType: "Document",
        entityId: document._id,
        documentId: document._id,
        previousStatus,
        nextStatus: status,
        reason: document.moderationNote,
        metadata: { title: document.title },
      });
    }
    if (previousStatus !== status) {
      await notifyDocumentStatus(document, status).catch((notificationError) => {
        console.error("Không thể tạo thông báo trạng thái tài liệu:", notificationError.message);
      });
      if (previousStatus !== "approved" && status === "approved") {
        await notifyFollowersOfNewDocument(document).catch((notificationError) => {
          console.error("Không thể thông báo tài liệu mới cho người theo dõi:", notificationError.message);
        });
      }
    }
    await document.populate("uploaderId", "name email");

    return res.json({
      message: "Cập nhật trạng thái tài liệu thành công",
      document,
    });
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.status ? error.message : "Server error updating document status", error: error.message });
  }
};

exports.getAuditLogs = async (req, res) => {
  try {
    const page = Math.min(10000, Math.max(1, parseInt(req.query.page, 10) || 1));
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 30));
    const query = {};
    if (typeof req.query.action === "string" && req.query.action.trim()) query.action = req.query.action.trim();
    if (typeof req.query.entityType === "string" && req.query.entityType.trim()) query.entityType = req.query.entityType.trim();
    if (typeof req.query.documentId === "string" && req.query.documentId.trim()) {
      if (!mongoose.isObjectIdOrHexString(req.query.documentId)) return res.status(400).json({ message: "Mã tài liệu không hợp lệ" });
      query.documentId = req.query.documentId.trim();
    }
    const [items, total] = await Promise.all([
      AuditLog.find(query)
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("actorId", "name email role")
        .lean(),
      AuditLog.countDocuments(query),
    ]);
    return res.json({ items, page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi lấy nhật ký kiểm duyệt", error: error.message });
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
