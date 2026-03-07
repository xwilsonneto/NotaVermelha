// src/models/UserActivity.js
const mongoose = require('mongoose');

const userActivitySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  track: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Track',
    required: true,
  },
  playedAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  durationPlayed: {
    type: Number, // segundos ouvidos
    required: true,
    min: 0,
  },
  completed: {
    type: Boolean,
    default: false,
  },
  source: {
    type: String,
    enum: ['home', 'search', 'playlist', 'album', 'artist', 'radio', 'recommendation'],
    default: 'home',
  },
  device: {
    type: String,
    enum: ['mobile', 'desktop', 'tablet', 'web'],
    default: 'mobile',
  },
  location: {
    latitude: Number,
    longitude: Number,
  },
}, {
  timestamps: true,
});

// Índices para consultas rápidas
userActivitySchema.index({ user: 1, playedAt: -1 }); // Histórico do usuário
userActivitySchema.index({ track: 1, playedAt: -1 }); // Popularidade da track
userActivitySchema.index({ user: 1, track: 1 }); // Para evitar duplicatas

// TTL index para auto-expiração (opcional - 90 dias)
userActivitySchema.index({ playedAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

const UserActivity = mongoose.model('UserActivity', userActivitySchema);
module.exports = UserActivity;