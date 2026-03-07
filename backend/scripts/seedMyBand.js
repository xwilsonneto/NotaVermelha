// backend/scripts/seedCloudinary.js
require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Configurar Cloudinary
const cloudinary = require('cloudinary').v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Models
const Artist = require('../src/models/Artist');
const Album = require('../src/models/Album');
const Track = require('../src/models/Track');

// Upload para Cloudinary
async function uploadToCloudinary(filePath, options = {}) {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: 'auto', // Detecta automaticamente se é imagem ou vídeo
      folder: 'nota-vermelha',
      ...options
    });
    console.log(`✅ Upload: ${path.basename(filePath)} → ${result.secure_url.substring(0, 60)}...`);
    return result.secure_url;
  } catch (error) {
    console.error(`❌ Erro upload ${filePath}:`, error.message);
    throw error;
  }
}

async function seedWithCloudinary() {
  try {
    console.log('☁️  Iniciando seed com Cloudinary...');
    
    // Conectar MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB conectado');
    
    // Limpar dados anteriores
    await Artist.deleteMany({});
    await Album.deleteMany({});
    await Track.deleteMany({});
    console.log('🧹 Dados antigos removidos');
    
    // ========== 1. UPLOAD DOS ARQUIVOS PARA CLOUDINARY ==========
    console.log('\n📤 Fazendo upload dos arquivos para Cloudinary...');
    
    // Upload da capa do álbum
    const coverPath = path.join(__dirname, '../../mobile/assets/images/covers/enm.jpg');
    const coverUrl = await uploadToCloudinary(coverPath, {
      folder: 'nota-vermelha/covers',
      public_id: 'estranho-novo-mundo-cover'
    });
    
    // Upload das músicas
    const audioDir = path.join(__dirname, '../../mobile/assets/audio/yurieosterraqueos/estranhonovomundo');
    const audioFiles = fs.readdirSync(audioDir).filter(file => file.endsWith('.mp3'));
    
    const audioUrls = {};
    for (const file of audioFiles) {
      const filePath = path.join(audioDir, file);
      const audioUrl = await uploadToCloudinary(filePath, {
        resource_type: 'video', // Cloudinary trata áudio como vídeo
        folder: 'nota-vermelha/audio/yurieosterraqueos',
        public_id: path.parse(file).name // Remove extensão .mp3
      });
      audioUrls[file] = audioUrl;
    }
    
    // ========== 2. CRIAR DADOS NO MONGODB COM URLs DA CLOUDINARY ==========
    console.log('\n💾 Criando dados no MongoDB...');
    
    // Criar artista
    const artist = await Artist.create({
      name: "Yuri e os Terráqueos",
      bio: "Banda brasileira de rock alternativo com influências de indie, grunge e MPB. Formada em São Paulo, traz letras introspectivas sobre existência, sociedade e as complexidades da vida moderna.",
      genre: ["rock", "indie"],
      country: "BR",
      avatar: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?w=400&h=400&fit=crop",
      coverImage: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&h=400&fit=crop",
      monthlyListeners: 12500,
      verified: true,
      socialLinks: {
        instagram: "@yurieosterraqueos",
        youtube: "@yurieosterraqueos"
      }
    });
    console.log(`🎸 Artista criado: ${artist.name}`);
    
    // Criar álbum
    const album = await Album.create({
      title: "Estranho Novo Mundo",
      artist: artist._id,
      artists: [artist._id],
      cover: coverUrl, // ← URL da Cloudinary
      genre: ["rock", "indie"],
      releaseDate: new Date('2023-06-15'),
      type: "album",
      copyright: "© 2023 Yuri e os Terráqueos",
      label: "Selindependente Records"
    });
    console.log(`💿 Álbum criado: ${album.title}`);
    
    // Dados das músicas
    const tracksData = [
      { title: "CIDADE DAS CONCHAS", duration: 286, trackNumber: 1 },
      { title: "SENHOR", duration: 303, trackNumber: 2 },
      { title: "Morte A Janeiro", duration: 153, trackNumber: 3 },
      { title: "GAROTOS", duration: 200, trackNumber: 4 },
      { title: "HOJE EU SEI", duration: 247, trackNumber: 5 },
      { title: "PSL", duration: 252, trackNumber: 6 },
      { title: "APARELHO", duration: 235, trackNumber: 7 },
      { title: "Estranho novo mundo que já vivi", duration: 221, trackNumber: 8 },
      { title: "Aconteceu", duration: 339, trackNumber: 9 }
    ];
    
    const audioFilenames = [
      '1 - CIDADE DAS CONCHAS - Yuri e os Terráqueos.mp3',
      '2 - SENHOR - Yuri e os Terráqueos.mp3',
      '3 - Morte A Janeiro - Yuri e os Terráqueos.mp3',
      '4- GAROTOS - Yuri e os Terráqueos.mp3',
      '5 - HOJE EU SEI - Yuri e os Terráqueos.mp3',
      '6 - PSL - Yuri e os Terráqueos.mp3',
      '7 - APARELHO - Yuri e os Terráqueos.mp3',
      '8 - Estranho novo mundo que já vivi - Yuri e os Terráqueos.mp3',
      '9 - Aconteceu - Yuri e os Terráqueos.mp3'
    ];
    
    // Criar cada música
    console.log('🎵 Criando músicas:');
    for (let i = 0; i < tracksData.length; i++) {
      const trackData = tracksData[i];
      const filename = audioFilenames[i];
      const audioUrl = audioUrls[filename]; // URL da Cloudinary
      
      const track = await Track.create({
        title: trackData.title,
        artists: [artist._id],
        album: album._id,
        duration: trackData.duration,
        trackNumber: trackData.trackNumber,
        genre: ["rock", "indie"],
        audioUrl: audioUrl, // ← URL da Cloudinary
        previewUrl: audioUrl, // mesma URL para preview
        coverUrl: coverUrl, // ← URL da Cloudinary
        playCount: Math.floor(Math.random() * 1000),
        likeCount: Math.floor(Math.random() * 500),
        releaseDate: new Date('2023-06-15')
      });
      
      const min = Math.floor(track.duration / 60);
      const sec = track.duration % 60;
      console.log(`   ${track.trackNumber}. ${track.title} (${min}:${sec.toString().padStart(2, '0')})`);
    }
    
    // Atualizar álbum com contagem total
    const totalTracks = tracksData.length;
    const totalDuration = tracksData.reduce((sum, t) => sum + t.duration, 0);
    
    await Album.findByIdAndUpdate(album._id, {
      totalTracks,
      duration: totalDuration
    });
    
    // ========== 3. RESUMO ==========
    console.log('\n✨ SEED COMPLETADO COM CLOUDINARY!');
    console.log('📊 Resumo:');
    console.log(`   Artista: ${artist.name}`);
    console.log(`   Álbum: "${album.title}"`);
    console.log(`   Capa: ${coverUrl.substring(0, 50)}...`);
    console.log(`   Músicas: ${totalTracks} faixas na Cloudinary`);
    console.log('\n🔗 URLs agora são permanentes na nuvem!');
    
    // Fechar conexão
    await mongoose.connection.close();
    console.log('🔌 Conexões encerradas.');
    
  } catch (error) {
    console.error('❌ Erro no seed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Executar
seedWithCloudinary();