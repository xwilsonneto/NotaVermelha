// backend/scripts/seedPolara.js
require('dotenv').config();
const mongoose = require('mongoose');
const fs       = require('fs');
const path     = require('path');

const cloudinary = require('cloudinary').v2;
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const Artist = require('../src/models/Artist');
const Album  = require('../src/models/Album');
const Track  = require('../src/models/Track');

// ─── Duração real do MP3 ─────────────────────────────────────────────────────
function getMp3Duration(mp3Path) {
  return new Promise((resolve, reject) => {
    try {
      const stat = fs.statSync(mp3Path);
      if (stat.size === 0) return reject(new Error(`Empty file: ${mp3Path}`));

      const buffer = fs.readFileSync(mp3Path);
      const size   = buffer.length;

      let offset = 0;
      if (buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33) {
        const id3Size =
          ((buffer[6] & 0x7f) << 21) |
          ((buffer[7] & 0x7f) << 14) |
          ((buffer[8] & 0x7f) <<  7) |
           (buffer[9] & 0x7f);
        offset = 10 + id3Size;
      }

      const BITRATES    = [0,32,40,48,56,64,80,96,112,128,160,192,224,256,320,0];
      const SAMPLERATES = [44100, 48000, 32000, 0];
      let bitrate = 0, sampleRate = 44100, found = false;

      for (let i = offset; i < Math.min(offset + 20000, size - 4); i++) {
        if (buffer[i] === 0xff && (buffer[i+1] & 0xe0) === 0xe0) {
          const b1 = buffer[i+1], b2 = buffer[i+2];
          const version    = (b1 >> 3) & 0x03;
          const layer      = (b1 >> 1) & 0x03;
          const bitrateIdx = (b2 >> 4) & 0x0f;
          const srIdx      = (b2 >> 2) & 0x03;
          if (version === 3 && layer === 1 && bitrateIdx > 0 && bitrateIdx < 15 && srIdx < 3) {
            bitrate    = BITRATES[bitrateIdx] * 1000;
            sampleRate = SAMPLERATES[srIdx];
            found      = true;
            break;
          }
        }
      }

      if (!found || bitrate === 0) {
        const est = Math.round((size * 8) / (192 * 1000));
        console.log(`   ⚠️  Estimativa pelo tamanho: ${Math.floor(est/60)}:${String(est%60).padStart(2,'0')}`);
        return resolve(est);
      }

      let audioSize = size - offset;
      if (buffer[size-128] === 0x54 && buffer[size-127] === 0x41 && buffer[size-126] === 0x47) {
        audioSize -= 128;
      }

      const dur = Math.round((audioSize * 8) / bitrate);
      console.log(`   ⏱️  ${Math.floor(dur/60)}:${String(dur%60).padStart(2,'0')} | ${bitrate/1000}kbps, ${sampleRate}Hz`);
      resolve(dur);
    } catch (err) {
      reject(err);
    }
  });
}

// ─── Extração de número + título ─────────────────────────────────────────────
// Padrão A: "Polara - Inacabado - 01 Rabo De Galo.mp3"
// Padrão B: "1 - Como Assim - Polara - Partilha (youtube).mp3"
//           "8 - Disléxico - Partilha - Polara (youtube).mp3"
function parseTrackFilename(filename) {
  const base = path.basename(filename, '.mp3').trim();

  // Padrão A: "Polara - <Album> - <NN> <Título>"
  const matchA = base.match(/^Polara\s*-\s*.+?\s*-\s*(\d{1,2})\s+(.+)$/i);
  if (matchA) {
    return { trackNumber: parseInt(matchA[1], 10), title: matchA[2].trim() };
  }

  // Padrão B: "<N> - <Título> - Polara/Partilha ..."
  // Título é sempre o segundo token, antes de "- Polara" ou "- Partilha"
  const matchB = base.match(/^(\d{1,2})\s*-\s*(.+?)\s*-\s*(?:Polara|Partilha)/i);
  if (matchB) {
    const title = matchB[2].replace(/\s*\(youtube\)\s*/gi, '').trim();
    return { trackNumber: parseInt(matchB[1], 10), title };
  }

  console.warn(`   ⚠️  Padrão não reconhecido: "${filename}"`);
  return { trackNumber: 0, title: base };
}

// ─── Álbuns ──────────────────────────────────────────────────────────────────
const ALBUMS = [
  { folder: 'inacabado',         title: 'Inacabado',         releaseDate: new Date('2018-01-01') },
  { folder: 'partilha',          title: 'Partilha',          releaseDate: new Date('2015-01-01') },
  { folder: 'tempestadebipolar', title: 'Tempestade Bipolar', releaseDate: new Date('2021-01-01') },
];

// ─── Seed ────────────────────────────────────────────────────────────────────
async function seedPolara() {
  try {
    console.log('\n☁️  Iniciando seed — Polara');
    console.log('📀 Álbuns: Inacabado | Partilha | Tempestade Bipolar\n');

    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB conectado\n');

    // Limpar dados antigos
    const existing = await Artist.findOne({ name: 'Polara' });
    if (existing) {
      console.log('⚠️  Artista já existe — removendo...');
      await Track.deleteMany({ artists: existing._id });
      await Album.deleteMany({ artist: existing._id });
      await Artist.deleteOne({ _id: existing._id });
      console.log('✅ Dados antigos removidos\n');
    }

    const baseDir = 'C:\\Users\\Samsung\\NotaVermelha\\mobile\\assets\\audio\\polara';

    // 1. Criar artista
    console.log('💾 Criando artista...');
    const artist = await Artist.create({
      name:             'Polara',
      bio:              'Banda brasileira de hardcore melódico e punk formada em São Paulo. Com mais de uma década de estrada, a Polara constrói pontes entre a intensidade do hardcore e a melodia do punk rock, entregando letras diretas sobre relacionamentos, identidade e os altos e baixos da vida cotidiana. Seus álbuns — Partilha, Inacabado e Tempestade Bipolar — consolidaram a banda como referência na cena alternativa nacional.',
      genre:            ['hardcore melódico', 'punk'],
      country:          'BR',
      avatar:           'https://ui-avatars.com/api/?name=Polara&background=7f1d1d&color=fff&bold=true&size=400',
      coverImage:       'https://ui-avatars.com/api/?name=Polara&background=7f1d1d&color=fff&bold=true&size=1200',
      monthlyListeners: 5200,
      verified:         true,
      socialLinks: {
        instagram: '@polaraoficial',
        youtube:   '@polaraoficial',
      },
    });
    console.log(`✅ Artista criado: ${artist.name} (ID: ${artist._id})\n`);

    // 2. Processar cada álbum
    for (const cfg of ALBUMS) {
      const albumDir  = path.join(baseDir, cfg.folder);
      const coverPath = path.join(albumDir, 'cover.jpg');

      console.log(`${'─'.repeat(60)}`);
      console.log(`💿 Álbum: ${cfg.title}`);
      console.log(`📁 Pasta: ${albumDir}`);

      if (!fs.existsSync(albumDir))  throw new Error(`Pasta não encontrada: ${albumDir}`);
      if (!fs.existsSync(coverPath)) throw new Error(`Capa não encontrada: ${coverPath}`);

      // Listar mp3s — ignorar arquivos vazios
      const mp3Files = fs.readdirSync(albumDir)
        .filter(f => {
          if (!f.toLowerCase().endsWith('.mp3')) return false;
          const size = fs.statSync(path.join(albumDir, f)).size;
          if (size === 0) {
            console.warn(`   ⚠️  Ignorando arquivo vazio: ${f}`);
            return false;
          }
          return true;
        })
        .map(f => ({ filename: f, ...parseTrackFilename(f) }))
        .sort((a, b) => a.trackNumber - b.trackNumber);

      if (mp3Files.length === 0) throw new Error(`Nenhum MP3 válido em: ${albumDir}`);

      console.log(`🎵 ${mp3Files.length} faixas encontradas:`);
      mp3Files.forEach(t => console.log(`   ${t.trackNumber}. ${t.title}`));

      // Upload da capa
      console.log('\n📤 Enviando capa...');
      const coverResult = await cloudinary.uploader.upload(coverPath, {
        folder:    'nota-vermelha/covers',
        public_id: `polara-${cfg.folder}-cover`,
        overwrite: true,
      });
      const coverUrl = coverResult.secure_url;
      console.log(`✅ Capa enviada: ${coverUrl.substring(0, 60)}...`);

      // Criar álbum — campos idênticos ao seed da Tem Mas Acabou
      const album = await Album.create({
        title:       cfg.title,
        artist:      artist._id,
        artists:     [artist._id],
        cover:       coverUrl,
        releaseDate: cfg.releaseDate,
        genre:       ['hardcore melódico', 'punk'],
        type:        'album',
        copyright:   `© ${cfg.releaseDate.getFullYear()} Polara`,
        label:       'Independente',
        isExplicit:  false,
        popularity:  0,
        totalTracks: mp3Files.length,
      });
      console.log(`✅ Álbum criado: ${album.title} (ID: ${album._id})\n`);

      // Processar faixas
      let totalDuration = 0;
      console.log('🎵 Processando faixas...\n');

      for (let i = 0; i < mp3Files.length; i++) {
        const t       = mp3Files[i];
        const mp3Path = path.join(albumDir, t.filename);

        console.log(`   🎵 Faixa ${t.trackNumber}: ${t.title}`);
        console.log(`   📁 Arquivo: ${t.filename}`);

        const duration = await getMp3Duration(mp3Path);

        const mp3Filename = `${String(t.trackNumber).padStart(2,'0')}_${t.title.replace(/[^a-z0-9]/gi,'_')}.mp3`;

        console.log(`   📤 Fazendo upload para Cloudinary...`);
        const publicId    = `polara-${cfg.folder}-${String(t.trackNumber).padStart(2,'0')}-${t.title.toLowerCase().replace(/[^a-z0-9]/g,'-')}`;
        const audioResult = await cloudinary.uploader.upload(mp3Path, {
          resource_type: 'video',
          folder:        'nota-vermelha/audio/polara',
          public_id:     publicId,
          overwrite:     true,
        });

        // Campos idênticos ao Track do seedTemMasAcabou
        await Track.create({
          title:        t.title,
          artists:      [artist._id],
          album:        album._id,
          duration,
          trackNumber:  t.trackNumber,
          diskNumber:   1,
          genre:        ['hardcore melódico', 'punk'],
          audioUrl:     audioResult.secure_url,
          previewUrl:   audioResult.secure_url,
          coverUrl,
          playCount:    Math.floor(Math.random() * 500) + 100,
          likeCount:    Math.floor(Math.random() * 200) + 50,
          isExplicit:   false,
          isAvailable:  true,
          releaseDate:  cfg.releaseDate,
          energy:       0.5,
          danceability: 0.5,
          lyricsSync:   [],
        });

        totalDuration += duration;
        const m = Math.floor(duration / 60);
        const s = duration % 60;
        console.log(`   ✅ ${t.trackNumber}. ${t.title} (${m}:${String(s).padStart(2,'0')})\n`);
      }

      await Album.findByIdAndUpdate(album._id, { duration: totalDuration });
      console.log(`✅ Álbum "${cfg.title}" concluído — duração total: ${Math.floor(totalDuration/60)} minutos e ${totalDuration%60} segundos\n`);
    }

    // 3. Resumo final
    const savedArtist = await Artist.findOne({ name: 'Polara' });
    const totalAlbums = await Album.countDocuments({ artist: savedArtist._id });
    const totalTracks = await Track.countDocuments({ artists: savedArtist._id });

    console.log('\n🔍 VERIFICAÇÃO FINAL:');
    console.log(`   Artista no banco: ${savedArtist ? '✅' : '❌'}`);
    console.log(`   Álbuns no banco : ${totalAlbums} de ${ALBUMS.length}`);
    console.log(`   Faixas no banco : ${totalTracks}`);

    console.log('\n' + '═'.repeat(60));
    console.log('✨ SEED COMPLETADO COM SUCESSO!');
    console.log(`   Artista : Polara`);
    console.log(`   Álbuns  : ${totalAlbums}`);
    console.log(`   Faixas  : ${totalTracks}`);
    console.log('═'.repeat(60));

    await mongoose.connection.close();
    console.log('\n🔌 Conexão encerrada.');

  } catch (err) {
    console.error('\n❌ Erro no seed:', err.message);
    if (err.errors) {
      Object.keys(err.errors).forEach(k =>
        console.error(`   ${k}: ${err.errors[k].message}`)
      );
    }
    process.exit(1);
  }
}

seedPolara();