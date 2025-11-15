const multer = require('multer');
const path = require('path');
const fs = require('fs');

const baseUploadPath = path.join(__dirname, 'uploads');
const songPath = path.join(baseUploadPath, 'songs');
const avatarPath = path.join(baseUploadPath, 'avatars');

// Ensure folders exist
[songPath, avatarPath].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// Storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.mimetype.startsWith('audio/')) {
      cb(null, songPath);
    } else if (file.mimetype.startsWith('image/')) {
      cb(null, avatarPath);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowed = ['.mp3', '.jpg', '.jpeg', '.png'];

  if (allowed.includes(ext)) cb(null, true);
  else cb(new Error('Only MP3, JPG, JPEG, and PNG files are allowed'), false);
};

// Multer init
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50 MB
});

module.exports = upload;
