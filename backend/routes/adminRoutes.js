const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");

// Only admins can access these endpoints
router.use(authenticateToken);
router.use(authorizeRoles("admin"));

router.get("/users", adminController.getAllUsers);
router.get("/documents", adminController.getAllDocuments);
router.get("/documents/:id", adminController.getDocumentById);
router.post("/documents", adminController.createDocument);
router.put("/documents/:id", adminController.updateDocument);
router.delete("/documents/:id", adminController.deleteDocument);
router.patch("/documents/:id/status", adminController.updateDocumentStatus);
router.put("/users/:id/status", adminController.updateUserStatus);

module.exports = router;
