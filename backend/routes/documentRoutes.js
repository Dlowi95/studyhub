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
} = require("../controllers/documentController");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");

router.post(
  "/upload",
  authenticateToken,
  upload.single("file"),
  uploadDocument
);

router.get("/stats", getDocumentStats);
router.get("/my", authenticateToken, getMyDocuments);
router.get("/", getDocuments);
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