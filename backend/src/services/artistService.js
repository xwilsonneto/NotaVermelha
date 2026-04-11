const Artist = require("../models/Artist");
const Follow = require("../models/Follow");
const User = require("../models/User");

exports.createArtistProfile = async (userId, data) => {
  const artist = await Artist.create({
    ...data,
    ...(userId && { owner: userId })
  });
  return artist;
};

exports.getArtistById = async (id) => {
  return Artist.findById(id).lean();
};

exports.getAllArtists = async () => {
  return Artist.find({ isActive: true })
    .sort({ monthlyListeners: -1 })
    .lean();
};

/**
 * Seguir um artista:
 * 1. Cria Follow com followingArtist
 * 2. Incrementa followersCount no Artist
 * 3. Incrementa followingCount no User
 */
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
