const Document = require("../models/Document");
const {
  getGridFsFileInfo,
  openGridFsDownloadStream,
} = require("../utils/documentStorage");

const safeDownloadName = (value = "document") =>
  String(value).replace(/[^\x20-\x7E]/g, "_").replace(/["\\]/g, "_");

exports.downloadStoredFile = async (req, res) => {
  try {
    const storageKey = String(req.params.id || "");
    const document = await Document.findOne({
      storageProvider: "gridfs",
      storageKey,
      status: "approved",
    }).lean();

    if (!document) {
      return res.status(404).json({ message: "Tệp không tồn tại hoặc chưa được công khai" });
    }

    const storedFile = await getGridFsFileInfo(storageKey);
    const originalName = document.fileName || storedFile.metadata?.originalName || storedFile.filename;
    const contentType = storedFile.metadata?.contentType || "application/octet-stream";
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Length", storedFile.length);
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Cache-Control", "private, no-store");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${safeDownloadName(originalName)}"; filename*=UTF-8''${encodeURIComponent(originalName)}`
    );

    const stream = openGridFsDownloadStream(storageKey);
    stream.once("error", (error) => {
      if (!res.headersSent) {
        res.status(410).json({ message: "Tệp nguồn không còn trong kho lưu trữ" });
      } else {
        res.destroy(error);
      }
    });
    return stream.pipe(res);
  } catch (error) {
    const status = Number(error?.status) || 500;
    return res.status(status).json({ message: error.message || "Không thể tải tài liệu" });
  }
};
