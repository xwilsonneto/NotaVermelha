const User = require("../models/User");
const Follow = require("../models/Follow");

exports.getUserById = async (id) => {
  return User.findById(id).select("-password");
};

exports.updateUser = async (userId, data) => {
  return User.findByIdAndUpdate(
    userId,
    data,
    { new: true }
  ).select("-password");
};

exports.followUser = async (followerId, followingId) => {

  const existing = await Follow.findOne({
    follower: followerId,
    following: followingId
  });

  if (existing) return existing;

  const follow = new Follow({
    follower: followerId,
    following: followingId
  });

  await follow.save();

  return follow;
};

exports.unfollowUser = async (followerId, followingId) => {

  return Follow.findOneAndDelete({
    follower: followerId,
    following: followingId
  });
};