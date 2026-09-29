const express = require("express");
const { getPublicSubjects } = require("../controllers/subjectController");

const router = express.Router();

router.get("/", getPublicSubjects);

module.exports = router;
