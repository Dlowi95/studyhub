const express = require("express");
const router = express.Router();
const upload = require("../middleware/uploadDocument");
const {
  uploadDocument,
  getDocuments,
  getDocumentById,
  getDocumentStats,
  getMyDocuments,
  deleteMyDocument,
  updateDocumentStatus,
  incrementView,
  incrementDownload,
  previewDocument,
  getSearchSuggestions,
} = require("../controllers/documentController");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");

router.post(
  "/upload",
  authenticateToken,
  (req, res, next) => {
    upload.single("file")(req, res, (error) => {
      if (!error) return next();
      const status = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;
      const message = error.code === "LIMIT_FILE_SIZE"
        ? "Dung lượng tệp tối đa là 25MB"
        : error.message || "Không thể đọc tệp tải lên";
      return res.status(status).json({ message });
    });
  },
  uploadDocument
);

router.get("/stats", getDocumentStats);
router.get("/my", authenticateToken, getMyDocuments);
router.get("/suggestions", getSearchSuggestions);
router.get("/", getDocuments);
router.get("/:id/preview", previewDocument);
router.get("/:id", getDocumentById);

// public endpoints to increment counters
router.post("/:id/view", incrementView);
router.post("/:id/download", incrementDownload);

router.delete("/:id", authenticateToken, deleteMyDocument);

router.put(
  "/:id/status",
  authenticateToken,
  authorizeRoles("admin"),
  updateDocumentStatus
);

module.exports = router;
