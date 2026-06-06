// services/cacheService.js
// Serviço de cache preparado para Redis (funciona sem Redis como fallback)

class CacheService {
  constructor() {
    this.cache = new Map();
    this.defaultTTL = 300; // 5 minutos
    this.redisAvailable = false;
    this.redis = null;
  }
  
  async initRedis() {
    try {
      const redis = require('redis');
      const client = redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379'
      });
      
      await client.connect();
      this.redis = client;
      this.redisAvailable = true;
      console.log('✅ Redis conectado com sucesso');
    } catch (error) {
      console.log('⚠️ Redis não disponível, usando cache em memória');
      this.redisAvailable = false;
    }
  }
  
  async get(key) {
    if (this.redisAvailable && this.redis) {
      const data = await this.redis.get(key);
      return data ? JSON.parse(data) : null;
    }
    
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }
  
  async set(key, value, ttl = this.defaultTTL) {
    if (this.redisAvailable && this.redis) {
      await this.redis.set(key, JSON.stringify(value), { EX: ttl });
      return;
    }
    
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + (ttl * 1000)
    });
    
    // Limitar tamanho do cache em memória
    if (this.cache.size > 1000) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }
  
  async del(key) {
    if (this.redisAvailable && this.redis) {
      await this.redis.del(key);
    }
    this.cache.delete(key);
  }
  
  async invalidatePattern(pattern) {
    if (this.redisAvailable && this.redis) {
      const keys = await this.redis.keys(pattern);
      if (keys.length > 0) {
        await this.redis.del(keys);
      }
    }
    
    for (const key of this.cache.keys()) {
      if (key.includes(pattern.replace('*', ''))) {
        this.cache.delete(key);
      }
    }
  }
  
  // Métodos específicos para o app
  async getOrSet(key, fetcher, ttl = this.defaultTTL) {
    let data = await this.get(key);
    if (data !== null) return data;
    
    data = await fetcher();
    await this.set(key, data, ttl);
    return data;
  }
  
  async invalidateTrack(trackId) {
    await this.invalidatePattern(`track:${trackId}`);
    await this.invalidatePattern('tracks:*');
    await this.invalidatePattern('feed:*');
  }
  
  async invalidateArtist(artistId) {
    await this.invalidatePattern(`artist:${artistId}`);
    await this.invalidatePattern('artists:*');
    await this.invalidatePattern('feed:*');
  }
}

module.exports = new CacheService();