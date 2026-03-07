const Activity = require("../models/Activity");
const Follow = require("../models/Follow");

exports.getUserFeed = async (userId) => {

  const follows = await Follow.find({ follower: userId });

  const followingIds = follows.map(f => f.following);

  const activities = await Activity.find({
    user: { $in: followingIds }
  })
    .sort({ createdAt: -1 })
    .limit(50)
    .populate("user", "username");

  return activities;
};