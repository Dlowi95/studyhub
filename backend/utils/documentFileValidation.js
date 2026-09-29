const path = require("path");

const allowedMimeTypes = {
  ".pdf": ["application/pdf"],
  ".docx": ["application/vnd.openxmlformats-officedocument.wordprocessingml.document"],
  ".pptx": ["application/vnd.openxmlformats-officedocument.presentationml.presentation"],
  ".xlsx": ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
  ".txt": ["text/plain"],
};

const getDocumentExtension = (fileName = "") => path.extname(fileName).toLowerCase();

const isAllowedDocumentMime = (fileName, mimeType) => {
  const extension = getDocumentExtension(fileName);
  return Boolean(allowedMimeTypes[extension]?.includes(String(mimeType || "").toLowerCase()));
};

const startsWithBytes = (buffer, bytes) =>
  bytes.every((byte, index) => buffer[index] === byte);

const validateTextBuffer = (buffer) => {
  if (buffer.includes(0)) return false;
  const sample = buffer.subarray(0, Math.min(buffer.length, 8192));
  let suspiciousControlBytes = 0;
  for (const byte of sample) {
    const isAllowedControl = byte === 9 || byte === 10 || byte === 13;
    if (byte < 32 && !isAllowedControl) suspiciousControlBytes += 1;
  }
  return sample.length === 0 || suspiciousControlBytes / sample.length < 0.01;
};

const validateDocumentFile = (file) => {
  if (!file?.buffer?.length) {
    return { valid: false, message: "Tệp rỗng hoặc không đọc được" };
  }

  const extension = getDocumentExtension(file.originalname);
  if (!allowedMimeTypes[extension]) {
    return { valid: false, message: "Định dạng tệp không được hỗ trợ" };
  }

  if (!isAllowedDocumentMime(file.originalname, file.mimetype)) {
    return { valid: false, message: "Phần mở rộng và loại nội dung của tệp không khớp" };
  }

  const buffer = file.buffer;
  let hasValidSignature = false;

  if (extension === ".pdf") {
    hasValidSignature = buffer.subarray(0, 5).toString("ascii") === "%PDF-";
  } else if ([".docx", ".pptx", ".xlsx"].includes(extension)) {
    const packageFolder = extension === ".docx" ? "word/" : extension === ".pptx" ? "ppt/" : "xl/";
    hasValidSignature =
      startsWithBytes(buffer, [0x50, 0x4b]) &&
      buffer.indexOf("[Content_Types].xml") !== -1 &&
      buffer.indexOf(packageFolder) !== -1;
  } else if (extension === ".txt") {
    hasValidSignature = validateTextBuffer(buffer);
  }

  if (!hasValidSignature) {
    return {
      valid: false,
      message: "Nội dung tệp không đúng định dạng hoặc có dấu hiệu giả mạo",
    };
  }

  return { valid: true, fileType: extension.slice(1).toUpperCase() };
};

module.exports = {
  allowedMimeTypes,
  getDocumentExtension,
  isAllowedDocumentMime,
  validateDocumentFile,
};
