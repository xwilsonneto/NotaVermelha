// backend/src/services/feedService.js

const Follow = require("../models/Follow");
const Album  = require("../models/Album");
const Track  = require("../models/Track");
const Artist = require("../models/Artist");
const Post   = require("../models/Post");

/**
 * Feed de posts da comunidade (texto/mídia publicados por usuários).
 * Usado pelo FeedSection / FeedComposer.
 */
exports.getPostFeed = async ({ page = 1, limit = 20 } = {}) => {
  const skip = (page - 1) * limit;

  const [posts, total] = await Promise.all([
    Post.find()
      .populate("author", "name avatar verified")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    Post.countDocuments(),
  ]);

  return {
    posts,
    page,
    totalPages: Math.ceil(total / limit),
    hasMore: skip + posts.length < total,
  };
};

/**
 * Feed de conteúdo musical dos artistas que o usuário segue
 * (álbuns, tracks, artistas).
 */
exports.getUserMusicFeed = async (userId) => {
  const follows = await Follow.find({
    follower:        userId,
    followingArtist: { $exists: true, $ne: null },
  });

  if (follows.length === 0) {
    return { artists: [], albums: [], tracks: [] };
  }

  const artistIds = follows.map(f => f.followingArtist);

  const [artists, albums, tracks] = await Promise.all([
    Artist.find({ _id: { $in: artistIds } })
      .select("name avatar genre verified monthlyListeners")
      .lean(),

    Album.find({ artist: { $in: artistIds } })
      .populate("artist", "name avatar verified")
      .sort({ releaseDate: -1 })
      .limit(20)
      .lean(),

    Track.find({ artists: { $in: artistIds } })
      .populate({ path: "artists", model: Artist, select: "name avatar verified monthlyListeners" })
      .populate("album", "title cover coverUrl")
      .sort({ releaseDate: -1 })
      .limit(30)
      .lean(),
  ]);

  return { artists, albums, tracks };
};