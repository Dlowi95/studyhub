const path = require("path");
const cloudinary = require("../config/cloudinary");
const Document = require("../models/Document");
const mongoose = require("mongoose");
const { buildPublicDocumentQuery, searchPattern } = require("../utils/documentQuery");
const { resolveSubject } = require("../utils/resolveSubject");
const { removeDocument } = require("../utils/removeDocument");
const { applyModerationNote } = require("../utils/moderationNote");
const { deleteDocumentPhysicalFile } = require("../utils/fileCleanup");
const { validateDocumentFile } = require("../utils/documentFileValidation");
const { checkDocumentSource, saveBufferToGridFs } = require("../utils/documentStorage");
const {
  sendDocumentPreviewError,
  sendSafeDocumentPreview,
} = require("../utils/safeDocumentPreview");
const {
  notifyDocumentStatus,
  notifyDocumentSubmitted,
} = require("../utils/notificationService");
const { claimInteraction } = require("../utils/trackDocumentInteraction");

const getInteractionSession = (req) => {
  if (!req?.headers) return null;
  const explicit = req.headers["x-studyhub-session"];
  if (explicit) return explicit;
  return `${req.ip || "anonymous"}:${req.headers["user-agent"] || ""}`;
};

const sanitizeFileName = (name = "") => {
  const extension = path.extname(name || "");
  const baseName = path.basename(name, extension).trim();
  const normalized = baseName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "document";

  return `${normalized}${extension}`;
};

const getRequestBaseUrl = (req) =>
  String(process.env.BASE_URL || `${req.protocol}://${req.get("host")}`).replace(/\/$/, "");

const saveToGridFs = async (file, req) => {
  const storedFile = await saveBufferToGridFs(file);
  return {
    fileUrl: `${getRequestBaseUrl(req)}/api/files/${storedFile.storageKey}`,
    storageProvider: "gridfs",
    storageKey: storedFile.storageKey,
  };
};

exports.uploadDocument = async (req, res) => {
  let storedSource;
  let saved = false;
  try {
    const { title, description, subjectId, subjectName, tags } = req.body;
    const uploaderId = req.user?._id;

    if (!req.file) {
      return res.status(400).json({ message: "Vui lòng chọn file để upload" });
    }

    if (typeof title !== "string" || !title.trim() || title.trim().length > 200) {
      return res.status(400).json({
        message: "Tiêu đề phải từ 1 đến 200 ký tự",
      });
    }
    if (description !== undefined && (typeof description !== "string" || description.length > 10000)) {
      return res.status(400).json({ message: "Mô tả tối đa 10.000 ký tự" });
    }
    const subject = await resolveSubject(subjectId, subjectName);
    const parsedTags = Array.isArray(tags) ? tags : typeof tags === "string" ? tags.split(",") : [];
    if (parsedTags.length > 20 || parsedTags.some((tag) => typeof tag !== "string" || tag.length > 80)) {
      return res.status(400).json({ message: "Tối đa 20 từ khóa, mỗi từ khóa tối đa 80 ký tự" });
    }

    const fileValidation = validateDocumentFile(req.file);
    if (!fileValidation.valid) {
      return res.status(400).json({ message: fileValidation.message });
    }

    if (cloudinary.isConfigured) {
      try {
        const result = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              resource_type: "raw",
              folder: "studyhub/documents",
              public_id: `${Date.now()}-${sanitizeFileName(req.file.originalname).replace(/\.[^/.]+$/, "")}`,
            },
            (error, uploadResult) => {
              if (error) reject(error);
              else resolve(uploadResult);
            }
          );

          stream.end(req.file.buffer);
        });

        storedSource = {
          fileUrl: result.secure_url,
          storageProvider: "cloudinary",
          storageKey: result.public_id,
        };
      } catch (cloudError) {
        console.warn("Cloudinary upload failed, falling back to shared GridFS storage.", cloudError.message);
        storedSource = await saveToGridFs(req.file, req);
      }
    } else {
      storedSource = await saveToGridFs(req.file, req);
    }

    const doc = new Document({
      title: title.trim(),
      description: description?.trim() || "",
      fileUrl: storedSource.fileUrl,
      fileName: req.file.originalname,
      fileType: fileValidation.fileType,
      fileSize: req.file.size || 0,
      storageProvider: storedSource.storageProvider,
      storageKey: storedSource.storageKey,
      ...subject,
      uploaderId: uploaderId || null,
      tags: [...new Set(parsedTags.map((tag) => tag.trim()).filter(Boolean))],
      status: "pending",
    });

    await doc.save();
    saved = true;
    await notifyDocumentSubmitted(doc).catch((notificationError) => {
      console.error("Không thể tạo thông báo tài liệu mới:", notificationError.message);
    });

    return res.status(201).json({
      message: "Upload tài liệu thành công",
      document: doc,
    });
  } catch (error) {
    if (storedSource && !saved) await deleteDocumentPhysicalFile(storedSource);
    console.error(error);
    return res.status(error.status || 500).json({
      message: error.status ? error.message : "Lỗi upload tài liệu",
      error: error.message,
    });
  }
};

exports.getDocuments = async (req, res) => {
  try {
    const { query, sort, page: pageNum, limit: perPage } = buildPublicDocumentQuery(req.query);
    const docsQuery = Document.find(query).sort(sort);

    const [docs, total] = await Promise.all([
      docsQuery
        .skip((pageNum - 1) * perPage)
        .limit(perPage)
        .populate("uploaderId", "name"),
      Document.countDocuments(query),
    ]);

    const items = await Promise.all(
      docs.map(async (document) => {
        const sourceStatus = await checkDocumentSource(document.fileUrl);
        return {
          ...document.toObject(),
          fileAvailable: sourceStatus.available,
          fileIssue: sourceStatus.issue,
          storageProvider: document.storageProvider || sourceStatus.storage,
        };
      })
    );

    return res.json({
      items,
      page: pageNum,
      limit: perPage,
      total,
      totalPages: Math.ceil(total / perPage),
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      message: error.status ? error.message : "Lỗi lấy danh sách tài liệu",
      error: error.message,
    });
  }
};

exports.getSearchSuggestions = async (req, res) => {
  try {
    const q = typeof req.query.q === "string" ? req.query.q.trim().slice(0, 200) : "";
    if (q.length < 2) return res.json({ documents: [], subjects: [] });
    const { query } = buildPublicDocumentQuery(req.query);
    const titleMatch = { title: { $regex: searchPattern(q), $options: "i" } };
    const projection = "title subjectName fileType";
    const [titleDocuments, otherDocuments, subjects] = await Promise.all([
      Document.find({ $and: [query, titleMatch] }).sort({ downloadCount: -1, createdAt: -1, _id: -1 }).limit(6).select(projection).lean(),
      Document.find(query).sort({ downloadCount: -1, createdAt: -1, _id: -1 }).limit(6).select(projection).lean(),
      Document.aggregate([
        { $match: { $and: [query, { subjectName: { $regex: searchPattern(q), $options: "i" } }] } },
        { $group: { _id: "$subjectName", count: { $sum: 1 } } },
        { $sort: { count: -1, _id: 1 } }, { $limit: 3 },
        { $project: { _id: 0, name: "$_id", count: 1 } },
      ]),
    ]);
    const unique = new Map([...titleDocuments, ...otherDocuments].map((doc) => [String(doc._id), doc]));
    return res.json({ documents: [...unique.values()].slice(0, 6), subjects });
  } catch (error) {
    return res.status(error.status || 500).json({ message: error.status ? error.message : "Chưa tải được gợi ý tìm kiếm" });
  }
};

exports.getDocumentById = async (req, res) => {
  try {
    if (!mongoose.isObjectIdOrHexString(req.params.id)) {
      return res.status(400).json({ message: "Mã tài liệu không hợp lệ" });
    }
    const doc = await Document.findById(req.params.id)
      .populate("uploaderId", "name");

    if (!doc || doc.status !== "approved") {
      return res.status(404).json({ message: "Không tìm thấy tài liệu" });
    }

    const sourceStatus = await checkDocumentSource(doc.fileUrl);
    return res.json({
      ...doc.toObject(),
      fileAvailable: sourceStatus.available,
      fileIssue: sourceStatus.issue,
      storageProvider: doc.storageProvider || sourceStatus.storage,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi lấy tài liệu",
      error: error.message,
    });
  }
};

exports.previewDocument = async (req, res) => {
  try {
    const document = await Document.findById(req.params.id).lean();
    if (!document || document.status !== "approved") {
      return res.status(404).json({ message: "Tài liệu không tồn tại hoặc chưa được công khai" });
    }
    return await sendSafeDocumentPreview(document, res);
  } catch (error) {
    return sendDocumentPreviewError(res, error);
  }
};

exports.updateDocumentStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Status không hợp lệ" });
    }

    const doc = await Document.findById(req.params.id);

    if (!doc) {
      return res.status(404).json({ message: "Tài liệu không tồn tại" });
    }

    if (status === "approved") {
      const sourceStatus = await checkDocumentSource(doc.fileUrl);
      if (sourceStatus.available === false) {
        return res.status(409).json({
          message: sourceStatus.issue || "Không thể duyệt vì tệp nguồn không còn khả dụng",
          code: "DOCUMENT_FILE_MISSING",
        });
      }
    }

    const previousStatus = doc.status;
    applyModerationNote(doc, status, req.body.moderationNote);
    doc.status = status;
    await doc.save();
    if (previousStatus !== status) {
      await notifyDocumentStatus(doc, status).catch((notificationError) => {
        console.error("Không thể tạo thông báo trạng thái tài liệu:", notificationError.message);
      });
    }

    return res.json({
      message: "Cập nhật trạng thái thành công",
      document: doc,
    });
  } catch (error) {
    return res.status(error.status || 500).json({
      message: error.status ? error.message : "Lỗi cập nhật trạng thái",
      error: error.message,
    });
  }
};

exports.getDocumentStats = async (req, res) => {
  try {
    const match = req.user && ["admin", "moderator"].includes(req.user.role) ? {} : { status: "approved" };
    const [stats, bySubject, monthlyUploads] = await Promise.all([
      Document.aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            totalDocuments: { $sum: 1 },
            approved: {
              $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] },
            },
            pending: {
              $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
            },
            rejected: {
              $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] },
            },
            totalViews: { $sum: "$viewCount" },
            totalDownloads: { $sum: "$downloadCount" },
            subjectNames: { $addToSet: "$subjectName" },
          },
        },
        { $set: { totalSubjects: { $size: "$subjectNames" } } },
        { $unset: "subjectNames" },
      ]),
      Document.aggregate([
        { $match: match },
        { $group: { _id: "$subjectName", count: { $sum: 1 }, views: { $sum: "$viewCount" }, downloads: { $sum: "$downloadCount" } } },
        { $sort: { count: -1, views: -1 } },
        { $limit: 10 },
      ]),
      Document.aggregate([
        {
          $match: {
            ...match,
            createdAt: {
              $gte: new Date(new Date().getFullYear(), new Date().getMonth() - 7, 1),
            },
          },
        },
        {
          $group: {
            _id: {
              year: { $year: "$createdAt" },
              month: { $month: "$createdAt" },
            },
            uploads: { $sum: 1 },
          },
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } },
      ]),
    ]);

    const monthlyUploadMap = new Map(
      monthlyUploads.map((item) => [
        `${item._id.year}-${String(item._id.month).padStart(2, "0")}`,
        item.uploads,
      ])
    );
    const currentMonth = new Date();
    const uploadsByMonth = Array.from({ length: 8 }, (_, index) => {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 7 + index, 1);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      return { month: key, uploads: monthlyUploadMap.get(key) || 0 };
    });

    return res.json({
      summary: stats[0] || {
        totalDocuments: 0,
        approved: 0,
        pending: 0,
        rejected: 0,
        totalViews: 0,
        totalDownloads: 0,
        totalSubjects: 0,
      },
      bySubject,
      monthlyUploads: uploadsByMonth,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi thống kê tài liệu",
      error: error.message,
    });
  }
};

exports.incrementView = async (req, res) => {
  try {
    if (!mongoose.isObjectIdOrHexString(req.params.id)) return res.status(400).json({ message: "Mã tài liệu không hợp lệ" });
    const sessionId = getInteractionSession(req);
    if (sessionId && !(await claimInteraction({ documentId: req.params.id, type: "view", sessionId }))) {
      return res.json({ message: "Lượt xem đã được ghi nhận gần đây", counted: false });
    }
    const doc = await Document.findOneAndUpdate(
      { _id: req.params.id, status: "approved" },
      { $inc: { viewCount: 1 } },
      { new: true }
    );

    if (!doc) {
      return res.status(404).json({ message: "Tài liệu không tồn tại" });
    }

    return res.json({ message: "Đã tăng lượt xem", counted: true, document: doc });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi tăng lượt xem", error: error.message });
  }
};

exports.incrementDownload = async (req, res) => {
  try {
    if (!mongoose.isObjectIdOrHexString(req.params.id)) return res.status(400).json({ message: "Mã tài liệu không hợp lệ" });
    const sessionId = getInteractionSession(req);
    if (sessionId && !(await claimInteraction({ documentId: req.params.id, type: "download", sessionId }))) {
      return res.json({ message: "Lượt tải đã được ghi nhận gần đây", counted: false });
    }
    const doc = await Document.findOneAndUpdate(
      { _id: req.params.id, status: "approved" },
      { $inc: { downloadCount: 1 } },
      { new: true }
    );

    if (!doc) {
      return res.status(404).json({ message: "Tài liệu không tồn tại" });
    }

    return res.json({ message: "Đã tăng lượt tải", counted: true, document: doc });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi tăng lượt tải", error: error.message });
  }
};

exports.getMyDocuments = async (req, res) => {
  try {
    const userId = req.user?._id;
    if (!userId) {
      return res.status(401).json({ message: "Chưa xác thực người dùng" });
    }

    const documents = await Document.find({ uploaderId: userId })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      documents,
      count: documents.length,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi lấy danh sách tài liệu của bạn",
      error: error.message,
    });
  }
};

exports.deleteMyDocument = async (req, res) => {
  try {
    const userId = req.user?._id;
    const { id } = req.params;

    const doc = await Document.findById(id);
    if (!doc) {
      return res.status(404).json({ message: "Tài liệu không tồn tại" });
    }

    if (doc.uploaderId?.toString() !== userId?.toString() && req.user?.role !== "admin") {
      return res.status(403).json({ message: "Bạn không có quyền xoá tài liệu này" });
    }

    await removeDocument(doc);
    return res.json({ message: "Xoá tài liệu thành công" });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi xoá tài liệu",
      error: error.message,
    });
  }
};
