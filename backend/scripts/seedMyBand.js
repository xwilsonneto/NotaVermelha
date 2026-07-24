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

    // ========== 1. UPLOAD DOS ARQUIVOS PARA CLOUDINARY ==========
    console.log('\n📤 Fazendo upload dos arquivos para Cloudinary...');

    // Upload da capa do álbum
    const coverPath = path.join(__dirname, '../../mobile/assets/images/covers/parajorge.jpeg');
    const coverUrl = await uploadToCloudinary(coverPath, {
      folder: 'nota-vermelha/covers',
      public_id: 'para-jorge-cover'
    });

    // ========== DADOS DAS MÚSICAS (unificado: título, duração, nº da faixa e arquivo) ==========
    const tracksData = [
      { title: "Hit do trabalhador",       duration: 229, trackNumber: 1,  file: "hitdotrabalhador.mp3" },
      { title: "Morto",                    duration: 218, trackNumber: 2,  file: "morto.mp3" },
      { title: "Vira e mexe",              duration: 176, trackNumber: 3,  file: "viraemexe.mp3" },
      { title: "Hora de ir",               duration: 266, trackNumber: 4,  file: "horadeir.mp3" },
      { title: "Caminhar a noite",         duration: 64,  trackNumber: 5,  file: "andaranoite.mp3" },
      { title: "Temporei",                 duration: 193, trackNumber: 6,  file: "temporei.mp3" },
      { title: "Nós dois",                 duration: 230, trackNumber: 7,  file: "nosdois.mp3" },
      { title: "Passagem",                 duration: 88,  trackNumber: 8,  file: "passagemdestino.mp3" },
      { title: "Balada da mente",          duration: 237, trackNumber: 9,  file: "baladadamente.mp3" },
      { title: "Besta",                    duration: 331, trackNumber: 10, file: "besta.mp3" },
      { title: "(si)",                     duration: 204, trackNumber: 11, file: "si.mp3" },
      { title: "Aceitar",                  duration: 240, trackNumber: 12, file: "aceitar.mp3" },
      { title: "Ônibus do Rio",            duration: 181, trackNumber: 13, file: "onibusdorio.mp3" },
      { title: "Homem da bag vermelha",    duration: 524, trackNumber: 14, file: "homemdabagvermelha.mp3" },
      { title: "Deus reexiste",            duration: 273, trackNumber: 15, file: "deusreexiste.mp3" },
      { title: "Para Jorge",               duration: 363, trackNumber: 16, file: "parajorge.mp3" },
    ];

    // Upload das músicas
    const audioDir = path.join(__dirname, '../../mobile/assets/audio/yurieosterraqueos/parajorge');
    const audioFiles = fs.readdirSync(audioDir).filter(file => file.endsWith('.mp3'));

    // Confere se todos os arquivos esperados existem de fato no diretório
    const arquivosNoDisco = new Set(audioFiles);
    const faltando = tracksData.filter(t => !arquivosNoDisco.has(t.file));
    if (faltando.length > 0) {
      console.warn('\n⚠️  Atenção: os seguintes arquivos esperados NÃO foram encontrados no diretório:');
      faltando.forEach(t => console.warn(`   - ${t.file} (música: "${t.title}")`));
      console.warn(`📁 Diretório verificado: ${audioDir}`);
      console.warn(`📁 Arquivos encontrados: ${audioFiles.join(', ')}\n`);
    }

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

    // Verificar se o artista já existe; se sim, reutiliza o id, senão cria um novo
    let artist = await Artist.findOne({ name: "Yuri e os Terráqueos" });

    if (artist) {
      console.log(`🎸 Artista já existente, reutilizando: ${artist.name}`);
    } else {
      artist = await Artist.create({
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
    }

    // Verificar se o álbum já existe; se sim, reutiliza o id, senão cria um novo
    let album = await Album.findOne({ title: "Para Jorge", artist: artist._id });

    if (album) {
      console.log(`💿 Álbum já existente, reutilizando: ${album.title}`);
    } else {
      album = await Album.create({
        title: "Para Jorge",
        artist: artist._id,
        artists: [artist._id],
        cover: coverUrl, // ← URL da Cloudinary
        genre: ["rock", "indie"],
        releaseDate: new Date('2026-08-08'),
        type: "album",
        copyright: "© 2026 Yuri e os Terráqueos",
        label: "Overbender"
      });
      console.log(`💿 Álbum criado: ${album.title}`);
    }

    // Criar cada música, checando se já existe antes
    console.log('🎵 Processando músicas:');
    for (const trackData of tracksData) {
      const audioUrl = audioUrls[trackData.file]; // URL da Cloudinary

      if (!audioUrl) {
        console.error(`   ⚠️  Pulando "${trackData.title}": arquivo de áudio "${trackData.file}" não foi encontrado/upado.`);
        continue;
      }

      let track = await Track.findOne({ title: trackData.title, album: album._id });

      if (track) {
        console.log(`   ⏭️  ${trackData.trackNumber}. ${trackData.title} (já existe, pulando)`);
        continue;
      }

      track = await Track.create({
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
      console.log(`   ✅ ${track.trackNumber}. ${track.title} (${min}:${sec.toString().padStart(2, '0')})`);
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