const express = require("express");
const router = express.Router();

const artistController = require("../controllers/artistController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// Criar perfil de artista
router.post(
  "/",
  authMiddleware,
  roleMiddleware(["artist", "band", "label"]),
  artistController.createArtistProfile
);

// Listar artistas (método original)
router.get("/", artistController.getArtists);

// Listar artistas com cursor pagination (NOVO - MAIS EFICIENTE)
router.get("/cursor", artistController.getArtistsCursor);

// Buscar artista específico
router.get("/:id", artistController.getArtistById);

// Seguir artista — requer login
router.post("/:id/follow", authMiddleware, artistController.followArtist);

// Deixar de seguir artista — requer login
router.delete("/:id/follow", authMiddleware, artistController.unfollowArtist);

// Checar se usuário segue artista — requer login
router.get("/:id/following", authMiddleware, artistController.checkFollowing);

module.exports = router;