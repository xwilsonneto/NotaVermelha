// backend/scripts/checkData.js
require('dotenv').config();
const mongoose = require('mongoose');

async function checkData() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Conectado ao MongoDB\n');

    // Buscar todos os artistas
    const artists = await mongoose.connection.db.collection('artists').find({}).toArray();
    console.log('🎸 Artistas encontrados:', artists.length);
    artists.forEach(a => console.log(`   - ${a.name}`));

    // Buscar todos os álbuns
    const albums = await mongoose.connection.db.collection('albums').find({}).toArray();
    console.log('\n💿 Álbuns encontrados:', albums.length);
    albums.forEach(a => console.log(`   - ${a.title}`));

    // Buscar todas as músicas
    const tracks = await mongoose.connection.db.collection('tracks').find({}).toArray();
    console.log('\n🎵 Músicas encontradas:', tracks.length);
    tracks.forEach(t => console.log(`   - ${t.title}`));

    await mongoose.connection.close();
  } catch (error) {
    console.error('❌ Erro:', error);
  }
}

checkData();