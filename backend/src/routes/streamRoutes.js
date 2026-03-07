const express = require("express");
const router = express.Router();
const streamController = require("../controllers/streamController");

router.get("/:artist/:album/:file",streamController.streamTrack);

module.exports = router;