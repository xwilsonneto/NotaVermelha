const trackService = require("../services/trackService");
const cursorPagination = require("../services/cursorPaginationService");
const cacheService = require("../services/cacheService");
const User = require("../models/User");
const Artist = require("../models/Artist");

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

exports.getTracksCursor = async (req, res) => {
  try {
    const cursor = req.query.cursor || null;
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const result = await cursorPagination.paginateTracks({}, cursor, limit);
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTrackById = async (req, res) => {
  try {
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

    // Salva no histórico do usuário autenticado (opcional — não quebra se não estiver logado)
    if (req.user?.id) {
      await User.findByIdAndUpdate(req.user.id, {
        // Insere no início do array
        $push: {
          recentlyPlayed: {
            $each: [{ track: req.params.id, playedAt: new Date() }],
            $position: 0,
            $slice: 50, // mantém só as últimas 50
          },
        },
      });
    }

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

exports.getLikedTracks = async (req, res) => {
  try {
    const tracks = await trackService.getLikedTracks(req.user.id);
    res.json({ success: true, data: tracks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Retorna as últimas tracks ouvidas pelo usuário logado
exports.getRecentlyPlayed = async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 6, 20);
    const user = await User.findById(req.user.id)
      .select("recentlyPlayed")
      .populate({
        path: "recentlyPlayed.track",
        populate: [
          { path: "artists", model: Artist, select: "name avatar genre verified monthlyListeners" },
          { path: "album", select: "title coverUrl cover" },
        ],
      })
      .lean();

      console.log(JSON.stringify(user.recentlyPlayed, null, 2));

    // Remove entradas com track deletada e deduplica por álbum:
    // se ouviu 6 músicas do mesmo álbum, exibe só a última (mais recente primeiro)
    const seenAlbums = new Set();
    const seenTracks = new Set();
    const tracks = (user?.recentlyPlayed ?? [])
      .filter((entry) => {
        if (!entry.track) return false;
        const trackId = String(entry.track._id);
        const albumId = entry.track.album
          ? String(entry.track.album._id ?? entry.track.album)
          : null;
        if (albumId) {
          if (seenAlbums.has(albumId)) return false;
          seenAlbums.add(albumId);
        } else {
          if (seenTracks.has(trackId)) return false;
          seenTracks.add(trackId);
        }
        return true;
      })
      .slice(0, limit)
      .map((entry) => entry.track);

    res.json({ success: true, count: tracks.length, data: tracks });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
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