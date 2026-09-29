const fs = require("fs");
const cloudinary = require("../config/cloudinary");
const { deleteGridFsFile, parseDocumentSource } = require("./documentStorage");

/**
 * Xóa file vật lý đã lưu (trên Cloudinary hoặc thư mục uploads cục bộ)
 * @param {string|object} source - Đường dẫn file hoặc bản ghi tài liệu
 */
const deleteDocumentPhysicalFile = async (source) => {
  const fileUrl = typeof source === "string" ? source : source?.fileUrl;
  if (!fileUrl || typeof fileUrl !== "string") return;

  try {
    const parsedSource = parseDocumentSource(fileUrl);
    const storageKey = typeof source === "object" && source?.storageKey
      ? source.storageKey
      : parsedSource.storageKey;

    if ((source?.storageProvider === "gridfs" || parsedSource.kind === "gridfs") && storageKey) {
      await deleteGridFsFile(storageKey);
      return;
    }

    // 1. Nếu là file lưu local trong thư mục /uploads/
    if (parsedSource.kind === "local") {
      if (fs.existsSync(parsedSource.localPath)) {
        await fs.promises.unlink(parsedSource.localPath);
      }
      return;
    }

    // 2. Nếu là file trên Cloudinary
    if (cloudinary.isConfigured && fileUrl.includes("res.cloudinary.com")) {
      // Cloudinary URL format: .../upload/v12345/studyhub/documents/sample.pdf
      const uploadIdx = fileUrl.indexOf("/upload/");
      if (uploadIdx !== -1) {
        let publicPath = fileUrl.substring(uploadIdx + "/upload/".length);
        // Bỏ version nếu có (ví dụ: v17123456/)
        if (publicPath.startsWith("v") && publicPath.indexOf("/") !== -1) {
          publicPath = publicPath.substring(publicPath.indexOf("/") + 1);
        }
        // Xóa phần mở rộng đuôi file
        const publicId = publicPath.replace(/\.[^/.]+$/, "");

        if (publicId) {
          await Promise.allSettled([
            cloudinary.uploader.destroy(publicId, { resource_type: "raw" }),
            cloudinary.uploader.destroy(publicId, { resource_type: "image" }),
          ]);
        }
      }
    }
  } catch (err) {
    console.warn("Lỗi khi xóa file vật lý:", err.message);
  }
};

module.exports = {
  deleteDocumentPhysicalFile,
};
