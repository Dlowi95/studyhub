const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../middleware/auth");
const {
  getMyBookmarks,
  getBookmarkStatus,
  addBookmark,
  removeBookmark,
} = require("../controllers/bookmarkController");

router.use(authenticateToken);
router.get("/bookmarks", getMyBookmarks);
router.get("/bookmarks/:documentId", getBookmarkStatus);
router.post("/bookmarks/:documentId", addBookmark);
router.delete("/bookmarks/:documentId", removeBookmark);

module.exports = router;
