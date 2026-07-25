// routes/userRoutes.js
const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

// perfil próprio
router.get("/me", authMiddleware, userController.getMyProfile);

// atualizar perfil (texto)
router.put("/me", authMiddleware, userController.updateProfile);

// upload de avatar
router.post(
  "/me/avatar",
  authMiddleware,
  upload.single("avatar"),
  userController.uploadAvatar
);

// === ROTAS PÚBLICAS POR USERNAME ===
// Activity é pública (perfil público)
router.get("/:username/activity", userController.getUserActivity);
router.get("/:username/posts", userController.getUserPosts);
router.get("/:username", userController.getUserByUsername);

// seguir / parar de seguir (por ID)
router.post("/:id/follow", authMiddleware, userController.followUser);
router.delete("/:id/follow", authMiddleware, userController.unfollowUser);

// perfil por ID (mantido para compatibilidade)
router.get("/:id", userController.getUserById);

module.exports = router;