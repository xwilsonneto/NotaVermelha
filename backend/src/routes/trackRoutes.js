const express = require("express");
const router = express.Router();

const trackController = require("../controllers/trackController");
const feedController = require("../controllers/feedController"); // Adicionado para as rotas de feed
const artistController = require("../controllers/artistController"); // Adicionado para as rotas de artist
const albumController = require("../controllers/albumController"); // Adicionado para as rotas de album
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const upload = require("../middleware/uploadMiddleware");

// ─── ROTAS PÚBLICAS ─────────────────────────────────────────────────────────

// Listar tracks (método original com paginação)
router.get("/", trackController.getTracks);

// Listar tracks com cursor pagination (NOVO - MAIS EFICIENTE)
router.get("/cursor", trackController.getTracksCursor);

// Buscar track específica
router.get("/:id", trackController.getTrackById);

// Registrar play
router.post("/:id/play", trackController.registerPlay);

// ─── ROTAS DE CURSOR PARA OUTROS RECURSOS ───────────────────────────────────
// Nota: Estas rotas estão no lugar errado! Deveriam estar em seus respectivos routers
// Mas vou mantê-las aqui como você tinha, apenas corrigindo as referências

// Feed com cursor (NOVO)
router.get("/feed/cursor", authMiddleware, feedController.getFeedCursor);

// Artistas com cursor (NOVO)
router.get("/artists/cursor", artistController.getArtistsCursor);

// Álbuns com cursor (NOVO)
router.get("/albums/cursor", albumController.getAlbumsCursor);

// ─── ROTAS PROTEGIDAS ───────────────────────────────────────────────────────

// Tracks curtidas pelo usuário autenticado
router.get("/liked", authMiddleware, trackController.getLikedTracks);

// Upload de track (com arquivos)
router.post(
  "/upload",
  authMiddleware,
  roleMiddleware(["artist", "band", "label", "admin"]),
  upload.fields([
    { name: "audio", maxCount: 1 },
    { name: "cover", maxCount: 1 }
  ]),
  trackController.uploadTrack
);

// Like / Unlike — requer login
router.post("/:id/like", authMiddleware, trackController.likeTrack);
router.delete("/:id/like", authMiddleware, trackController.unlikeTrack);

// Criar track (dados apenas)
router.post(
  "/",
  authMiddleware,
  roleMiddleware(["artist", "band", "label", "admin"]),
  trackController.createTrack
);

// Deletar track
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(["artist", "admin"]),
  trackController.deleteTrack
);

module.exports = router;