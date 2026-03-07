// backend/scripts/seedTemMasAcabou.js
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

// ✅ Lê a duração REAL diretamente do header do arquivo WAV
// Sem depender de ffprobe ou qualquer executável externo
// O header WAV (RIFF) é padronizado e contém sample rate, canais e total de amostras
function getWavDuration(wavPath) {
  return new Promise((resolve, reject) => {
    try {
      const buffer = Buffer.alloc(44);
      const fd = fs.openSync(wavPath, 'r');
      fs.readSync(fd, buffer, 0, 44, 0);
      fs.closeSync(fd);

      // Validar assinatura RIFF
      const riff = buffer.toString('ascii', 0, 4);
      const wave = buffer.toString('ascii', 8, 12);

      if (riff !== 'RIFF' || wave !== 'WAVE') {
        throw new Error(`Não é um arquivo WAV válido: ${path.basename(wavPath)}`);
      }

      // Ler campos do header (little-endian)
      const sampleRate    = buffer.readUInt32LE(24); // bytes 24-27
      const numChannels   = buffer.readUInt16LE(22); // bytes 22-23
      const bitsPerSample = buffer.readUInt16LE(34); // bytes 34-35
      const dataChunkSize = buffer.readUInt32LE(40); // bytes 40-43 (tamanho dos dados de áudio)

      // Calcular duração: total de amostras / sample rate
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

async function seedTemMasAcabou() {
  const tempFiles = [];

  try {
    console.log('\n☁️  Iniciando seed da banda Tem Mas Acabou...');
    console.log('📀 Álbum: QUINTAL (2024)\n');

    // Conectar MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB conectado\n');

    // VERIFICAR SE JÁ EXISTE E REMOVER
    const existingArtist = await Artist.findOne({ name: "Tem Mas Acabou" });
    if (existingArtist) {
      console.log('⚠️ Artista já existe! Removendo para recriar...');
      await Track.deleteMany({ artists: existingArtist._id });
      await Album.deleteMany({ artist: existingArtist._id });
      await Artist.deleteOne({ _id: existingArtist._id });
      console.log('✅ Dados antigos removidos\n');
    }

    // ========== 1. VERIFICAR ARQUIVOS ==========
    console.log('📁 Verificando arquivos de áudio...');

    const audioDir = path.join(__dirname, '../../mobile/assets/audio/temmasacabou');
    const coverPath = path.join(audioDir, 'TMA_QUINTAL_(2024)_ALBUM_COVER.png');

    if (!fs.existsSync(coverPath)) {
      throw new Error(`Capa não encontrada: ${coverPath}`);
    }
    console.log('✅ Capa encontrada');

    const wavFiles = [
      '01_Master_TemMasAcabou_Dissecando_Pt1_Rev2.wav',
      '02_Master_TemMasAcabou_Caxiri_Rev6.wav',
      '03_Master_TemMasAcabou_RuaDasMerces_Rev8.wav',
      '04_Master_TemMasAcabou_MateusAleluia_Rev8.wav',
      '05_Master_TemMasAcabou_FalaCobrinha_Rev2.wav',
      '06_Master_TemMasAcabou_CoisasVerdesEFrescas_Rev1.wav',
      '07_Master_TemMasAcabou_Sopro1-(Interlúdio)_Rev1.wav',
      '08_Master_TemMasAcabou_NIT_Rev2.wav',
      '09_Master_TemMasAcabou_Minhoca_Rev4.wav',
      '10_Master_TemMasAcabou_Dissecando_Pt2_Rev2.wav'
    ];

    const trackTitles = [
      'Dissecando Pt. 1',
      'Caxiri',
      'Rua das Mercês',
      'Mateus Aleluia',
      'Fala Cobrinha',
      'Coisas Verdes e Frescas',
      'Sopro 1 (Interlúdio)',
      'NIT',
      'Minhoca',
      'Dissecando Pt. 2'
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
      public_id: 'tem-mas-acabou-quintal-cover'
    });
    const coverUrl = coverResult.secure_url;
    console.log('✅ Upload da capa concluído:', coverUrl.substring(0, 50) + '...\n');

    // ========== 4. CRIAR ARTISTA ==========
    console.log('💾 Criando artista...');

    const artist = await Artist.create({
      name: "Tem Mas Acabou",
      bio: "Banda brasileira que mistura elementos da música popular brasileira com rock alternativo e experimentações sonoras. 'Quintal' é seu álbum de 2024, trazendo letras poéticas e arranjos complexos.",
      genre: ["mpb", "rock", "indie"],
      country: "BR",
      avatar: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=400&fit=crop",
      coverImage: "https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1200&h=400&fit=crop",
      monthlyListeners: 8500,
      verified: true,
      socialLinks: {
        instagram: "@temmasacabou",
        youtube: "@temmasacabou"
      }
    });
    console.log(`✅ Artista criado: ${artist.name} (ID: ${artist._id})`);
    console.log(`   Gêneros: ${artist.genre.join(', ')}\n`);

    // ========== 5. CRIAR ÁLBUM ==========
    console.log('💿 Criando álbum...');
    const album = await Album.create({
      title: "Quintal",
      artist: artist._id,
      artists: [artist._id],
      cover: coverUrl,
      genre: ["mpb", "rock", "indie"],
      releaseDate: new Date('2024-03-20'),
      type: "album",
      copyright: "© 2024 Tem Mas Acabou",
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

      const mp3Filename = `${trackNumber.toString().padStart(2, '0')}_${trackTitle.replace(/[^a-z0-9]/gi, '_')}.mp3`;
      const mp3TempPath = path.join(tempDir, mp3Filename);
      tempFiles.push(mp3TempPath);

      // ✅ Ler duração ANTES de converter, direto do header do WAV — sem ffprobe
      const duration = await getWavDuration(wavPath);

      // Converter para MP3
      await convertWavToMp3(wavPath, mp3TempPath);

      // Upload para Cloudinary
      console.log(`   📤 Fazendo upload para Cloudinary...`);
      const audioResult = await cloudinary.uploader.upload(mp3TempPath, {
        resource_type: 'video',
        folder: 'nota-vermelha/audio/tem-mas-acabou',
        public_id: `quintal-${trackNumber.toString().padStart(2, '0')}-${trackTitle.toLowerCase().replace(/[^a-z0-9]/g, '-')}`
      });

      // Criar track no MongoDB
      const track = await Track.create({
        title: trackTitle,
        artists: [artist._id],
        album: album._id,
        duration: duration,
        trackNumber: trackNumber,
        genre: ["mpb", "rock", "indie"],
        audioUrl: audioResult.secure_url,
        previewUrl: audioResult.secure_url,
        coverUrl: coverUrl,
        playCount: Math.floor(Math.random() * 500) + 100,
        likeCount: Math.floor(Math.random() * 200) + 50,
        releaseDate: new Date('2024-03-20')
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

    const savedArtist = await Artist.findOne({ name: "Tem Mas Acabou" });
    const savedAlbum = await Album.findOne({ title: "Quintal" });
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
seedTemMasAcabou();