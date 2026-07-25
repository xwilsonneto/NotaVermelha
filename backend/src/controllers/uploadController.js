const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const multer = require('multer');

/* ── Config do Cloudinary (só se ainda não estiver no app.js) ──────────── */
if (!cloudinary.config().cloud_name) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

/* ── Multer: salva temporariamente em uploads/ ───────────────────────────── */
const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Apenas imagens são permitidas.'), false);
  },
});

/* ── Faz upload pro Cloudinary e deleta o temp ──────────────────────────── */
const uploadImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Nenhuma imagem enviada.' });
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'notavermelha/posts',
      resource_type: 'image',
    });

    // deleta o arquivo temporário
    fs.unlink(req.file.path, (err) => {
      if (err) console.error('[upload] falha ao deletar temp:', err);
    });

    return res.json({
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
    });
  } catch (error) {
    // limpa temp em caso de erro
    if (req.file?.path) {
      fs.unlink(req.file.path, () => {});
    }
    console.error('[uploadImage]', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Erro ao fazer upload da imagem.',
    });
  }
};

module.exports = {
  upload,
  uploadImage,
};