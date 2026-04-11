const feedService = require("../services/feedService");

exports.getFeed = async (req, res) => {
  try {
    const feed = await feedService.getUserFeed(req.user.id);
    res.json({ success: true, data: feed });
  } catch (error) {
    console.error("Feed error:", error);
    res.status(500).json({ message: error.message });
  }
};