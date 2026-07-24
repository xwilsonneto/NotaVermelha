const express = require("express");
const router = express.Router();
const searchController = require("../controllers/searchController");

// GET /api/search?q=texto&limit=5
router.get("/", searchController.search);

module.exports = router;