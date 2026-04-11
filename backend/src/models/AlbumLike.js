// src/models/AlbumLike.js
const mongoose = require("mongoose");

const albumLikeSchema = new mongoose.Schema(
  {
    user: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    },
    album: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Album", 
      required: true 
    },
  },
  { timestamps: true }
);

// Garante que um usuário só pode curtir um álbum uma vez
albumLikeSchema.index({ user: 1, album: 1 }, { unique: true });

// Índices para consultas rápidas
albumLikeSchema.index({ album: 1 });
albumLikeSchema.index({ user: 1 });

module.exports = mongoose.model("AlbumLike", albumLikeSchema);