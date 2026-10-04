const path = require("path");
const cloudinary = require("../config/cloudinary");
const Document = require("../models/Document");
const DocumentDownload = require("../models/DocumentDownload");
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
  notifyFollowersOfNewDocument,
} = require("../utils/notificationService");
const { claimInteraction } = require("../utils/trackDocumentInteraction");

const getInteractionSession = (req) => {
  if (!req?.headers) return null;
  if (req.user?._id) return `user:${req.user._id}`;
  // For anonymous visitors, prefer the network/browser fingerprint so clearing
  // localStorage on every refresh does not create a fresh view identity.
  if (req.ip) return `${req.ip}:${req.headers["user-agent"] || ""}`;
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
    const { title: submittedTitle, description: submittedDescription, subjectId, subjectName, tags, variantOf } = req.body;
    const uploaderId = req.user?._id;

    if (!req.file) {
      return res.status(400).json({ message: "Vui lòng chọn file để upload" });
    }

    let variantRoot = null;
    if (variantOf) {
      if (!mongoose.isObjectIdOrHexString(variantOf)) {
        return res.status(400).json({ message: "Tài liệu gốc không hợp lệ" });
      }
      const targetDocument = await Document.findOne({ _id: variantOf, status: "approved" });
      if (!targetDocument) {
        return res.status(404).json({ message: "Tài liệu gốc không còn công khai" });
      }
      const rootId = targetDocument.variantGroupId || targetDocument._id;
      variantRoot = targetDocument.variantGroupId
        ? await Document.findById(rootId)
        : targetDocument;
      if (!variantRoot) {
        return res.status(409).json({ message: "Nhóm tài liệu gốc không còn khả dụng" });
      }
    }

    const title = variantRoot?.title || submittedTitle;
    const description = variantRoot?.description || submittedDescription;
    const finalTags = variantRoot?.tags || tags;
    if (typeof title !== "string" || !title.trim() || title.trim().length > 200) {
      return res.status(400).json({
        message: "Tiêu đề phải từ 1 đến 200 ký tự",
      });
    }
    if (description !== undefined && (typeof description !== "string" || description.length > 10000)) {
      return res.status(400).json({ message: "Mô tả tối đa 10.000 ký tự" });
    }
    const subject = variantRoot
      ? { subjectId: variantRoot.subjectId, subjectName: variantRoot.subjectName }
      : await resolveSubject(subjectId, subjectName);
    const parsedTags = Array.isArray(finalTags) ? finalTags : typeof finalTags === "string" ? finalTags.split(",") : [];
    if (parsedTags.length > 20 || parsedTags.some((tag) => typeof tag !== "string" || tag.length > 80)) {
      return res.status(400).json({ message: "Tối đa 20 từ khóa, mỗi từ khóa tối đa 80 ký tự" });
    }

    const fileValidation = validateDocumentFile(req.file);
    if (!fileValidation.valid) {
      return res.status(400).json({ message: fileValidation.message });
    }

    if (variantRoot) {
      const groupId = variantRoot.variantGroupId || variantRoot._id;
      const duplicateFormat = await Document.exists({
        $and: [
          { $or: [{ _id: groupId }, { variantGroupId: groupId }] },
          { fileType: fileValidation.fileType },
          { status: { $ne: "rejected" } },
        ],
      });
      if (duplicateFormat) {
        return res.status(409).json({
          message: `Tài liệu này đã có bản ${fileValidation.fileType}. Hãy chọn tài liệu mới nếu đây là nội dung khác.`,
          code: "DOCUMENT_FORMAT_EXISTS",
        });
      }
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

    if (variantRoot && !variantRoot.variantGroupId) {
      variantRoot.variantGroupId = variantRoot._id;
      variantRoot.variantFormatKey = variantRoot.fileType;
      await variantRoot.save();
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
      variantGroupId: variantRoot ? (variantRoot.variantGroupId || variantRoot._id) : null,
      variantFormatKey: variantRoot ? fileValidation.fileType : undefined,
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
    if (error.code === 11000) {
      return res.status(409).json({ message: "Định dạng này vừa được người khác thêm vào tài liệu." });
    }
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
    const resourceSort = sort.downloadCount
      ? { resourceDownloads: -1, resourceUpdatedAt: -1, _id: 1 }
      : sort.avgRating
        ? { resourceRating: -1, resourceUpdatedAt: -1, _id: 1 }
        : { resourceUpdatedAt: -1, _id: 1 };
    const groupStages = [
      { $match: query },
      { $sort: sort },
      {
        $group: {
          _id: { $ifNull: ["$variantGroupId", "$_id"] },
          document: { $first: "$$ROOT" },
          resourceDownloads: { $sum: { $ifNull: ["$downloadCount", 0] } },
          resourceViews: { $sum: { $ifNull: ["$viewCount", 0] } },
          variantCount: { $sum: 1 },
          availableFormats: { $addToSet: "$fileType" },
          ratingTotal: { $sum: { $cond: [{ $gt: ["$avgRating", 0] }, "$avgRating", 0] } },
          ratedVariants: { $sum: { $cond: [{ $gt: ["$avgRating", 0] }, 1, 0] } },
          resourceUpdatedAt: { $max: "$createdAt" },
        },
      },
      {
        $project: {
          _id: 1,
          resourceDownloads: 1,
          resourceViews: 1,
          variantCount: 1,
          availableFormats: 1,
          resourceUpdatedAt: 1,
          resourceRating: { $cond: [{ $gt: ["$ratedVariants", 0] }, { $divide: ["$ratingTotal", "$ratedVariants"] }, 0] },
          document: {
            $mergeObjects: ["$document", {
              variantGroupId: "$_id",
              resourceGroupId: "$_id",
              variantCount: "$variantCount",
              availableFormats: "$availableFormats",
              downloadCount: "$resourceDownloads",
              viewCount: "$resourceViews",
              avgRating: { $cond: [{ $gt: ["$ratedVariants", 0] }, { $divide: ["$ratingTotal", "$ratedVariants"] }, 0] },
            }],
          },
        },
      },
      { $sort: resourceSort },
      { $skip: (pageNum - 1) * perPage },
      { $limit: perPage },
      { $replaceRoot: { newRoot: "$document" } },
      { $lookup: { from: "users", localField: "uploaderId", foreignField: "_id", as: "uploaderInfo" } },
      {
        $addFields: {
          uploaderInfo: {
            $map: {
              input: "$uploaderInfo",
              as: "uploader",
              in: { _id: "$$uploader._id", name: "$$uploader.name", avatarUrl: "$$uploader.avatarUrl" },
            },
          },
        },
      },
      { $addFields: { uploaderId: { $ifNull: [{ $arrayElemAt: ["$uploaderInfo", 0] }, "$uploaderId"] } } },
      { $project: { uploaderInfo: 0 } },
    ];
    const [docs, countResult] = await Promise.all([
      Document.aggregate(groupStages),
      Document.aggregate([{ $match: query }, { $group: { _id: { $ifNull: ["$variantGroupId", "$_id"] } } }, { $count: "total" }]),
    ]);
    const total = countResult[0]?.total || 0;

    const items = await Promise.all(
      docs.map(async (document) => {
        const sourceStatus = await checkDocumentSource(document.fileUrl);
        return {
          ...document,
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

exports.getDocumentVariants = async (req, res) => {
  try {
    if (!mongoose.isObjectIdOrHexString(req.params.id)) {
      return res.status(400).json({ message: "Mã tài liệu không hợp lệ" });
    }
    const selected = await Document.findOne({ _id: req.params.id, status: "approved" });
    if (!selected) return res.status(404).json({ message: "Không tìm thấy tài liệu" });
    const groupId = selected.variantGroupId || selected._id;
    const explicitGroupQuery = {
      $or: [{ _id: groupId }, { variantGroupId: groupId }],
      status: "approved",
    };
    const explicitVariants = await Document.find(explicitGroupQuery)
      .populate("uploaderId", "name")
      .sort({ fileType: 1, createdAt: 1 });

    // Older uploads may have been submitted as separate documents instead of
    // using the "add another format" flow. Treat an exact title + course match
    // as a format candidate, but only when it adds a file type the group lacks.
    const subjectMatch = selected.subjectId
      ? { subjectId: selected.subjectId }
      : { subjectName: selected.subjectName };
    const legacyCandidates = await Document.find({
      ...subjectMatch,
      title: selected.title,
      status: "approved",
      _id: { $ne: selected._id },
      $or: [{ variantGroupId: null }, { variantGroupId: { $exists: false } }],
    })
      .populate("uploaderId", "name")
      .sort({ fileType: 1, createdAt: 1 });
    const existingFormats = new Set(explicitVariants.map((variant) => variant.fileType));
    const legacyByNewFormat = new Map();
    for (const candidate of legacyCandidates) {
      if (!existingFormats.has(candidate.fileType) && !legacyByNewFormat.has(candidate.fileType)) {
        legacyByNewFormat.set(candidate.fileType, candidate);
      }
    }
    const variants = [...explicitVariants, ...legacyByNewFormat.values()]
      .sort((left, right) => String(left.fileType).localeCompare(String(right.fileType)));
    const items = await Promise.all(variants.map(async (variant) => {
      const sourceStatus = await checkDocumentSource(variant.fileUrl);
      return {
        ...variant.toObject(),
        fileAvailable: sourceStatus.available,
        fileIssue: sourceStatus.issue,
        storageProvider: variant.storageProvider || sourceStatus.storage,
      };
    }));
    return res.json({ variants: items, selectedId: selected._id });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Không thể tải các định dạng của tài liệu" });
  }
};

exports.getSearchSuggestions = async (req, res) => {
  try {
    const q = typeof req.query.q === "string" ? req.query.q.trim().slice(0, 200) : "";
    if (q.length < 2) return res.json({ documents: [], subjects: [] });
    const { query } = buildPublicDocumentQuery(req.query);
    const titleMatch = { title: { $regex: searchPattern(q), $options: "i" } };
    const projection = "title subjectName fileType variantGroupId";
    const [titleDocuments, otherDocuments, subjects] = await Promise.all([
      Document.find({ $and: [query, titleMatch] }).sort({ downloadCount: -1, createdAt: -1, _id: -1 }).limit(6).select(projection).lean(),
      Document.find(query).sort({ downloadCount: -1, createdAt: -1, _id: -1 }).limit(6).select(projection).lean(),
      Document.aggregate([
        { $match: { $and: [query, { subjectName: { $regex: searchPattern(q), $options: "i" } }] } },
        { $group: { _id: { $ifNull: ["$variantGroupId", "$_id"] }, subjectName: { $first: "$subjectName" } } },
        { $group: { _id: "$subjectName", count: { $sum: 1 } } },
        { $sort: { count: -1, _id: 1 } }, { $limit: 3 },
        { $project: { _id: 0, name: "$_id", count: 1 } },
      ]),
    ]);
    const unique = new Map();
    for (const doc of [...titleDocuments, ...otherDocuments]) {
      const key = String(doc.variantGroupId || doc._id);
      const current = unique.get(key) || { ...doc, documentIds: new Set(), availableFormats: new Set() };
      current.documentIds.add(String(doc._id));
      if (doc.fileType) current.availableFormats.add(doc.fileType);
      unique.set(key, current);
    }
    const documents = [...unique.values()].slice(0, 6).map(({ documentIds, availableFormats, ...doc }) => ({
      ...doc,
      variantCount: documentIds.size,
      availableFormats: [...availableFormats],
    }));
    return res.json({ documents, subjects });
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
    if (doc.variantGroupId) {
      doc.variantFormatKey = status === "rejected" ? undefined : doc.fileType;
    }
    await doc.save();
    if (previousStatus !== status) {
      await notifyDocumentStatus(doc, status).catch((notificationError) => {
        console.error("Không thể tạo thông báo trạng thái tài liệu:", notificationError.message);
      });
      if (previousStatus !== "approved" && status === "approved") {
        await notifyFollowersOfNewDocument(doc).catch((notificationError) => {
          console.error("Không thể thông báo tài liệu mới cho người theo dõi:", notificationError.message);
        });
      }
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
    const match = req.user?.role === "admin"
      ? {}
      : req.user?.role === "moderator"
        ? { status: "pending" }
        : { status: "approved" };
    const [stats, bySubject, monthlyUploads, approvedResourceCount] = await Promise.all([
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
      Document.aggregate([
        { $match: { ...match, status: "approved" } },
        { $group: { _id: { $ifNull: ["$variantGroupId", "$_id"] } } },
        { $count: "total" },
      ]),
    ]);
    const summary = stats[0] || {
      totalDocuments: 0,
      approved: 0,
      pending: 0,
      rejected: 0,
      totalViews: 0,
      totalDownloads: 0,
      totalSubjects: 0,
    };
    summary.approvedResources = approvedResourceCount[0]?.total || 0;

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
      summary,
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
    const approvedDocument = await Document.findOne({ _id: req.params.id, status: "approved" });
    if (!approvedDocument) return res.status(404).json({ message: "Tài liệu không tồn tại" });

    if (req.user?._id) {
      try {
        await DocumentDownload.create({ documentId: approvedDocument._id, userId: req.user._id });
      } catch (error) {
        if (error?.code !== 11000) throw error;
        const currentDocument = await Document.findById(approvedDocument._id);
        return res.json({ message: "Tài khoản này đã tải tài liệu trước đó", counted: false, document: currentDocument });
      }
    } else {
      const sessionId = getInteractionSession(req);
      if (sessionId && !(await claimInteraction({ documentId: req.params.id, type: "download", sessionId }))) {
        const currentDocument = await Document.findById(approvedDocument._id);
        return res.json({ message: "Lượt tải đã được ghi nhận gần đây", counted: false, document: currentDocument });
      }
    }

    const doc = await Document.findOneAndUpdate(
      { _id: req.params.id, status: "approved" },
      { $inc: { downloadCount: 1 } },
      { new: true }
    );

    if (!doc) return res.status(404).json({ message: "Tài liệu không tồn tại" });

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

    const status = typeof req.query?.status === "string" ? req.query.status : "all";
    if (!["all", "approved", "pending", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Trạng thái tài liệu không hợp lệ" });
    }

    const rawPage = req.query?.page === undefined ? 1 : Number(req.query.page);
    if (!Number.isInteger(rawPage) || rawPage < 1 || rawPage > 100000) {
      return res.status(400).json({ message: "Trang tài liệu không hợp lệ" });
    }
    const rawLimit = req.query?.limit === undefined ? 10 : Number(req.query.limit);
    if (!Number.isInteger(rawLimit) || rawLimit < 1 || rawLimit > 50) {
      return res.status(400).json({ message: "Số tài liệu mỗi trang phải từ 1 đến 50" });
    }

    const query = { uploaderId: userId };
    if (status !== "all") query.status = status;
    const search = typeof req.query?.q === "string" ? req.query.q.trim().slice(0, 120) : "";
    if (search) {
      query.$and = search.split(/\s+/).filter(Boolean).map((term) => ({
        $or: ["title", "subjectName", "tags"].map((field) => ({
          [field]: { $regex: searchPattern(term), $options: "i" },
        })),
      }));
    }

    const [total, summaryRows] = await Promise.all([
      Document.countDocuments(query),
      Document.aggregate([
        { $match: { uploaderId: new mongoose.Types.ObjectId(userId) } },
        { $group: {
          _id: null,
          total: { $sum: 1 },
          approved: { $sum: { $cond: [{ $eq: ["$status", "approved"] }, 1, 0] } },
          pending: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
          rejected: { $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] } },
          totalViews: { $sum: "$viewCount" },
          totalDownloads: { $sum: "$downloadCount" },
        } },
      ]),
    ]);
    const totalPages = Math.ceil(total / rawLimit);
    const page = totalPages ? Math.min(rawPage, totalPages) : 1;
    const documents = await Document.find(query)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * rawLimit)
      .limit(rawLimit)
      .lean();

    return res.json({
      documents,
      count: total,
      page,
      limit: rawLimit,
      totalPages,
      summary: summaryRows[0] || { total: 0, approved: 0, pending: 0, rejected: 0, totalViews: 0, totalDownloads: 0 },
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
