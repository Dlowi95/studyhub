const { extractOfficePreview } = require("./officePreview");
const { readDocumentSource } = require("./documentStorage");

const previewMimeTypes = {
  pdf: "application/pdf",
  txt: "text/plain; charset=utf-8",
};

const getDocumentPreviewFormat = (document = {}) => {
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

const sendSafeDocumentPreview = async (document, res) => {
  const format = getDocumentPreviewFormat(document);
  if (!format) {
    const error = new Error("Định dạng này chưa hỗ trợ xem trước an toàn");
    error.status = 415;
    error.code = "UNSUPPORTED_PREVIEW_FORMAT";
    throw error;
  }

  const buffer = await readDocumentSource(document.fileUrl);
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");

  if (["docx", "pptx", "xlsx"].includes(format)) {
    return res.json(extractOfficePreview(buffer, format));
  }

  const originalName = document.fileName || `tai-lieu.${format}`;
  const safeAsciiName = originalName.replace(/[^\x20-\x7E]/g, "_").replace(/["\\]/g, "_");
  res.setHeader("Content-Type", previewMimeTypes[format]);
  res.setHeader(
    "Content-Disposition",
    `inline; filename="${safeAsciiName}"; filename*=UTF-8''${encodeURIComponent(originalName)}`
  );
  res.setHeader("Content-Length", buffer.length);
  res.setHeader("Content-Security-Policy", "sandbox; default-src 'none'");
  return res.send(buffer);
};

const sendDocumentPreviewError = (res, error) => {
  const status = Number(error?.status) || (error?.code === "ENOENT" ? 410 : 502);
  const sourceMissing =
    error?.code === "ENOENT" ||
    error?.code === "DOCUMENT_FILE_MISSING" ||
    status === 410;

  return res.status(status).json({
    message:
      error?.code === "ENOENT"
        ? "Tệp nguồn không còn trên máy chủ. Người đăng cần tải lại tài liệu."
        : error?.message || "Không thể tạo bản xem trước",
    code: error?.code || "PREVIEW_ERROR",
    fileAvailable: sourceMissing ? false : null,
  });
};

module.exports = {
  getDocumentPreviewFormat,
  sendDocumentPreviewError,
  sendSafeDocumentPreview,
};
