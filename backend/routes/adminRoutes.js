const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminController");
const { authenticateToken, authorizeRoles } = require("../middleware/auth");

// Only admins can access these endpoints
router.use(authenticateToken);
router.use(authorizeRoles("admin"));

router.get("/users", adminController.getAllUsers);
router.put("/users/:id/status", adminController.updateUserStatus);

module.exports = router;
