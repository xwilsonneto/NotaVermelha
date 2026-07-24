// backend/src/controllers/feedController.js

const Post        = require("../models/Post");
const feedService = require("../services/feedService");

// GET /api/feed
// Feed clássico: posts da comunidade + conteúdo dos artistas seguidos
exports.getFeed = async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const skip  = (page - 1) * limit;

    // Posts públicos (todos os usuários), ordenados por recência
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("author", "name username avatar");

    // Conteúdo musical dos artistas seguidos
    const musicContent = await feedService.getUserFeed(req.user.id);

    res.json({
      success: true,
      posts,
      ...musicContent,
      pagination: { page, limit },
    });
  } catch (err) {
    console.error("[getFeed]", err);
    res.status(500).json({ message: "Erro ao carregar o feed." });
  }
};

// GET /api/feed/cursor  — scroll infinito com cursor pagination
exports.getFeedCursor = async (req, res) => {
  try {
    const limit  = Math.min(parseInt(req.query.limit) || 20, 50);
    const cursor = req.query.cursor; // _id do último post recebido

    const query = cursor
      ? { _id: { $lt: cursor } }   // posts mais antigos que o cursor
      : {};

    const posts = await Post.find(query)
      .sort({ _id: -1 })
      .limit(limit + 1)             // busca 1 a mais para saber se há próxima página
      .populate("author", "name username avatar");

    const hasMore   = posts.length > limit;
    const items     = hasMore ? posts.slice(0, limit) : posts;
    const nextCursor = hasMore ? items[items.length - 1]._id : null;

    res.json({ success: true, posts: items, nextCursor, hasMore });
  } catch (err) {
    console.error("[getFeedCursor]", err);
    res.status(500).json({ message: "Erro ao carregar o feed." });
  }
};