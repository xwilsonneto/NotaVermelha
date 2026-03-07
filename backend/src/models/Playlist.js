// src/models/Playlist.js
const mongoose = require('mongoose');

const playlistSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Nome da playlist é obrigatório'],
    trim: true,
  },
  description: {
    type: String,
    default: '',
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  isPublic: {
    type: Boolean,
    default: true,
  },
  isCollaborative: {
    type: Boolean,
    default: false,
  },
  collaborators: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  tracks: [{
    track: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Track',
      required: true,
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    order: {
      type: Number,
      default: 0,
    },
  }],
  coverImage: {
    type: String,
    default: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=600&h=600&fit=crop',
  },
  followersCount: {
    type: Number,
    default: 0,
  },
  likesCount: {
    type: Number,
    default: 0,
  },
  totalDuration: {
    type: Number, // segundos
    default: 0,
  },
  tags: [{
    type: String,
    enum: ['workout', 'chill', 'party', 'focus', 'sleep', 'roadtrip', 'romantic', 'study', 'work', 'brazilian'],
  }],
  mood: {
    type: String,
    enum: ['happy', 'sad', 'energetic', 'calm', 'romantic', 'nostalgic', 'focused', null],
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Virtual para formatação da duração
playlistSchema.virtual('durationFormatted').get(function() {
  const hours = Math.floor(this.totalDuration / 3600);
  const minutes = Math.floor((this.totalDuration % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}min`;
  }
  return `${minutes} min`;
});

// Virtual para número de tracks
playlistSchema.virtual('tracksCount').get(function() {
  return this.tracks.length;
});

// Middleware para calcular duração total
playlistSchema.pre('save', async function(next) {
  if (this.isModified('tracks')) {
    const Track = mongoose.model('Track');
    const trackIds = this.tracks.map(t => t.track);
    const tracks = await Track.find({ _id: { $in: trackIds } });
    
    this.totalDuration = tracks.reduce((total, track) => total + (track.duration || 0), 0);
  }
  next();
});

// Índices
playlistSchema.index({ name: 'text', description: 'text' });
playlistSchema.index({ owner: 1 });
playlistSchema.index({ isPublic: 1 });
playlistSchema.index({ followersCount: -1 });
playlistSchema.index({ createdAt: -1 });

const Playlist = mongoose.model('Playlist', playlistSchema);
module.exports = Playlist;