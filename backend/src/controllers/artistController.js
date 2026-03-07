const artistService = require("../services/artistService");

exports.createArtistProfile = async (req, res) => {
  try {

    const artist = await artistService.createArtistProfile(
      req.user.id,
      req.body
    );

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