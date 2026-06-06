// config/indexes.js
// Script para ADICIONAR índices otimizados (sem remover os existentes)

const Track = require("../models/Track");
const Artist = require("../models/Artist");
const Album = require("../models/Album");
const User = require("../models/User");
const Follow = require("../models/Follow");
const Like = require("../models/Like");
const AlbumLike = require("../models/AlbumLike");
const Playlist = require("../models/Playlist");
const UserActivity = require("../models/UserActivity");

async function setupIndexes() {
  console.log('🚀 Adicionando índices otimizados (sem quebrar nada existente)...');
  
  try {
    // Track - índices compostos para queries comuns
    await Track.collection.createIndex({ artists: 1, releaseDate: -1 }, { background: true });
    await Track.collection.createIndex({ playCount: -1, releaseDate: -1 }, { background: true });
    await Track.collection.createIndex({ likeCount: -1, releaseDate: -1 }, { background: true });
    await Track.collection.createIndex({ album: 1, releaseDate: -1 }, { background: true });
    await Track.collection.createIndex({ _id: 1, releaseDate: -1 }, { background: true });
    console.log('✅ Índices do Track adicionados');
    
    // Artist - índices para ordenação e filtros
    await Artist.collection.createIndex({ monthlyListeners: -1 }, { background: true });
    await Artist.collection.createIndex({ genre: 1, monthlyListeners: -1 }, { background: true });
    await Artist.collection.createIndex({ country: 1, monthlyListeners: -1 }, { background: true });
    await Artist.collection.createIndex({ verified: -1, monthlyListeners: -1 }, { background: true });
    await Artist.collection.createIndex({ totalPlays: -1 }, { background: true });
    console.log('✅ Índices do Artist adicionados');
    
    // Album - índices para consultas rápidas
    await Album.collection.createIndex({ artist: 1, releaseDate: -1 }, { background: true });
    await Album.collection.createIndex({ likeCount: -1 }, { background: true });
    await Album.collection.createIndex({ releaseDate: -1 }, { background: true });
    console.log('✅ Índices do Album adicionados');
    
    // User - índices para queries comuns
    await User.collection.createIndex({ role: 1, isActive: 1 }, { background: true });
    await User.collection.createIndex({ followersCount: -1 }, { background: true });
    await User.collection.createIndex({ createdAt: -1 }, { background: true });
    await User.collection.createIndex({ likedTracks: 1 }, { background: true });
    console.log('✅ Índices do User adicionados');
    
    // Follow - índices para feed e contagem
    await Follow.collection.createIndex({ followingArtist: 1, createdAt: -1 }, { background: true });
    await Follow.collection.createIndex({ follower: 1, followingArtist: 1, createdAt: -1 }, { background: true });
    await Follow.collection.createIndex({ followingUser: 1, createdAt: -1 }, { background: true });
    console.log('✅ Índices do Follow adicionados');
    
    // Like - índices para consultas rápidas
    await Like.collection.createIndex({ track: 1, user: 1 }, { background: true });
    console.log('✅ Índices do Like adicionados');
    
    // AlbumLike - índices adicionais
    await AlbumLike.collection.createIndex({ album: 1, user: 1 }, { background: true });
    console.log('✅ Índices do AlbumLike adicionados');
    
    // Playlist - índices para busca
    await Playlist.collection.createIndex({ owner: 1, createdAt: -1 }, { background: true });
    await Playlist.collection.createIndex({ isPublic: 1, followersCount: -1 }, { background: true });
    console.log('✅ Índices do Playlist adicionados');
    
    // UserActivity - índices para histórico
    await UserActivity.collection.createIndex({ user: 1, playedAt: -1 }, { background: true });
    await UserActivity.collection.createIndex({ track: 1, playedAt: -1 }, { background: true });
    console.log('✅ Índices do UserActivity adicionados');
    
    console.log('🎉 Todos os índices foram adicionados com sucesso!');
    
  } catch (error) {
    console.error('❌ Erro ao adicionar índices:', error);
    throw error;
  }
}

module.exports = setupIndexes;