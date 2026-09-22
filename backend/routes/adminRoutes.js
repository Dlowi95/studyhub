const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");

// All admin/moderator routes require authentication
router.use(authenticateToken);

// Document moderation endpoints (accessible by both Admin and Moderator)
router.get("/documents", authorizeRoles("admin", "moderator"), adminController.getAllDocuments);
router.get("/documents/:id", authorizeRoles("admin", "moderator"), adminController.getDocumentById);
router.patch("/documents/:id/status", authorizeRoles("admin", "moderator"), adminController.updateDocumentStatus);
router.put("/documents/:id/status", authorizeRoles("admin", "moderator"), adminController.updateDocumentStatus);

// Management endpoints (Viewing users allowed for admin and moderator; edits strictly admin)
router.get("/users", authorizeRoles("admin", "moderator"), adminController.getAllUsers);
router.put("/users/:id/role", authorizeRoles("admin"), adminController.updateUserRole);
router.put("/users/:id/status", authorizeRoles("admin"), adminController.updateUserStatus);
router.post("/documents", authorizeRoles("admin"), adminController.createDocument);
router.put("/documents/:id", authorizeRoles("admin"), adminController.updateDocument);
router.delete("/documents/:id", authorizeRoles("admin"), adminController.deleteDocument);

module.exports = router;
