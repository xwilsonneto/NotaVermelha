const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");
const authMiddleware = require("../middleware/authMiddleware");

// perfil próprio
router.get("/me", authMiddleware, userController.getMyProfile);

// perfil público
router.get("/:id", userController.getUserById);

// atualizar perfil
router.put("/me", authMiddleware, userController.updateProfile);

// seguir usuário
router.post("/:id/follow", authMiddleware, userController.followUser);

// parar de seguir
router.delete("/:id/follow", authMiddleware, userController.unfollowUser);

module.exports = router;