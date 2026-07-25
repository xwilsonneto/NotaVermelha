const express = require('express');
const router = express.Router();
const { upload, uploadImage } = require('../controllers/uploadController');

// POST /api/upload/image
router.post('/image', upload.single('file'), uploadImage);

module.exports = router;