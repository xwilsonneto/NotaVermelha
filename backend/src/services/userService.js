// services/userService.js
const User = require("../models/User");
const Follow = require("../models/Follow");

exports.getUserById = async (id) => {
  return User.findById(id).select("-password");
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
  // Cloudinary salva a URL pública em file.path
  // diskStorage salva o caminho local em file.path também
  const avatarUrl = file.path;

  // Tenta deletar o avatar antigo do Cloudinary se existir
  if (file.public_id === undefined) {
    // fallback local — não há nada para deletar no Cloudinary
  } else {
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
    following: followingId,
  });

  if (existing) return existing;

  const follow = new Follow({ follower: followerId, following: followingId });
  await follow.save();
  return follow;
};

exports.unfollowUser = async (followerId, followingId) => {
  return Follow.findOneAndDelete({ follower: followerId, following: followingId });
};