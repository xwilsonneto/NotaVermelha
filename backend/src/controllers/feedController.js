const feedService = require("../services/feedService");
const cursorPagination = require("../services/cursorPaginationService");
const cacheService = require("../services/cacheService");

// MANTIDO - método original (não quebra)
exports.getFeed = async (req, res) => {
  try {
    const feed = await feedService.getUserFeed(req.user.id);
    res.json({ success: true, data: feed });
  } catch (error) {
    console.error("Feed error:", error);
    res.status(500).json({ message: error.message });
  }
};

// NOVO - método com cursor pagination para feed infinito
exports.getFeedCursor = async (req, res) => {
  try {
    const cursor = req.query.cursor || null;
    const limit = Math.min(parseInt(req.query.limit) || 30, 100);
    
    const cacheKey = `feed:${req.user.id}:${cursor || 'first'}:${limit}`;
    const result = await cacheService.getOrSet(cacheKey, async () => {
      return await cursorPagination.paginateUserFeed(req.user.id, cursor, limit);
    }, 60); // Cache por 1 minuto apenas
    
    res.json(result);
  } catch (error) {
    console.error("Feed cursor error:", error);
    res.status(500).json({ message: error.message });
  }
};