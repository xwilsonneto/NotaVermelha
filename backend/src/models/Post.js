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
      enum:    ["text", "music", "event"],
      default: "text",
    },
    attachments: [
      {
        kind: { type: String, enum: ["image", "video", "music", "event"] },
        url:  { type: String },
        meta: { type: mongoose.Schema.Types.Mixed },
      },
    ],
    likes:   [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    // ✅ Novo: reposts (retweets)
    reposts: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

postSchema.index({ author: 1, createdAt: -1 });
postSchema.index({ createdAt: -1 });   // índice para o feed geral

module.exports = mongoose.model("Post", postSchema);