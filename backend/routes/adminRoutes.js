const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const subjectController = require("../controllers/subjectController");
const documentController = require("../controllers/documentController");
const systemController = require("../controllers/systemController");
const reportController = require("../controllers/reportController");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");

// All admin/moderator routes require authentication
router.use(authenticateToken);
router.get("/stats", authorizeRoles("admin"), documentController.getDocumentStats);
router.get("/audit-logs", authorizeRoles("admin"), adminController.getAuditLogs);

// Document moderation endpoints (accessible by both Admin and Moderator)
router.get("/documents", authorizeRoles("admin", "moderator"), adminController.getAllDocuments);
router.get("/documents/:id/preview", authorizeRoles("admin", "moderator"), adminController.previewDocument);
router.get("/documents/:id", authorizeRoles("admin", "moderator"), adminController.getDocumentById);
router.patch("/documents/:id/status", authorizeRoles("admin", "moderator"), adminController.updateDocumentStatus);
router.put("/documents/:id/status", authorizeRoles("admin", "moderator"), adminController.updateDocumentStatus);
router.get("/reports", authorizeRoles("admin", "moderator"), reportController.getAllReports);
router.put("/reports/:id/status", authorizeRoles("admin", "moderator"), reportController.updateReportStatus);

// Account, catalog, global activity, and destructive management are admin-only.
router.get("/users", authorizeRoles("admin"), adminController.getAllUsers);
router.put("/users/:id/role", authorizeRoles("admin"), adminController.updateUserRole);
router.put("/users/:id/status", authorizeRoles("admin"), adminController.updateUserStatus);
router.post("/documents", authorizeRoles("admin"), adminController.createDocument);
router.put("/documents/:id", authorizeRoles("admin"), adminController.updateDocument);
router.delete("/documents/:id", authorizeRoles("admin"), adminController.deleteDocument);
router.delete("/reports/:id", authorizeRoles("admin"), reportController.deleteReport);
router.get("/subjects", authorizeRoles("admin"), subjectController.getAdminSubjects);
router.post("/subjects", authorizeRoles("admin"), subjectController.createSubject);
router.put("/subjects/:id", authorizeRoles("admin"), subjectController.updateSubject);
router.delete("/subjects/:id", authorizeRoles("admin"), subjectController.deleteSubject);
router.get("/system-settings", authorizeRoles("admin"), systemController.getAdminSettings);
router.put("/system-settings", authorizeRoles("admin"), systemController.updateAdminSettings);

module.exports = router;
