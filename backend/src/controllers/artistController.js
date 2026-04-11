const artistService = require("../services/artistService");

exports.createArtistProfile = async (req, res) => {
  try {
    const artist = await artistService.createArtistProfile(req.user.id, req.body);
    res.status(201).json(artist);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getArtists = async (req, res) => {
  try {
    const artists = await artistService.getAllArtists();
    res.json(artists);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getArtistById = async (req, res) => {
  try {
    const artist = await artistService.getArtistById(req.params.id);
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
    res.json({ success: true, ...result });
  } catch (error) {
    console.error("FOLLOW ERROR DETALHADO:", error); // ← adiciona isso
    res.status(500).json({ message: error.message });
  }
};

exports.unfollowArtist = async (req, res) => {
  try {
    const result = await artistService.unfollowArtist(req.user.id, req.params.id);
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
