// src/models/Artist.js
const mongoose = require('mongoose');

const artistSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Nome do artista é obrigatório'],
    trim: true,
    unique: true,
  },
  bio: {
    type: String,
    default: '',
  },
  avatar: {
    type: String,
    default: 'https://ui-avatars.com/api/?name=Artista&background=7f1d1d&color=fff&bold=true',
  },
  coverImage: {
    type: String,
    default: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1200&h=400&fit=crop',
  },
  genre: [{
    type: String,
    enum: ['rock', 'pop', 'hiphop', 'jazz', 'eletronic', 'classical', 'reggae', 'sertanejo', 'funk', 'mpb', 'indie', 'metal', 'punk', 'blues', 'r&b', 'gospel'],
  }],
  country: {
    type: String,
    default: 'BR',
  },
  monthlyListeners: {
    type: Number,
    default: 0,
  },
  totalPlays: {
    type: Number,
    default: 0,
  },
  verified: {
    type: Boolean,
    default: false,
  },
  socialLinks: {
    website: String,
    instagram: String,
    twitter: String,
    youtube: String,
    spotify: String,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Virtual para álbuns do artista
artistSchema.virtual('albums', {
  ref: 'Album',
  localField: '_id',
  foreignField: 'artist',
});

// Virtual para músicas do artista
artistSchema.virtual('tracks', {
  ref: 'Track',
  localField: '_id',
  foreignField: 'artists',
});

// Índices
artistSchema.index({ name: 'text' });
artistSchema.index({ genre: 1 });
artistSchema.index({ monthlyListeners: -1 });

const Artist = mongoose.model('Artist', artistSchema);
module.exports = Artist;