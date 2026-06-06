const artistService = require("../services/artistService");
const cursorPagination = require("../services/cursorPaginationService");
const cacheService = require("../services/cacheService");

exports.createArtistProfile = async (req, res) => {
  try {
    const artist = await artistService.createArtistProfile(req.user.id, req.body);
    res.status(201).json(artist);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// MANTIDO - método original
exports.getArtists = async (req, res) => {
  try {
    const artists = await artistService.getAllArtists();
    res.json(artists);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// NOVO - método com cursor pagination
exports.getArtistsCursor = async (req, res) => {
  try {
    const cursor = req.query.cursor || null;
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const search = req.query.search || '';
    
    const cacheKey = `artists:${search}:${cursor || 'first'}:${limit}`;
    const result = await cacheService.getOrSet(cacheKey, async () => {
      return await cursorPagination.paginateArtists(search, cursor, limit);
    }, 300);
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getArtistById = async (req, res) => {
  try {
    const cacheKey = `artist:${req.params.id}`;
    const artist = await cacheService.getOrSet(cacheKey, async () => {
      return await artistService.getArtistById(req.params.id);
    }, 600); // 10 minutos
    
    if (!artist) {
      return res.status(404).json({ message: "Artista não encontrado" });
    }
    res.json(artist);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.followArtist = async (req, res) => {
  try {
    const result = await artistService.followArtist(req.user.id, req.params.id);
    // Invalidar caches relacionados
    await cacheService.invalidateArtist(req.params.id);
    await cacheService.invalidatePattern(`feed:${req.user.id}:*`);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error("FOLLOW ERROR DETALHADO:", error);
    res.status(500).json({ message: error.message });
  }
};

exports.unfollowArtist = async (req, res) => {
  try {
    const result = await artistService.unfollowArtist(req.user.id, req.params.id);
    await cacheService.invalidateArtist(req.params.id);
    await cacheService.invalidatePattern(`feed:${req.user.id}:*`);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.checkFollowing = async (req, res) => {
  try {
    const isFollowing = await artistService.isFollowingArtist(req.user.id, req.params.id);
    res.json({ success: true, isFollowing });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};