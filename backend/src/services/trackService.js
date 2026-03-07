const Track = require("../models/Track");
const Artist = require("../models/Artist");

exports.getTracks = async (page = 1, limit = 20) => {

  const skip = (page - 1) * limit;

  const tracks = await Track.find()
    .populate({
      path: "artists",
      model: Artist,
      select: "name avatar genre verified"
    })
    .populate("album", "title coverUrl cover")
    .sort({ releaseDate: -1 })
    .skip(skip)
    .limit(limit)
    .lean();

  const total = await Track.countDocuments();

  return {
    success: true,
    count: tracks.length,
    total,
    page,
    pages: Math.ceil(total / limit),
    data: tracks,
  };

};

exports.getTrackById = async (id) => {

  return Track.findById(id)
    .populate({
      path: "artists",
      model: Artist,
      select: "name avatar genre verified"
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

exports.likeTrack = async (id) => {

  return Track.findByIdAndUpdate(
    id,
    { $inc: { likeCount: 1 } },
    { new: true, select: "likeCount" }
  );

};

exports.unlikeTrack = async (id) => {

  return Track.findByIdAndUpdate(
    id,
    { $inc: { likeCount: -1 } },
    { new: true, select: "likeCount" }
  );

};

exports.deleteTrack = async (id) => {

  return Track.findByIdAndDelete(id);

};