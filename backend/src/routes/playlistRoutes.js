const express = require("express");
const router = express.Router();

const playlistController = require("../controllers/playlistController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/", authMiddleware, playlistController.createPlaylist);

router.get("/", authMiddleware, playlistController.getUserPlaylists);

router.get("/:id", playlistController.getPlaylist);

router.delete("/:id", authMiddleware, playlistController.deletePlaylist);

module.exports = router;