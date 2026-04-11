const mongoose = require("mongoose");

const albumSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },

  artist: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Alterado de "ArtistProfile" para "User"
    required: true
  },

  cover: String,

  releaseDate: {
    type: Date,
    default: Date.now
  },

  type: {
    type: String,
    enum: ["album", "ep", "single", "live", "compilation"],
    default: "album"
  },

  genres: [String],

  totalTracks: {
    type: Number,
    default: 0
  },

  duration: {
    type: Number,
    default: 0
  },

  likeCount: { // ADICIONAR: campo para contar likes
    type: Number,
    default: 0
  }

}, { timestamps: true });

albumSchema.virtual("tracks", {
  ref: "Track",
  localField: "_id",
  foreignField: "album"
});

albumSchema.index({ title: "text" });
albumSchema.index({ artist: 1 });
albumSchema.index({ releaseDate: -1 });

module.exports = mongoose.model("Album", albumSchema);