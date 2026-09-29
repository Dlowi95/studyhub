const fs = require("fs");
const path = require("path");
const cloudinary = require("../config/cloudinary");

const uploadDir = path.join(__dirname, "..", "uploads");

/**
 * Xóa file vật lý đã lưu (trên Cloudinary hoặc thư mục uploads cục bộ)
 * @param {string} fileUrl - Đường dẫn file đã lưu
 */
const deleteDocumentPhysicalFile = async (fileUrl) => {
  if (!fileUrl || typeof fileUrl !== "string") return;

  try {
    // 1. Nếu là file lưu local trong thư mục /uploads/
    if (fileUrl.includes("/uploads/")) {
      const parts = fileUrl.split("/uploads/");
      if (parts[1]) {
        const fileName = decodeURIComponent(parts[1]);
        const fullPath = path.join(uploadDir, fileName);
        if (fs.existsSync(fullPath)) {
          await fs.promises.unlink(fullPath);
        }
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
