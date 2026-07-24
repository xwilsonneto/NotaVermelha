// backend/src/controllers/postController.js

const Post = require("../models/Post");

// GET /api/posts  — posts do próprio usuário autenticado
exports.getPosts = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const skip  = (page - 1) * limit;

    const posts = await Post.find({ author: req.user.id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("author", "name username avatar");

    res.json({ success: true, posts });
  } catch (err) {
    console.error("[getPosts]", err);
    res.status(500).json({ message: "Erro ao buscar postagens." });
  }
};

// POST /api/posts
exports.createPost = async (req, res) => {
  try {
    const { text, type, attachments } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ message: "O texto da postagem é obrigatório." });
    }

    if (text.length > 280) {
      return res.status(400).json({ message: "O texto não pode ultrapassar 280 caracteres." });
    }

    const post = await Post.create({
      author:      req.user.id,
      text:        text.trim(),
      type:        type || "text",
      attachments: attachments || [],
    });

    await post.populate("author", "name username avatar");

    res.status(201).json({ success: true, post });
  } catch (err) {
    console.error("[createPost]", err);
    res.status(500).json({ message: "Erro ao criar postagem." });
  }
};

// DELETE /api/posts/:id
exports.deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Postagem não encontrada." });
    }

    if (post.author.toString() !== req.user.id) {
      return res.status(403).json({ message: "Sem permissão para deletar esta postagem." });
    }

    await post.deleteOne();
    res.json({ success: true });
  } catch (err) {
    console.error("[deletePost]", err);
    res.status(500).json({ message: "Erro ao deletar postagem." });
  }
};

// POST /api/posts/:id/like  — toggle curtida
exports.toggleLike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Postagem não encontrada." });

    const userId = req.user.id;
    const liked  = post.likes.map(String).includes(userId);

    if (liked) {
      post.likes = post.likes.filter((id) => id.toString() !== userId);
    } else {
      post.likes.push(userId);
    }

    await post.save();
    res.json({ success: true, liked: !liked, likesCount: post.likes.length });
  } catch (err) {
    console.error("[toggleLike]", err);
    res.status(500).json({ message: "Erro ao curtir postagem." });
  }
};

// POST /api/posts/:id/repost  — toggle repost (RT)
exports.toggleRepost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Postagem não encontrada." });

    const userId   = req.user.id;
    const reposted = post.reposts.map(String).includes(userId);

    if (reposted) {
      post.reposts = post.reposts.filter((id) => id.toString() !== userId);
    } else {
      post.reposts.push(userId);
    }

    await post.save();
    res.json({ success: true, reposted: !reposted, repostsCount: post.reposts.length });
  } catch (err) {
    console.error("[toggleRepost]", err);
    res.status(500).json({ message: "Erro ao repostar postagem." });
  }
};