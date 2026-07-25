// backend/src/models/Post.js

const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    author: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "User",
      required: true,
    },
    text: {
      type:      String,
      required:  true,
      trim:      true,
      maxlength: 280,
    },
    type: {
      type:    String,
      enum:    ["text", "music", "event", "repost"],
      default: "text",
    },
    attachments: [
      {
        kind: { type: String, enum: ["image", "video", "music", "event"] },
        url:  { type: String },
        meta: { type: mongoose.Schema.Types.Mixed },
      },
    ],
    // Track anexada (quando type === "music")
    track: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Track",
    },
    likes:   [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    // Contador de reposts (quem repostou o post original)
    reposts: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    // Repost de verdade: referência ao post original
    originalPost: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      default: null,
    },
    isRepost: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ createdAt: -1 });
postSchema.index({ originalPost: 1, author: 1 }, { unique: true, sparse: true }); // evita repost duplicado do mesmo user

module.exports = mongoose.model("Post", postSchema);