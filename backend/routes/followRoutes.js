const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const { getMyFollowSummary, getFollowStatus, followUser, unfollowUser } = require("../controllers/followController");

router.get("/me/summary", authenticateToken, getMyFollowSummary);
router.get("/:userId", authenticateToken, getFollowStatus);
router.post("/:userId", authenticateToken, followUser);
router.delete("/:userId", authenticateToken, unfollowUser);

module.exports = router;
