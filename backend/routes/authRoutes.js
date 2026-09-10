const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { authenticateToken } = require("../middleware/auth");
const uploadAvatar = require("../middleware/uploadAvatar");

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/google", authController.googleLogin);
router.get("/profile", authenticateToken, authController.getProfile);
router.put("/profile", authenticateToken, uploadAvatar.single("avatar"), authController.updateProfile);

module.exports = router;

