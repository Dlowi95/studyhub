const fs = require("fs");
const path = require("path");
const cloudinary = require("../config/cloudinary");
const Document = require("../models/Document");

const uploadDir = path.join(__dirname, "..", "uploads");

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

const saveLocalFile = async (file) => {
  fs.mkdirSync(uploadDir, { recursive: true });
  const safeName = `${Date.now()}-${sanitizeFileName(file.originalname)}`;
  const filePath = path.join(uploadDir, safeName);
  await fs.promises.writeFile(filePath, file.buffer);
  return `http://localhost:${process.env.PORT || 5000}/uploads/${encodeURIComponent(safeName)}`;
};

exports.uploadDocument = async (req, res) => {
  try {
    const { title, description, subjectId, subjectName, tags } = req.body;
    const uploaderId = req.user?._id;

    if (!req.file) {
      return res.status(400).json({ message: "Vui lòng chọn file để upload" });
    }

    if (!title || (!subjectId && !subjectName)) {
      return res.status(400).json({
        message: "Thiếu title hoặc môn học",
      });
    }

    let fileUrl = "";

    if (cloudinary.isConfigured) {
      try {
        const result = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            {
              resource_type: "raw",
              folder: "studyhub/documents",
              public_id: `${Date.now()}-${req.file.originalname.replace(/\.[^/.]+$/, "")}`,
            },
            (error, uploadResult) => {
              if (error) reject(error);
              else resolve(uploadResult);
            }
          );

          stream.end(req.file.buffer);
        });

        fileUrl = result.secure_url;
      } catch (cloudError) {
        console.warn("Cloudinary upload failed, falling back to local storage.", cloudError.message);
        fileUrl = await saveLocalFile(req.file);
      }
    } else {
      fileUrl = await saveLocalFile(req.file);
    }

    const doc = new Document({
      title,
      description: description || "",
      fileUrl,
      fileName: req.file.originalname,
      fileType: req.body.fileType || req.file.mimetype || "FILE",
      subjectId: subjectId || null,
      subjectName: subjectName || "Khác",
      uploaderId: uploaderId || null,
      tags: Array.isArray(tags)
        ? tags
        : tags
          ? tags.split(",").map((t) => t.trim()).filter(Boolean)
          : [],
      status: "pending",
    });

    await doc.save();

    return res.status(201).json({
      message: "Upload tài liệu thành công",
      document: doc,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      message: "Lỗi upload tài liệu",
      error: error.message,
    });
  }
};

exports.getDocuments = async (req, res) => {
  try {
    const {
      status,
      q,
      subject,
      fileType,
      type,
      page = 1,
      limit = 20,
    } = req.query;

    const query = {};

    if (status) query.status = status;

    if (subject) {
      query.subjectName = { $regex: String(subject).trim(), $options: "i" };
    }

    const normalizedType = fileType || type;
    if (normalizedType) {
      query.fileType = { $regex: `^${String(normalizedType).trim()}$`, $options: "i" };
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const perPage = Math.max(1, parseInt(limit, 10) || 20);

    let docsQuery;
    if (q && q.trim()) {
      const searchTerm = q.trim();
      docsQuery = Document.find(
        {
          ...query,
          $text: { $search: searchTerm },
        },
        { score: { $meta: "textScore" } }
      ).sort({ score: { $meta: "textScore" }, createdAt: -1 });
    } else {
      docsQuery = Document.find(query).sort({ createdAt: -1 });
    }

    const [docs, total] = await Promise.all([
      docsQuery
        .skip((pageNum - 1) * perPage)
        .limit(perPage)
        .populate("uploaderId", "name email"),
      docsQuery.clone().countDocuments(),
    ]);

    return res.json({
      items: docs,
      page: pageNum,
      limit: perPage,
      total,
      totalPages: Math.ceil(total / perPage),
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi lấy danh sách tài liệu",
      error: error.message,
    });
  }
};

exports.getDocumentById = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id)
      .populate("uploaderId", "name email");

    if (!doc) {
      return res.status(404).json({ message: "Không tìm thấy tài liệu" });
    }

    return res.json(doc);
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi lấy tài liệu",
      error: error.message,
    });
  }
};

exports.updateDocumentStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["pending", "approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Status không hợp lệ" });
    }

    const doc = await Document.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!doc) {
      return res.status(404).json({ message: "Tài liệu không tồn tại" });
    }

    return res.json({
      message: "Cập nhật trạng thái thành công",
      document: doc,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Lỗi cập nhật trạng thái",
      error: error.message,
    });
  }
};

exports.getDocumentStats = async (req, res) => {
  try {
    const [stats, bySubject] = await Promise.all([
      Document.aggregate([
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
          },
        },
      ]),
      Document.aggregate([
        { $group: { _id: "$subjectName", count: { $sum: 1 }, views: { $sum: "$viewCount" }, downloads: { $sum: "$downloadCount" } } },
        { $sort: { count: -1, views: -1 } },
        { $limit: 10 },
      ]),
    ]);

    return res.json({
      summary: stats[0] || {
        totalDocuments: 0,
        approved: 0,
        pending: 0,
        rejected: 0,
        totalViews: 0,
        totalDownloads: 0,
      },
      bySubject,
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
    const doc = await Document.findByIdAndUpdate(
      req.params.id,
      { $inc: { viewCount: 1 } },
      { new: true }
    );

    if (!doc) {
      return res.status(404).json({ message: "Tài liệu không tồn tại" });
    }

    return res.json({ message: "Đã tăng lượt xem", document: doc });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi tăng lượt xem", error: error.message });
  }
};

exports.incrementDownload = async (req, res) => {
  try {
    const doc = await Document.findByIdAndUpdate(
      req.params.id,
      { $inc: { downloadCount: 1 } },
      { new: true }
    );

    if (!doc) {
      return res.status(404).json({ message: "Tài liệu không tồn tại" });
    }

    return res.json({ message: "Đã tăng lượt tải", document: doc });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi tăng lượt tải", error: error.message });
  }
};