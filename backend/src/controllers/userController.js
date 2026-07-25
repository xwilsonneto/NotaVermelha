// controllers/userController.js
const userService = require("../services/userService");

exports.getMyProfile = async (req, res) => {
  try {
    const user = await userService.getUserById(req.user.id);
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUserById = async (req, res) => {
  try {
    const user = await userService.getUserById(req.params.id);
    if (!user) return res.status(404).json({ message: "Usuário não encontrado" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// NOVO: busca por username (perfil público)
exports.getUserByUsername = async (req, res) => {
  try {
    const user = await userService.getUserByUsername(req.params.username);
    if (!user) return res.status(404).json({ message: "Usuário não encontrado" });

    // Se houver token, verifica se o usuário logado segue este perfil
    let followedByMe = false;
    if (req.user?.id) {
      const Follow = require("../models/Follow");
      const existing = await Follow.findOne({
        follower: req.user.id,
        followingUser: user._id,
      });
      followedByMe = !!existing;
    }

    res.json({ data: { ...user.toObject(), followedByMe } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// NOVO: atividades recentes do usuário
exports.getUserActivity = async (req, res) => {
  try {
    const user = await userService.getUserByUsername(req.params.username);
    if (!user) return res.status(404).json({ message: "Usuário não encontrado" });

    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const activities = await userService.getUserActivity(user._id, limit);

    res.json({ success: true, data: activities });
  } catch (error) {
    console.error("[getUserActivity]", error);
    res.status(500).json({ message: error.message });
  }
};

// NOVO: posts do usuário
exports.getUserPosts = async (req, res) => {
  try {
    const user = await userService.getUserByUsername(req.params.username);
    if (!user) return res.status(404).json({ message: "Usuário não encontrado" });

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);

    const posts = await userService.getUserPosts(user._id, page, limit);

    res.json({ success: true, data: posts });
  } catch (error) {
    console.error("[getUserPosts]", error);
    res.status(500).json({ message: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const updated = await userService.updateUser(req.user.id, req.body);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Nenhuma imagem enviada" });
    }
    const updated = await userService.updateAvatar(req.user.id, req.file);
    res.json({ avatar: updated.avatar, user: updated });
  } catch (error) {
    console.error("Erro uploadAvatar:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.followUser = async (req, res) => {
  try {
    const follow = await userService.followUser(req.user.id, req.params.id);
    res.json(follow);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.unfollowUser = async (req, res) => {
  try {
    await userService.unfollowUser(req.user.id, req.params.id);
    res.json({ message: "Unfollow realizado" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};