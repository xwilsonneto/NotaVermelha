const Track = require("../models/Track");
const Artist = require("../models/Artist");
const Like = require("../models/Like");
const User = require("../models/User");
const cacheService = require("./cacheService");

exports.getTracks = async () => {
  const tracks = await Track.find()
    .populate({
      path: "artists",
      model: Artist,
      select: "name avatar genre verified monthlyListeners"
    })
    .populate("album", "title coverUrl cover")
    .sort({ releaseDate: -1 })
    .lean();

  return {
    success: true,
    count: tracks.length,
    data: tracks,
  };
};

exports.getTrackById = async (id) => {
  return Track.findById(id)
    .populate({
      path: "artists",
      model: Artist,
      select: "name avatar genre verified monthlyListeners"
    })
    .populate("album", "title coverUrl cover")
    .lean();
};

exports.createTrack = async (data) => {
  const track = await Track.create(data);

  // invalida o cache da página de cada artista envolvido,
  // senão a track nova não aparece até o TTL expirar
  for (const artistId of track.artists) {
    await cacheService.invalidateArtist(artistId);
  }

  return track;
};

exports.incrementPlay = async (id) => {
  const track = await Track.findByIdAndUpdate(
    id,
    { $inc: { playCount: 1 } },
    { new: true }
  ).select("artists playCount");

  // como "Populares" é ordenado por playCount, invalida pra
  // refletir a nova posição no ranking
  if (track) {
    for (const artistId of track.artists) {
      await cacheService.invalidateArtist(artistId);
    }
  }

  return track;
};

exports.likeTrack = async (trackId, userId) => {

  // Verifica se já curtiu
  const existing = await Like.findOne({ user: userId, track: trackId });

  if (existing) {
    const track = await Track.findById(trackId).select("likeCount");
    return { likeCount: track.likeCount, alreadyLiked: true };
  }

  // Cria o Like
  await Like.create({ user: userId, track: trackId });

  // Incrementa na track
  const track = await Track.findByIdAndUpdate(
    trackId,
    { $inc: { likeCount: 1 } },
    { new: true, select: "likeCount" }
  );

  await User.findByIdAndUpdate(
    userId,
    { $addToSet: { likedTracks: trackId } }
  );

  return { likeCount: track.likeCount, alreadyLiked: false };
};

exports.unlikeTrack = async (trackId, userId) => {

  const existing = await Like.findOneAndDelete({ user: userId, track: trackId });

  if (!existing) {
    const track = await Track.findById(trackId).select("likeCount");
    return { likeCount: track?.likeCount ?? 0, notLiked: true };
  }

  const track = await Track.findByIdAndUpdate(
    trackId,
    [{ $set: { likeCount: { $max: [{ $subtract: ["$likeCount", 1] }, 0] } } }],
    { new: true, select: "likeCount" }
  );

  await User.findByIdAndUpdate(
    userId,
    { $pull: { likedTracks: trackId } }
  );

  return { likeCount: track.likeCount, notLiked: false };
};

exports.deleteTrack = async (id) => {
  const track = await Track.findByIdAndDelete(id);

  if (track) {
    for (const artistId of track.artists) {
      await cacheService.invalidateArtist(artistId);
    }
  }

  return track;
};

/**
 * Retorna as tracks curtidas por um usuário
 */
exports.getLikedTracks = async (userId, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;

  const user = await User.findById(userId)
    .select("likedTracks")
    .populate({
      path: "likedTracks",
      options: { skip, limit },
      populate: [
        { path: "artists", model: Artist, select: "name avatar genre verified monthlyListeners" },
        { path: "album", select: "title coverUrl cover" },
      ],
    })
    .lean();

  return user?.likedTracks ?? [];
};