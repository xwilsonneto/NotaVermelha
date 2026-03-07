const multer = require("multer");

// ─── CLOUDINARY (opcional) ────────────────────────────────────────────────
// Se as variáveis não estiverem configuradas, usa armazenamento local
// para não quebrar a inicialização do servidor.

let storage;

const cloudinaryConfigured =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET;

if (cloudinaryConfigured) {

  const cloudinary = require("cloudinary").v2;
  const { CloudinaryStorage } = require("multer-storage-cloudinary");

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  storage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => {
      const isAudio = file.mimetype.startsWith("audio/");
      return {
        folder: isAudio ? "nota-vermelha/audio" : "nota-vermelha/covers",
        resource_type: isAudio ? "video" : "image", // Cloudinary usa "video" para áudio
        allowed_formats: isAudio
          ? ["mp3", "wav", "ogg", "m4a"]
          : ["jpg", "jpeg", "png", "webp"],
      };
    },
  });

  console.log("☁️  Upload via Cloudinary ativado");

} else {

  // Fallback: salva localmente em /uploads
  const path = require("path");
  const fs = require("fs");

  const uploadDir = path.join(__dirname, "../../uploads");
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

  storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    },
  });

  console.warn("⚠️  Cloudinary não configurado — uploads salvos localmente em /uploads");

}

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowed = [
      "audio/mpeg", "audio/wav", "audio/ogg", "audio/mp4",
      "image/jpeg", "image/png", "image/webp",
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Tipo de arquivo não permitido: ${file.mimetype}`));
    }
  },
});

module.exports = upload;