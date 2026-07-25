// services/userService.js
const User = require("../models/User");
const Follow = require("../models/Follow");
const UserActivity = require("../models/UserActivity");
const Post = require("../models/Post");

exports.getUserById = async (id) => {
  return User.findById(id).select("-password");
};

exports.getUserByUsername = async (username) => {
  return User.findOne({ username: username.toLowerCase() }).select("-password");
};

exports.updateUser = async (userId, data) => {
  const allowed = ["name", "username", "bio", "bandInfo", "preferences"];
  const updateData = {};
  allowed.forEach((key) => {
    if (data[key] !== undefined) updateData[key] = data[key];
  });

  return User.findByIdAndUpdate(userId, updateData, { new: true, runValidators: true }).select(
    "-password"
  );
};

exports.updateAvatar = async (userId, file) => {
  const avatarUrl = file.path;

  if (file.public_id !== undefined) {
    try {
      const cloudinary = require("cloudinary").v2;
      const user = await User.findById(userId).select("avatar");
      if (user?.avatar && user.avatar.includes("cloudinary.com")) {
        const parts = user.avatar.split("/");
        const filename = parts[parts.length - 1].split(".")[0];
        const folder = parts[parts.length - 2];
        await cloudinary.uploader.destroy(`${folder}/${filename}`);
      }
    } catch (err) {
      console.warn("Falha ao deletar avatar antigo:", err.message);
    }
  }

  const updated = await User.findByIdAndUpdate(
    userId,
    { avatar: avatarUrl },
    { new: true }
  ).select("-password");

  return updated;
};

exports.followUser = async (followerId, followingId) => {
  const existing = await Follow.findOne({
    follower: followerId,
    followingUser: followingId,
  });

  if (existing) return existing;

  const follow = new Follow({ follower: followerId, followingUser: followingId });
  await follow.save();

  await User.findByIdAndUpdate(followerId, { $inc: { followingCount: 1 } });
  await User.findByIdAndUpdate(followingId, { $inc: { followersCount: 1 } });

  return follow;
};

exports.unfollowUser = async (followerId, followingId) => {
  const deleted = await Follow.findOneAndDelete({
    follower: followerId,
    followingUser: followingId,
  });

  if (deleted) {
    await User.findByIdAndUpdate(followerId, { $inc: { followingCount: -1 } });
    await User.findByIdAndUpdate(followingId, { $inc: { followersCount: -1 } });
  }

  return deleted;
};

// Busca atividades do usuário via recentlyPlayed (mesma fonte da home)
exports.getUserActivity = async (userId, limit = 20) => {
  const user = await User.findById(userId)
    .select("recentlyPlayed")
    .populate({
      path: "recentlyPlayed.track",
      populate: {
        path: "artists album",
        select: "name title cover coverUrl duration",
      },
    })
    .lean();

  if (!user || !Array.isArray(user.recentlyPlayed)) return [];

  return user.recentlyPlayed
    .sort((a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime())
    .slice(0, limit)
    .map((item) => ({
      _id: item._id,
      track: item.track,
      playedAt: item.playedAt,
      durationPlayed: item.track?.duration || 0,
    }));
};

exports.getUserPosts = async (userId, page = 1, limit = 20) => {
  const skip = (Math.max(1, page) - 1) * Math.min(limit, 50);

  return Post.find({ author: userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Math.min(limit, 50))
    .populate("author", "name username avatar")
    .populate({
      path: "originalPost",
      populate: [
        { path: "author", select: "name username avatar" },
        {
          path: "track",
          populate: {
            path: "artists album",
            select: "name title cover coverUrl",
          },
        },
      ],
    })
    .populate({
      path: "track",
      populate: {
        path: "artists album",
        select: "name title cover coverUrl",
      },
    })
    .lean();
};