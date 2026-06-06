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

// Listar álbuns (método original)
router.get("/", albumController.getAlbums);

// Listar álbuns com cursor pagination (NOVO - MAIS EFICIENTE)
router.get("/cursor", albumController.getAlbumsCursor);

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