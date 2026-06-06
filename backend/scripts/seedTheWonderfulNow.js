// backend/scripts/seedTheWonderfulNow.js
require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegStatic = require('ffmpeg-static');
const sharp = require('sharp');

// Configurar FFmpeg
ffmpeg.setFfmpegPath(ffmpegStatic);
console.log('🔧 FFmpeg path:', ffmpegStatic);

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

// ✅ Função ROBUSTA para ler duração WAV - busca o chunk DATA dinamicamente
function getWavDuration(wavPath) {
  return new Promise((resolve, reject) => {
    try {
      const fd = fs.openSync(wavPath, 'r');
      
      // Ler header RIFF
      const headerBuffer = Buffer.alloc(12);
      fs.readSync(fd, headerBuffer, 0, 12, 0);
      
      const riff = headerBuffer.toString('ascii', 0, 4);
      const wave = headerBuffer.toString('ascii', 8, 12);
      
      if (riff !== 'RIFF' || wave !== 'WAVE') {
        fs.closeSync(fd);
        throw new Error(`Não é um arquivo WAV válido: ${path.basename(wavPath)}`);
      }
      
      // Procurar pelo chunk 'fmt '
      let offset = 12;
      let fmtChunk = null;
      let dataChunkSize = null;
      let sampleRate = null;
      let numChannels = null;
      let bitsPerSample = null;
      
      while (true) {
        const chunkHeader = Buffer.alloc(8);
        const bytesRead = fs.readSync(fd, chunkHeader, 0, 8, offset);
        
        if (bytesRead < 8) break;
        
        const chunkId = chunkHeader.toString('ascii', 0, 4);
        const chunkSize = chunkHeader.readUInt32LE(4);
        
        if (chunkId === 'fmt ') {
          // Ler fmt chunk
          const fmtData = Buffer.alloc(chunkSize);
          fs.readSync(fd, fmtData, 0, chunkSize, offset + 8);
          
          numChannels = fmtData.readUInt16LE(2);
          sampleRate = fmtData.readUInt32LE(4);
          bitsPerSample = fmtData.readUInt16LE(14);
          
          fmtChunk = { offset, size: chunkSize };
        }
        else if (chunkId === 'data') {
          dataChunkSize = chunkSize;
          break;
        }
        
        // Pular para o próximo chunk (alinhado)
        offset += 8 + chunkSize;
      }
      
      fs.closeSync(fd);
      
      if (!dataChunkSize) {
        throw new Error(`Chunk DATA não encontrado em: ${path.basename(wavPath)}`);
      }
      
      if (!sampleRate || !numChannels || !bitsPerSample) {
        throw new Error(`Informações do fmt chunk não encontradas em: ${path.basename(wavPath)}`);
      }
      
      // Calcular duração
      const bytesPerSample = bitsPerSample / 8;
      const totalSamples = dataChunkSize / (numChannels * bytesPerSample);
      const durationSeconds = Math.round(totalSamples / sampleRate);
      
      const minutes = Math.floor(durationSeconds / 60);
      const seconds = durationSeconds % 60;
      console.log(`   ⏱️ Duração real (WAV header): ${minutes}:${seconds.toString().padStart(2, '0')} | ${sampleRate}Hz, ${numChannels}ch, ${bitsPerSample}bit`);
      
      resolve(durationSeconds);
    } catch (err) {
      reject(err);
    }
  });
}

// Converter WAV para MP3
function convertWavToMp3(inputPath, outputPath) {
  return new Promise((resolve, reject) => {
    console.log(`   🔄 Convertendo para MP3...`);

    ffmpeg(inputPath)
      .audioCodec('libmp3lame')
      .audioBitrate(320)
      .audioQuality(0)
      .on('progress', (progress) => {
        if (progress.percent) {
          process.stdout.write(`      ⏳ Progresso: ${Math.round(progress.percent)}%\r`);
        }
      })
      .on('end', () => {
        console.log(`      ✅ Conversão concluída`);
        resolve();
      })
      .on('error', (err) => {
        console.error(`      ❌ Erro na conversão:`, err.message);
        reject(err);
      })
      .save(outputPath);
  });
}

async function seedTheWonderfulNow() {
  const tempFiles = [];

  try {
    console.log('\n☁️  Iniciando seed da banda The Wonderful Now...');
    console.log('📀 Álbum: Someplace Like Home\n');

    // Conectar MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB conectado\n');

    // VERIFICAR SE JÁ EXISTE E REMOVER
    const existingArtist = await Artist.findOne({ name: "The Wonderful Now" });
    if (existingArtist) {
      console.log('⚠️ Artista já existe! Removendo para recriar...');
      await Track.deleteMany({ artists: existingArtist._id });
      await Album.deleteMany({ artist: existingArtist._id });
      await Artist.deleteOne({ _id: existingArtist._id });
      console.log('✅ Dados antigos removidos\n');
    }

    // ========== 1. VERIFICAR ARQUIVOS ==========
    console.log('📁 Verificando arquivos de áudio...');

    const audioDir = path.join(__dirname, '../../mobile/assets/audio/thewonderfulnow/someplacelikehome');
    const coverPath = path.join(audioDir, 'cover.png');

    if (!fs.existsSync(coverPath)) {
      throw new Error(`Capa não encontrada: ${coverPath}`);
    }
    console.log('✅ Capa encontrada');

    // Lista de arquivos WAV com seus títulos
    const wavFiles = [
      '1 - And I_ve never really felt like a part of something.wav',
      '2 - A smooth sea never... ever... made a skilled sailor.wav',
      '3 - Out of the Blue.wav',
      '4 - Avoid commonplaces! Give me something... meaningful!.wav',
      '5 - Mind the Step.wav',
      '6 - One Day You Will Eventually Feel Alive.wav'
    ];

    const trackTitles = [
      'And I\'ve never really felt like a part of something',
      'A smooth sea never... ever... made a skilled sailor',
      'Out of the Blue',
      'Avoid commonplaces! Give me something... meaningful!',
      'Mind the Step',
      'One Day You Will Eventually Feel Alive'
    ];

    for (const file of wavFiles) {
      const filePath = path.join(audioDir, file);
      if (!fs.existsSync(filePath)) {
        throw new Error(`Arquivo não encontrado: ${file}`);
      }
    }
    console.log(`✅ ${wavFiles.length} arquivos de áudio encontrados\n`);

    // ========== 2. PROCESSAR CAPA ==========
    console.log('🖼️  Processando capa do álbum...');

    const tempDir = path.join(__dirname, 'temp_audio');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const resizedCoverPath = path.join(tempDir, 'cover_resized.jpg');
    tempFiles.push(resizedCoverPath);

    await sharp(coverPath)
      .resize(1500, 1500, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toFile(resizedCoverPath);

    console.log('✅ Capa redimensionada\n');

    // ========== 3. UPLOAD DA CAPA ==========
    console.log('📤 Fazendo upload da capa...');
    const coverResult = await cloudinary.uploader.upload(resizedCoverPath, {
      folder: 'nota-vermelha/covers',
      public_id: 'the-wonderful-now-someplace-like-home-cover'
    });
    const coverUrl = coverResult.secure_url;
    console.log('✅ Upload da capa concluído:', coverUrl.substring(0, 50) + '...\n');

    // ========== 4. CRIAR ARTISTA ==========
    console.log('💾 Criando artista...');

    const artist = await Artist.create({
      name: "The Wonderful Now",
      bio: "The Wonderful Now é uma banda que explora as profundezas das emoções humanas através de paisagens sonoras atmosféricas e letras introspectivas. 'Someplace Like Home' é um mergulho na busca por pertencimento e autodescoberta.",
      genre: ["shoegaze", "math rock", "alternativo", "dream pop"],
      country: "US",
      avatar: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop",
      coverImage: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&h=400&fit=crop",
      monthlyListeners: 4200,
      verified: true,
      socialLinks: {
        instagram: "@thewonderfulnow",
        spotify: "@thewonderfulnow"
      }
    });
    console.log(`✅ Artista criado: ${artist.name} (ID: ${artist._id})`);
    console.log(`   Gêneros: ${artist.genre.join(', ')}\n`);

    // ========== 5. CRIAR ÁLBUM ==========
    console.log('💿 Criando álbum...');
    const album = await Album.create({
      title: "Someplace Like Home",
      artist: artist._id,
      artists: [artist._id],
      cover: coverUrl,
      genre: ["shoegaze", "math rock", "alternativo", "dream pop"],
      releaseDate: new Date('2024-02-14'),
      type: "album",
      copyright: "© 2024 The Wonderful Now",
      label: "Independente",
      totalTracks: wavFiles.length
    });
    console.log(`✅ Álbum criado: ${album.title} (ID: ${album._id})\n`);

    // ========== 6. PROCESSAR MÚSICAS ==========
    console.log('🎵 Processando músicas...\n');

    let totalDuration = 0;
    const createdTracks = [];

    for (let i = 0; i < wavFiles.length; i++) {
      const wavFile = wavFiles[i];
      const wavPath = path.join(audioDir, wavFile);
      const trackNumber = i + 1;
      const trackTitle = trackTitles[i];

      console.log(`\n   🎵 Faixa ${trackNumber}: ${trackTitle}`);
      console.log(`   📁 Arquivo: ${wavFile}`);

      // Sanitizar nome do arquivo
      const sanitizedTitle = trackTitle.replace(/[^a-z0-9]/gi, '_').substring(0, 50);
      const mp3Filename = `${trackNumber.toString().padStart(2, '0')}_${sanitizedTitle}.mp3`;
      const mp3TempPath = path.join(tempDir, mp3Filename);
      tempFiles.push(mp3TempPath);

      // Ler duração com função ROBUSTA
      const duration = await getWavDuration(wavPath);

      // Converter para MP3
      await convertWavToMp3(wavPath, mp3TempPath);

      // Upload para Cloudinary
      console.log(`   📤 Fazendo upload para Cloudinary...`);
      const audioResult = await cloudinary.uploader.upload(mp3TempPath, {
        resource_type: 'video',
        folder: 'nota-vermelha/audio/the-wonderful-now',
        public_id: `someplace-like-home-${trackNumber.toString().padStart(2, '0')}-${sanitizedTitle.toLowerCase()}`
      });

      // Criar track no MongoDB
      const track = await Track.create({
        title: trackTitle,
        artists: [artist._id],
        album: album._id,
        duration: duration,
        trackNumber: trackNumber,
        genre: ["shoegaze", "math rock", "alternativo", "dream pop"],
        audioUrl: audioResult.secure_url,
        previewUrl: audioResult.secure_url,
        coverUrl: coverUrl,
        playCount: Math.floor(Math.random() * 500) + 100,
        likeCount: Math.floor(Math.random() * 200) + 50,
        releaseDate: new Date('2024-02-14')
      });

      createdTracks.push(track);
      totalDuration += duration;

      const minutes = Math.floor(duration / 60);
      const seconds = duration % 60;
      console.log(`   ✅ ${trackNumber}. ${trackTitle} (${minutes}:${seconds.toString().padStart(2, '0')})`);
    }

    // ========== 7. ATUALIZAR ÁLBUM COM DURAÇÃO TOTAL ==========
    await Album.findByIdAndUpdate(album._id, {
      duration: totalDuration
    });

    // ========== 8. LIMPEZA ==========
    console.log('\n🧹 Limpando arquivos temporários...');
    tempFiles.forEach(file => {
      try {
        if (fs.existsSync(file)) fs.unlinkSync(file);
      } catch (e) {}
    });

    try {
      if (fs.existsSync(tempDir) && fs.readdirSync(tempDir).length === 0) {
        fs.rmdirSync(tempDir);
      }
    } catch (e) {}

    // ========== 9. RESUMO ==========
    console.log('\n✨ SEED COMPLETADO COM SUCESSO!');
    console.log('📊 Resumo:');
    console.log(`   Artista: ${artist.name}`);
    console.log(`   Álbum: "${album.title}"`);
    console.log(`   Músicas: ${createdTracks.length} faixas`);
    console.log(`   Duração total: ${Math.floor(totalDuration / 60)} minutos e ${totalDuration % 60} segundos`);

    console.log('\n📝 Durações precisas:');
    createdTracks.sort((a, b) => a.trackNumber - b.trackNumber).forEach(track => {
      const minutes = Math.floor(track.duration / 60);
      const seconds = track.duration % 60;
      console.log(`   ${track.trackNumber}. ${track.title}: ${minutes}:${seconds.toString().padStart(2, '0')}`);
    });

    const savedArtist = await Artist.findOne({ name: "The Wonderful Now" });
    const savedAlbum = await Album.findOne({ title: "Someplace Like Home" });
    const savedTracks = await Track.find({ album: album._id });

    console.log('\n🔍 VERIFICAÇÃO FINAL:');
    console.log(`   Artista no banco: ${savedArtist ? '✅' : '❌'}`);
    console.log(`   Álbum no banco: ${savedAlbum ? '✅' : '❌'}`);
    console.log(`   Músicas no banco: ${savedTracks.length} de ${wavFiles.length}`);

    await mongoose.connection.close();
    console.log('\n🔌 Conexões encerradas.');

  } catch (error) {
    console.error('\n❌ Erro no seed:', error.message);
    if (error.errors) {
      console.error('Detalhes da validação:');
      Object.keys(error.errors).forEach(key => {
        console.error(`   ${key}: ${error.errors[key].message}`);
      });
    }

    console.log('\n🧹 Limpando arquivos temporários...');
    tempFiles.forEach(file => {
      try {
        if (fs.existsSync(file)) fs.unlinkSync(file);
      } catch (e) {}
    });

    process.exit(1);
  }
}

// Executar
seedTheWonderfulNow();