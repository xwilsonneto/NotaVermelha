const Album = require("../models/Album");
const Artist = require("../models/Artist");
const Track = require("../models/Track");

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// GET /api/search?q=texto&limit=5
exports.search = async (req, res) => {
  try {
    const q = (req.query.q ?? "").trim();
    if (!q) {
      return res.json({ success: true, data: { artists: [], albums: [], tracks: [] } });
    }

    const limit = Math.min(parseInt(req.query.limit) || 5, 20);
    const regex = new RegExp(escapeRegex(q), "i");

    // Busca em paralelo
    const [artists, albums, tracks] = await Promise.all([
      // 1 — Artistas
      Artist.find({ name: regex })
        .select("name avatar genres verified monthlyListeners")
        .sort({ monthlyListeners: -1 })
        .limit(limit)
        .lean(),

      // 2 — Álbuns
      Album.find({ title: regex })
        .populate("artist", "name avatar username")
        .select("title coverUrl cover releaseDate artist")
        .sort({ releaseDate: -1 })
        .limit(limit)
        .lean(),

      // 3 — Músicas (busca por título OU nome do artista dentro da faixa)
      Track.find({
        $or: [
          { title: regex },           // campo principal
          { name: regex },            // fallback caso o schema use "name"
          { "artists.name": regex },  // se artists for subdocumento embedado
        ],
      })
        .populate("artists", "name avatar")
        .populate("album", "title coverUrl cover")
        .select("title name audioUrl coverUrl duration playCount artists album")
        .sort({ playCount: -1 })
        .limit(limit)
        .lean(),
    ]);

    // DEBUG: veja no terminal do servidor se as tracks estão vindo
    console.log(`[Search] q="${q}" | artists=${artists.length} albums=${albums.length} tracks=${tracks.length}`);

    res.json({ success: true, data: { artists, albums, tracks } });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};