const express = require("express");
const { downloadStoredFile } = require("../controllers/fileController");

const router = express.Router();

router.get("/:id", downloadStoredFile);

module.exports = router;
