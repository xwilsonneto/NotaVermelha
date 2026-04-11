const Follow = require("../models/Follow");
const Album = require("../models/Album");
const Track = require("../models/Track");
const Artist = require("../models/Artist");

exports.getUserFeed = async (userId) => {
  // 1. Busca os artistas que o usuário segue
  const follows = await Follow.find({
    follower: userId,
    followingArtist: { $exists: true, $ne: null }
  });

  if (follows.length === 0) {
    return { artists: [], albums: [], tracks: [] };
  }

  const artistIds = follows.map(f => f.followingArtist);

  // 2. Busca os artistas seguidos
  const artists = await Artist.find({ _id: { $in: artistIds } })
    .select("name avatar genre verified monthlyListeners")
    .lean();

  // 3. Álbuns recentes dos artistas seguidos
  const albums = await Album.find({ artist: { $in: artistIds } })
    .populate("artist", "name avatar verified")
    .sort({ releaseDate: -1 })
    .limit(20)
    .lean();

  // 4. Tracks recentes dos artistas seguidos
  const tracks = await Track.find({ artists: { $in: artistIds } })
    .populate({ path: "artists", model: Artist, select: "name avatar verified monthlyListeners" })
    .populate("album", "title cover coverUrl")
    .sort({ releaseDate: -1 })
    .limit(30)
    .lean();

  return { artists, albums, tracks };
};