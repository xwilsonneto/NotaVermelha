// services/cursorPaginationService.js
// Paginação baseada em cursor - MAIS EFICIENTE para milhões de registros

const Track = require("../models/Track");
const Follow = require("../models/Follow");
const Artist = require("../models/Artist");
const Album = require("../models/Album");

class CursorPaginationService {
  
  /**
   * Paginação para Tracks com cursor
   * @param {Object} filters - Filtros (artist, album, etc)
   * @param {String} cursor - ID do último documento
   * @param {Number} limit - Limite por página
   */
  async paginateTracks(filters = {}, cursor = null, limit = 20) {
    const query = { ...filters };
    
    if (cursor) {
      const lastDoc = await Track.findById(cursor).select('releaseDate _id').lean();
      if (lastDoc) {
        query.$or = [
          { releaseDate: { $lt: lastDoc.releaseDate } },
          { 
            releaseDate: lastDoc.releaseDate, 
            _id: { $lt: lastDoc._id } 
          }
        ];
      }
    }
    
    const tracks = await Track.find(query)
      .populate({
        path: "artists",
        model: "Artist",
        select: "name avatar genre verified monthlyListeners"
      })
      .populate("album", "title coverUrl cover")
      .sort({ releaseDate: -1, _id: -1 })
      .limit(limit + 1)
      .lean();
    
    const hasMore = tracks.length > limit;
    const nextCursor = hasMore ? tracks[limit - 1]._id : null;
    const data = hasMore ? tracks.slice(0, limit) : tracks;
    
    return {
      success: true,
      data,
      nextCursor,
      hasMore,
      count: data.length
    };
  }
  
  /**
   * Paginação para Feed do usuário (artistas seguidos)
   */
  async paginateUserFeed(userId, cursor = null, limit = 30) {
    // Buscar artistas que o usuário segue
    const follows = await Follow.find({
      follower: userId,
      followingArtist: { $exists: true, $ne: null }
    }).select('followingArtist').lean();
    
    if (follows.length === 0) {
      return { success: true, data: [], nextCursor: null, hasMore: false, count: 0 };
    }
    
    const artistIds = follows.map(f => f.followingArtist);
    
    const query = {
      artists: { $in: artistIds }
    };
    
    if (cursor) {
      const lastDoc = await Track.findById(cursor).select('releaseDate _id').lean();
      if (lastDoc) {
        query.$or = [
          { releaseDate: { $lt: lastDoc.releaseDate } },
          { 
            releaseDate: lastDoc.releaseDate, 
            _id: { $lt: lastDoc._id } 
          }
        ];
      }
    }
    
    const tracks = await Track.find(query)
      .populate({
        path: "artists",
        model: "Artist",
        select: "name avatar verified monthlyListeners"
      })
      .populate("album", "title cover coverUrl")
      .sort({ releaseDate: -1, _id: -1 })
      .limit(limit + 1)
      .lean();
    
    const hasMore = tracks.length > limit;
    const nextCursor = hasMore ? tracks[limit - 1]._id : null;
    const data = hasMore ? tracks.slice(0, limit) : tracks;
    
    return {
      success: true,
      data,
      nextCursor,
      hasMore,
      count: data.length
    };
  }
  
  /**
   * Paginação para Álbuns por artista
   */
  async paginateArtistAlbums(artistId, cursor = null, limit = 20) {
    const query = { artist: artistId };
    
    if (cursor) {
      const lastDoc = await Album.findById(cursor).select('releaseDate _id').lean();
      if (lastDoc) {
        query.$or = [
          { releaseDate: { $lt: lastDoc.releaseDate } },
          { 
            releaseDate: lastDoc.releaseDate, 
            _id: { $lt: lastDoc._id } 
          }
        ];
      }
    }
    
    const albums = await Album.find(query)
      .populate("artist", "name avatar")
      .sort({ releaseDate: -1, _id: -1 })
      .limit(limit + 1)
      .lean();
    
    const hasMore = albums.length > limit;
    const nextCursor = hasMore ? albums[limit - 1]._id : null;
    const data = hasMore ? albums.slice(0, limit) : albums;
    
    return {
      success: true,
      data,
      nextCursor,
      hasMore,
      count: data.length
    };
  }
  
  /**
   * Paginação para Busca de Artistas
   */
  async paginateArtists(searchTerm = '', cursor = null, limit = 20) {
    const query = searchTerm 
      ? { $text: { $search: searchTerm } }
      : {};
    
    if (cursor) {
      const lastDoc = await Artist.findById(cursor).select('monthlyListeners _id').lean();
      if (lastDoc) {
        query.$or = [
          { monthlyListeners: { $lt: lastDoc.monthlyListeners } },
          { 
            monthlyListeners: lastDoc.monthlyListeners, 
            _id: { $lt: lastDoc._id } 
          }
        ];
      }
    }
    
    const artists = await Artist.find(query)
      .sort({ monthlyListeners: -1, _id: -1 })
      .limit(limit + 1)
      .lean();
    
    const hasMore = artists.length > limit;
    const nextCursor = hasMore ? artists[limit - 1]._id : null;
    const data = hasMore ? artists.slice(0, limit) : artists;
    
    return {
      success: true,
      data,
      nextCursor,
      hasMore,
      count: data.length
    };
  }
}

module.exports = new CursorPaginationService();