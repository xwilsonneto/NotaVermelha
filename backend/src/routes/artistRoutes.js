const express = require("express");
const router = express.Router();

const artistController = require("../controllers/artistController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// criar perfil de artista
router.post(
  "/",
  authMiddleware,
  roleMiddleware(["artist", "band", "label"]),
  artistController.createArtistProfile
);

// listar artistas
router.get("/", artistController.getArtists);

// buscar artista específico
router.get("/:id", artistController.getArtistById);

module.exports = router;