const express = require("express");
const router = express.Router();

const trackController = require("../controllers/trackController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");
const upload = require("../middleware/uploadMiddleware");

router.get("/", trackController.getTracks);

// Tracks curtidas pelo usuário autenticado
router.get("/liked", authMiddleware, trackController.getLikedTracks);

router.get("/:id", trackController.getTrackById);

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

// Play — público
router.post("/:id/play", trackController.registerPlay);

// Like / Unlike — requer login
router.post("/:id/like", authMiddleware, trackController.likeTrack);
router.delete("/:id/like", authMiddleware, trackController.unlikeTrack);

router.post(
  "/",
  authMiddleware,
  roleMiddleware(["artist", "band", "label", "admin"]),
  trackController.createTrack
);

router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(["artist", "admin"]),
  trackController.deleteTrack
);

module.exports = router;
