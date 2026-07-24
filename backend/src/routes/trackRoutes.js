const express = require("express");
const router = express.Router();

const trackController = require("../controllers/trackController");
const feedController = require("../controllers/feedController");
const artistController = require("../controllers/artistController");
const albumController = require("../controllers/albumController");
const authMiddleware = require("../middleware/authMiddleware");
const optionalAuth = require("../middleware/optionalAuthMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const upload = require("../middleware/uploadMiddleware");

// ─── ROTAS ESTÁTICAS (devem vir ANTES de /:id) ──────────────────────────────

router.get("/cursor", trackController.getTracksCursor);
router.get("/feed/cursor", authMiddleware, feedController.getFeedCursor);
router.get("/artists/cursor", artistController.getArtistsCursor);
router.get("/albums/cursor", albumController.getAlbumsCursor);

router.get("/me/recently-played", authMiddleware, trackController.getRecentlyPlayed);
router.get("/liked", authMiddleware, trackController.getLikedTracks);

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

router.post(
  "/",
  authMiddleware,
  roleMiddleware(["artist", "band", "label", "admin"]),
  trackController.createTrack
);

// ─── ROTAS COM PARÂMETRO (/:id por último) ───────────────────────────────────

router.get("/", trackController.getTracks);
router.get("/:id", trackController.getTrackById);
router.post("/:id/play", optionalAuth, trackController.registerPlay);
router.post("/:id/like", authMiddleware, trackController.likeTrack);
router.delete("/:id/like", authMiddleware, trackController.unlikeTrack);
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(["artist", "admin"]),
  trackController.deleteTrack
);

module.exports = router;