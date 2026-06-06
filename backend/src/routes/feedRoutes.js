const express = require("express");
const router = express.Router();

const feedController = require("../controllers/feedController");
const authMiddleware = require("../middleware/authMiddleware");

// Feed original (sem paginação)
router.get("/", authMiddleware, feedController.getFeed);

// Feed com cursor pagination (NOVO - PARA SCROLL INFINITO)
router.get("/cursor", authMiddleware, feedController.getFeedCursor);

module.exports = router;