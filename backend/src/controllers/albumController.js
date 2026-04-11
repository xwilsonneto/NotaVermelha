const Album = require("../models/Album");
const AlbumLike = require("../models/AlbumLike");
const User = require("../models/User"); // Adicionar import

exports.createAlbum = async (req, res) => {
  try {
    // Verificar se o usuário existe e tem role de artista
    const user = await User.findById(req.user.id);
    if (!user || !["artist", "band", "label"].includes(user.role)) {
      return res.status(403).json({ message: "Usuário não autorizado a criar álbuns" });
    }

    const album = new Album({
      ...req.body,
      artist: req.user.id // Agora usa o ID do User, não ArtistProfile
    });
    
    await album.save();
    
    // Popular o artista para retornar com dados completos
    await album.populate("artist", "username name avatar");
    
    res.status(201).json(album);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

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

exports.getAlbumById = async (req, res) => {
  try {
    const album = await Album.findById(req.params.id)
      .populate("artist", "username name avatar")
      .populate({
        path: "tracks",
        populate: { path: "artists", select: "name username avatar" }
      });
      
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
    
    // Verificar se o usuário é o dono do álbum
    if (album.artist.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Não autorizado a deletar este álbum" });
    }
    
    await Album.findByIdAndDelete(req.params.id);
    // Remover todos os likes associados
    await AlbumLike.deleteMany({ album: req.params.id });
    
    res.json({ message: "Álbum deletado com sucesso" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Like / Unlike ────────────────────────────────────────────────────────────

exports.likeAlbum = async (req, res) => {
  try {
    const { id: albumId } = req.params;
    const userId = req.user.id;

    // Verificar se o álbum existe
    const album = await Album.findById(albumId);
    if (!album) {
      return res.status(404).json({ message: "Álbum não encontrado" });
    }

    const existing = await AlbumLike.findOne({ user: userId, album: albumId });
    if (existing) {
      return res.status(400).json({ success: false, message: "Álbum já curtido" });
    }

    await AlbumLike.create({ user: userId, album: albumId });
    
    // Incrementar likeCount no álbum
    await Album.findByIdAndUpdate(albumId, { $inc: { likeCount: 1 } });

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

    // Decrementar likeCount no álbum
    await Album.findByIdAndUpdate(albumId, { $inc: { likeCount: -1 } });
    
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