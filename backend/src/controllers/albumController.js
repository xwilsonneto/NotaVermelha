const Album = require("../models/Album");

exports.createAlbum = async (req, res) => {
  try {
    const album = new Album({
      ...req.body,
      artist: req.user.id
    });

    await album.save();

    res.status(201).json(album);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAlbums = async (req, res) => {
  try {
    const albums = await Album.find()
      .populate("artist", "username");

    res.json(albums);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAlbumById = async (req, res) => {
  try {
    const album = await Album.findById(req.params.id)
      .populate("artist", "username");

    if (!album) {
      return res.status(404).json({ message: "Album não encontrado" });
    }

    res.json(album);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deleteAlbum = async (req, res) => {
  try {
    await Album.findByIdAndDelete(req.params.id);

    res.json({ message: "Album deletado" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};