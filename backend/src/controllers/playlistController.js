const Playlist = require("../models/Playlist");

exports.createPlaylist = async (req, res) => {
  try {
    const playlist = new Playlist({
      ...req.body,
      owner: req.user.id
    });

    await playlist.save();

    res.status(201).json(playlist);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getUserPlaylists = async (req, res) => {
  try {
    const playlists = await Playlist.find({
      owner: req.user.id
    }).populate("tracks");

    res.json(playlists);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPlaylist = async (req, res) => {
  try {
    const playlist = await Playlist.findById(req.params.id)
      .populate("tracks");

    if (!playlist) {
      return res.status(404).json({ message: "Playlist não encontrada" });
    }

    res.json(playlist);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.deletePlaylist = async (req, res) => {
  try {
    await Playlist.findByIdAndDelete(req.params.id);

    res.json({ message: "Playlist deletada" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};