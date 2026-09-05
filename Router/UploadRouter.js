const express = require('express');
const router = express.Router();
const multer = require('multer');

const upload = multer({
  dest: 'uploads/'
});

router.post('/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'No file uploaded'
    });
  }

  const host = req.get('host');

  const fileUrl = `https://${host}/uploads/${req.file.filename}`;

  console.log('Uploaded file:', req.file);
  console.log('File URL:', fileUrl);

  res.json({
    success: true,
    file_url: fileUrl
  });
});

module.exports = router;