const trackService = require("../services/trackService");
const cursorPagination = require("../services/cursorPaginationService");
const cacheService = require("../services/cacheService");

exports.createTrack = async (req, res) => {
  try {
    const track = await trackService.createTrack({ ...req.body, artist: req.user.id });
    res.status(201).json({ success: true, data: track });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.uploadTrack = async (req, res) => {
  try {
    const audio = req.files?.audio?.[0]?.path;
    const cover = req.files?.cover?.[0]?.path;
    if (!audio) return res.status(400).json({ success: false, message: "Arquivo de áudio obrigatório" });
    const track = await trackService.createTrack({
      ...req.body,
      artist: req.user.id,
      audioUrl: audio,
      coverUrl: cover,
    });
    res.status(201).json({ success: true, data: track });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// MANTIDO - método original com paginação (não quebra nada)
exports.getTracks = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const result = await trackService.getTracks(page, limit);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// NOVO - método com cursor pagination (MAIS EFICIENTE)
exports.getTracksCursor = async (req, res) => {
  try {
    const cursor = req.query.cursor || null;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100); // Max 100
    
    const result = await cursorPagination.paginateTracks({}, cursor, limit);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// MANTIDO - método original
exports.getTrackById = async (req, res) => {
  try {
    // Com cache
    const cacheKey = `track:${req.params.id}`;
    const track = await cacheService.getOrSet(cacheKey, async () => {
      return await trackService.getTrackById(req.params.id);
    }, 300);
    
    if (!track) return res.status(404).json({ success: false, message: "Track não encontrada" });
    res.json({ success: true, data: track });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.registerPlay = async (req, res) => {
  try {
    const track = await trackService.incrementPlay(req.params.id);
    if (!track) return res.status(404).json({ success: false, message: "Track não encontrada" });
    // Invalidar cache
    await cacheService.invalidateTrack(req.params.id);
    res.json({ success: true, playCount: track.playCount });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.likeTrack = async (req, res) => {
  try {
    const result = await trackService.likeTrack(req.params.id, req.user.id);
    await cacheService.invalidateTrack(req.params.id);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.unlikeTrack = async (req, res) => {
  try {
    const result = await trackService.unlikeTrack(req.params.id, req.user.id);
    await cacheService.invalidateTrack(req.params.id);
    res.json({ success: true, ...result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getLikedTracks = async (userId) => {
  const user = await User.findById(userId)
    .select("likedTracks")
    .populate({
      path: "likedTracks",
      populate: [
        { 
          path: "artists", 
          model: Artist, 
          select: "name avatar genre verified monthlyListeners" 
        },
        { 
          path: "album", 
          select: "title coverUrl cover" 
        },
      ],
    })
    .lean();

  return user?.likedTracks ?? [];
};

exports.deleteTrack = async (req, res) => {
  try {
    await trackService.deleteTrack(req.params.id);
    await cacheService.invalidateTrack(req.params.id);
    res.json({ success: true, message: "Track deletada" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};