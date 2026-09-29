const multer = require("multer");
const { isAllowedDocumentMime } = require("../utils/documentFileValidation");

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (isAllowedDocumentMime(file.originalname, file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Tệp không hợp lệ. Chỉ chấp nhận PDF, DOCX, PPTX, XLSX và TXT đúng định dạng"
      ),
      false
    );
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 25 * 1024 * 1024,
  },
});

module.exports = upload;
