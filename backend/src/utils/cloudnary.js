const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Upload de áudio (Cloudinary trata como 'video')
exports.uploadAudio = async (filePath, folder = 'nota-vermelha/audio') => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      resource_type: 'video',
      folder: folder,
      use_filename: true,
      unique_filename: false,
      overwrite: true
    });
    return result.secure_url;
  } catch (error) {
    console.error('Erro Cloudinary:', error);
    throw error;
  }
};

// Upload de imagem
exports.uploadImage = async (filePath, folder = 'nota-vermelha/images') => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      use_filename: true,
      unique_filename: false
    });
    return result.secure_url;
  } catch (error) {
    console.error('Erro Cloudinary:', error);
    throw error;
  }
};