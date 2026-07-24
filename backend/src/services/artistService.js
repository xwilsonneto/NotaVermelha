const Artist = require("../models/Artist");
const Follow = require("../models/Follow");
const User = require("../models/User");
const Track = require("../models/Track");
const Album = require("../models/Album");

exports.createArtistProfile = async (userId, data) => {
  const artist = await Artist.create({
    ...data,
    ...(userId && { owner: userId })
  });
  return artist;
};

/**
 * Busca o artista + músicas mais tocadas + álbuns
 */
exports.getArtistById = async (id) => {
  const artist = await Artist.findById(id).lean();
  if (!artist) return null;

  const [tracks, albums] = await Promise.all([
    Track.find({ artists: id })
      .populate("artists", "name avatar")
      .populate("album", "title coverUrl cover")
      .sort({ playCount: -1 })
      .limit(10)
      .lean(),

    Album.find({ artist: id })
      .sort({ releaseDate: -1 })
      .lean(),
  ]);

  return {
    ...artist,
    tracks,
    albums,
  };
};

exports.getAllArtists = async () => {
  return Artist.find({ isActive: true })
    .sort({ monthlyListeners: -1 })
    .lean();
};

exports.followArtist = async (userId, artistId) => {

  const existing = await Follow.findOne({
    follower: userId,
    followingArtist: artistId,
  });

  if (existing) return { follow: existing, alreadyFollowing: true };

  const follow = await Follow.create({
    follower: userId,
    followingArtist: artistId,
  });

  await Artist.findByIdAndUpdate(artistId, { $inc: { monthlyListeners: 1 } });
  await User.findByIdAndUpdate(userId, { $inc: { followingCount: 1 } });

  return { follow, alreadyFollowing: false };
};

/**
 * Deixar de seguir um artista
 */
exports.unfollowArtist = async (userId, artistId) => {

  const deleted = await Follow.findOneAndDelete({
    follower: userId,
    followingArtist: artistId,
  });

  if (!deleted) return { notFollowing: true };

  await Artist.findByIdAndUpdate(artistId, {
    $inc: { monthlyListeners: -1 }
  });
  await User.findByIdAndUpdate(userId, { $inc: { followingCount: -1 } });

  return { notFollowing: false };
};

/**
 * Verifica se um usuário segue um artista
 */
exports.isFollowingArtist = async (userId, artistId) => {
  const follow = await Follow.findOne({
    follower: userId,
    followingArtist: artistId,
  });
  return !!follow;
};
