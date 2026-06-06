const Album = require("../models/Album");
const AlbumLike = require("../models/AlbumLike");
const User = require("../models/User");
const cursorPagination = require("../services/cursorPaginationService");
const cacheService = require("../services/cacheService");

exports.createAlbum = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || !["artist", "band", "label"].includes(user.role)) {
      return res.status(403).json({ message: "Usuário não autorizado a criar álbuns" });
    }

    const album = new Album({
      ...req.body,
      artist: req.user.id
    });
    
    await album.save();
    await album.populate("artist", "username name avatar");
    
    await cacheService.invalidatePattern('albums:*');
    res.status(201).json(album);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// MANTIDO - método original
exports.getAlbums = async (req, res) => {
  try {
    const albums = await Album.find()
      .populate("artist", "username name avatar")
      .sort({ releaseDate: -1 });
    res.json(albums);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// NOVO - método com cursor pagination
exports.getAlbumsCursor = async (req, res) => {
  try {
    const cursor = req.query.cursor || null;
    const limit = Math.min(parseInt(req.query.limit) || 20, 50);
    const artistId = req.query.artistId || null;
    
    let result;
    if (artistId) {
      result = await cursorPagination.paginateArtistAlbums(artistId, cursor, limit);
    } else {
      // Para todos os álbuns
      const query = {};
      if (cursor) {
        const lastDoc = await Album.findById(cursor).select('releaseDate _id').lean();
        if (lastDoc) {
          query.$or = [
            { releaseDate: { $lt: lastDoc.releaseDate } },
            { releaseDate: lastDoc.releaseDate, _id: { $lt: lastDoc._id } }
          ];
        }
      }
      
      const albums = await Album.find(query)
        .populate("artist", "name avatar")
        .sort({ releaseDate: -1, _id: -1 })
        .limit(limit + 1)
        .lean();
      
      const hasMore = albums.length > limit;
      const nextCursor = hasMore ? albums[limit - 1]._id : null;
      result = {
        success: true,
        data: hasMore ? albums.slice(0, limit) : albums,
        nextCursor,
        hasMore,
        count: albums.length > limit ? limit : albums.length
      };
    }
    
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAlbumById = async (req, res) => {
  try {
    const cacheKey = `album:${req.params.id}`;
    const album = await cacheService.getOrSet(cacheKey, async () => {
      return await Album.findById(req.params.id)
        .populate("artist", "username name avatar")
        .populate({
          path: "tracks",
          populate: { path: "artists", select: "name username avatar" }
        });
    }, 600);
      
    if (!album) {
      return res.status(404).json({ message: "Álbum não encontrado" });
    }
    
    res.json(album);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteAlbum = async (req, res) => {
  try {
    const album = await Album.findById(req.params.id);
    
    if (!album) {
      return res.status(404).json({ message: "Álbum não encontrado" });
    }
    
    if (album.artist.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Não autorizado a deletar este álbum" });
    }
    
    await Album.findByIdAndDelete(req.params.id);
    await AlbumLike.deleteMany({ album: req.params.id });
    
    await cacheService.invalidatePattern('albums:*');
    await cacheService.invalidatePattern(`album:${req.params.id}`);
    
    res.json({ message: "Álbum deletado com sucesso" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.likeAlbum = async (req, res) => {
  try {
    const { id: albumId } = req.params;
    const userId = req.user.id;

    const album = await Album.findById(albumId);
    if (!album) {
      return res.status(404).json({ message: "Álbum não encontrado" });
    }

    const existing = await AlbumLike.findOne({ user: userId, album: albumId });
    if (existing) {
      return res.status(400).json({ success: false, message: "Álbum já curtido" });
    }

    await AlbumLike.create({ user: userId, album: albumId });
    await Album.findByIdAndUpdate(albumId, { $inc: { likeCount: 1 } });
    
    await cacheService.invalidatePattern(`album:${albumId}`);
    
    res.json({ success: true, liked: true, message: "Álbum curtido com sucesso" });
  } catch (error) {
    console.error("Erro ao curtir álbum:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.unlikeAlbum = async (req, res) => {
  try {
    const { id: albumId } = req.params;
    const userId = req.user.id;

    const deleted = await AlbumLike.findOneAndDelete({ user: userId, album: albumId });
    if (!deleted) {
      return res.status(400).json({ success: false, message: "Álbum não estava curtido" });
    }

    await Album.findByIdAndUpdate(albumId, { $inc: { likeCount: -1 } });
    
    await cacheService.invalidatePattern(`album:${albumId}`);
    
    res.json({ success: true, liked: false, message: "Like removido com sucesso" });
  } catch (error) {
    console.error("Erro ao remover like do álbum:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.checkLike = async (req, res) => {
  try {
    const { id: albumId } = req.params;
    const userId = req.user.id;

    const like = await AlbumLike.findOne({ user: userId, album: albumId });
    
    res.json({ 
      success: true, 
      liked: !!like,
      data: { liked: !!like }
    });
  } catch (error) {
    console.error("Erro ao verificar like do álbum:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};