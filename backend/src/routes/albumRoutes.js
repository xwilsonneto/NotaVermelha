const express = require("express");
const router = express.Router();

const albumController = require("../controllers/albumController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// Criar álbum (apenas artistas)
router.post(
  "/",
  authMiddleware,
  roleMiddleware(["artist", "label", "band"]),
  albumController.createAlbum
);

// Listar álbuns
router.get("/", albumController.getAlbums);

// Buscar álbum específico
router.get("/:id", albumController.getAlbumById);

// Deletar álbum
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(["artist", "label", "band"]),
  albumController.deleteAlbum
);

// ─── Like / Unlike / Check ───────────────────────────────────────────────────
router.post("/:id/like",    authMiddleware, albumController.likeAlbum);
router.delete("/:id/like",  authMiddleware, albumController.unlikeAlbum);
router.get("/:id/like",     authMiddleware, albumController.checkLike);

module.exports = router;