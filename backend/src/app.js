const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
require("dotenv").config();

const connectDB = require("./config/db");
const setupIndexes = require("./config/indexes");
const cacheService = require("./services/cacheService");

const trackRoutes = require("./routes/trackRoutes");
const albumRoutes = require("./routes/albumRoutes");
const artistRoutes = require("./routes/artistRoutes");
const playlistRoutes = require("./routes/playlistRoutes");
const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/authRoutes");
const feedRoutes = require("./routes/feedRoutes");
const searchRoutes = require("./routes/searchRoutes");
const postRoutes = require("./routes/postRoutes"); // ✅ Adicionado

const app = express();

const PORT = process.env.PORT || 5000;

connectDB();

Promise.resolve()
  .then(async () => {
    console.log("🔧 Inicializando otimizações do banco de dados...");
    await setupIndexes();
    console.log("✅ Otimizações do banco concluídas");
  })
  .catch((err) => {
    console.error("⚠️ Erro ao inicializar otimizações:", err.message);
    console.log("📌 App continuará rodando normalmente sem os índices extras");
  });

Promise.resolve()
  .then(async () => {
    if (process.env.REDIS_URL) {
      await cacheService.initRedis();
    } else {
      console.log("📌 Redis não configurado, usando cache em memória");
    }
  })
  .catch((err) => {
    console.error("⚠️ Redis não disponível:", err.message);
    console.log("📌 Usando cache em memória como fallback");
  });

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.use("/audio",  express.static(path.join(__dirname, "../../mobile/assets/audio")));
app.use("/images", express.static(path.join(__dirname, "../../mobile/assets/images")));

app.use("/api/auth",      authRoutes);
app.use("/api/users",     userRoutes);
app.use("/api/artists",   artistRoutes);
app.use("/api/tracks",    trackRoutes);
app.use("/api/albums",    albumRoutes);
app.use("/api/playlists", playlistRoutes);
app.use("/api/feed",      feedRoutes);
app.use("/api/posts",     postRoutes); // ✅ Adicionado
app.use("/api/search",    searchRoutes);

app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    message: "API da Nota Vermelha está rodando",
    timestamp: new Date().toISOString(),
    cache: cacheService.redisAvailable ? "redis" : "memory",
    indexes: "optimized"
  });
});

app.get("/api/test-files", (req, res) => {
  res.json({
    audio:  "http://localhost:5000/audio/",
    images: "http://localhost:5000/images/",
  });
});

app.post("/api/admin/cache/invalidate", async (req, res) => {
  try {
    const { pattern } = req.body;
    if (!pattern) return res.status(400).json({ error: "Pattern é obrigatório" });
    await cacheService.invalidatePattern(pattern);
    res.json({ success: true, message: `Cache invalidado para pattern: ${pattern}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.use((req, res) => {
  res.status(404).json({ error: "Rota não encontrada" });
});

app.use((err, req, res, next) => {
  console.error("❌ Erro não tratado:", err.stack);
  res.status(500).json({
    error: "Erro interno do servidor",
    message: process.env.NODE_ENV === "development" ? err.message : undefined
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`💾 Cache mode: ${cacheService.redisAvailable ? 'Redis' : 'Memory'}`);
});

process.on("SIGINT", async () => {
  console.log("🛑 Recebido SIGINT, fechando conexões...");
  if (cacheService.redisAvailable && cacheService.redis) {
    await cacheService.redis.quit();
    console.log("✅ Conexão Redis fechada");
  }
  process.exit(0);
});

process.on("SIGTERM", async () => {
  console.log("🛑 Recebido SIGTERM, fechando conexões...");
  if (cacheService.redisAvailable && cacheService.redis) {
    await cacheService.redis.quit();
    console.log("✅ Conexão Redis fechada");
  }
  process.exit(0);
});