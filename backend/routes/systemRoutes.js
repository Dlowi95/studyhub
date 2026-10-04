const express = require("express");
const router = express.Router();
const systemController = require("../controllers/systemController");

router.get("/status", systemController.getPublicStatus);

module.exports = router;
