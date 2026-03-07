const express = require("express");
const router = express.Router();

const albumController = require("../controllers/albumController");
const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// criar álbum (apenas artistas)
router.post(
  "/",
  authMiddleware,
  roleMiddleware(["artist", "label", "band"]),
  albumController.createAlbum
);

// listar álbuns
router.get("/", albumController.getAlbums);

// buscar álbum específico
router.get("/:id", albumController.getAlbumById);

// deletar álbum
router.delete(
  "/:id",
  authMiddleware,
  roleMiddleware(["artist", "label", "band"]),
  albumController.deleteAlbum
);

module.exports = router;