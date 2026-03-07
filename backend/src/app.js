const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");
require("dotenv").config();

const connectDB = require("./config/db");

const trackRoutes = require("./routes/trackRoutes");
const albumRoutes = require("./routes/albumRoutes");
const artistRoutes = require("./routes/artistRoutes");
const playlistRoutes = require("./routes/playlistRoutes");
const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/authRoutes");
const feedRoutes = require("./routes/feedRoutes");

const app = express();

const PORT = process.env.PORT || 5000;

connectDB();

app.use(cors());

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(morgan("dev"));

/*
STATIC FILES
*/

app.use(
  "/audio",
  express.static(
    path.join(__dirname, "../../mobile/assets/audio")
  )
);

app.use(
  "/images",
  express.static(
    path.join(__dirname, "../../mobile/assets/images")
  )
);

/*
API ROUTES
*/

app.use("/api/auth", authRoutes);

app.use("/api/users", userRoutes);

app.use("/api/artists", artistRoutes);

app.use("/api/tracks", trackRoutes);

app.use("/api/albums", albumRoutes);

app.use("/api/playlists", playlistRoutes);

app.use("/api/feed", feedRoutes);

/*
HEALTH CHECK
*/

app.get("/api/health", (req, res) => {

  res.json({
    status: "OK",
    message: "API da Nota Vermelha está rodando",
    timestamp: new Date().toISOString(),
  });

});

/*
TEST FILES
*/

app.get("/api/test-files", (req, res) => {

  res.json({
    audio: "http://localhost:5000/audio/",
    images: "http://localhost:5000/images/",
  });

});

/*
404 HANDLER
*/

app.use((req, res) => {

  res.status(404).json({
    error: "Rota não encontrada",
  });

});

/*
GLOBAL ERROR HANDLER
*/

app.use((err, req, res, next) => {

  console.error(err.stack);

  res.status(500).json({
    error: "Erro interno do servidor",
  });

});

/*
SERVER START
*/

app.listen(PORT, () => {

  console.log(`🚀 Server running on http://localhost:${PORT}`);

});