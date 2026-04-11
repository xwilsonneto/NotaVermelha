const Track = require("../models/Track");
const Artist = require("../models/Artist");
const Like = require("../models/Like");
const User = require("../models/User");

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
  return Track.create(data);
};

exports.incrementPlay = async (id) => {
  return Track.findByIdAndUpdate(
    id,
    { $inc: { playCount: 1 } },
    { new: true }
  );
};

/**
 * Like em uma track:
 * 1. Cria documento na collection Like (único por user+track)
 * 2. Incrementa likeCount na Track
 * 3. Adiciona trackId ao array likedTracks do User
 * Retorna { likeCount, alreadyLiked } para o controller tratar
 */
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

  // Adiciona ao perfil do usuário (sem duplicatas)
  await User.findByIdAndUpdate(
    userId,
    { $addToSet: { likedTracks: trackId } }
  );

  return { likeCount: track.likeCount, alreadyLiked: false };
};

/**
 * Unlike em uma track:
 * 1. Remove documento da collection Like
 * 2. Decrementa likeCount na Track (mínimo 0)
 * 3. Remove trackId do array likedTracks do User
 */
exports.unlikeTrack = async (trackId, userId) => {

  const existing = await Like.findOneAndDelete({ user: userId, track: trackId });

  if (!existing) {
    const track = await Track.findById(trackId).select("likeCount");
    return { likeCount: track?.likeCount ?? 0, notLiked: true };
  }

  // Garante que likeCount não vá abaixo de 0
  const track = await Track.findByIdAndUpdate(
    trackId,
    [{ $set: { likeCount: { $max: [{ $subtract: ["$likeCount", 1] }, 0] } } }],
    { new: true, select: "likeCount" }
  );

  // Remove do perfil do usuário
  await User.findByIdAndUpdate(
    userId,
    { $pull: { likedTracks: trackId } }
  );

  return { likeCount: track.likeCount, notLiked: false };
};

exports.deleteTrack = async (id) => {
  return Track.findByIdAndDelete(id);
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