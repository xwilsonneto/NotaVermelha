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

// upload de avatar  ← NOVO
router.post(
  "/me/avatar",
  authMiddleware,
  upload.single("avatar"),
  userController.uploadAvatar
);

// perfil público
router.get("/:id", userController.getUserById);

// seguir / parar de seguir
router.post("/:id/follow", authMiddleware, userController.followUser);
router.delete("/:id/follow", authMiddleware, userController.unfollowUser);

module.exports = router;