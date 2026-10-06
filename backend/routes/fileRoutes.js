const express = require("express");
const { downloadStoredFile } = require("../controllers/fileController");
const { optionalAuthenticateToken } = require("../middleware/auth");

const router = express.Router();

router.get("/:id", optionalAuthenticateToken, downloadStoredFile);

module.exports = router;
