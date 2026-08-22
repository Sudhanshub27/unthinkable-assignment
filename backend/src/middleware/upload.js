const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const uploadDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const ALLOWED_MIME_EXT_MAP = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'image/gif': ['.gif'],
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const originalExt = path.extname(file.originalname).toLowerCase();
    const allowedExts = ALLOWED_MIME_EXT_MAP[file.mimetype] || [];
    const safeExt = allowedExts.includes(originalExt) ? originalExt : allowedExts[0] || '.jpg';
    const randomHex = crypto.randomBytes(12).toString('hex');
    cb(null, `${Date.now()}-${randomHex}${safeExt}`);
  },
});

function fileFilter(req, file, cb) {
  const originalExt = path.extname(file.originalname).toLowerCase();
  const allowedExts = ALLOWED_MIME_EXT_MAP[file.mimetype];

  if (!allowedExts || !allowedExts.includes(originalExt)) {
    return cb(new Error('Only JPEG, PNG, WebP, and GIF image files are allowed.'));
  }

  cb(null, true);
}

function isValidImageBuffer(buffer) {
  if (!buffer || buffer.length < 8) return false;

  // Check JPEG (FF D8 FF)
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return true;
  }
  // Check PNG (89 50 4E 47 0D 0A 1A 0A)
  if (
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return true;
  }
  // Check GIF (47 49 46 38)
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38) {
    return true;
  }
  // Check WEBP (RIFF .... WEBP)
  if (
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46 &&
    buffer.length >= 12 &&
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50
  ) {
    return true;
  }

  return false;
}

const multerUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

function singlePhoto(req, res, next) {
  multerUpload.single('photo')(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'File size exceeds maximum limit of 5MB.' });
        }
      }
      return res.status(400).json({ error: err.message || 'File upload failed.' });
    }

    if (!req.file) {
      return next();
    }

    const filePath = req.file.path;
    try {
      const fd = fs.openSync(filePath, 'r');
      const buffer = Buffer.alloc(16);
      fs.readSync(fd, buffer, 0, 16, 0);
      fs.closeSync(fd);

      if (!isValidImageBuffer(buffer)) {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        return res.status(400).json({ error: 'Uploaded file is not a valid image file.' });
      }

      next();
    } catch (readErr) {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return res.status(400).json({ error: 'Failed to validate uploaded file signature.' });
    }
  });
}

module.exports = {
  single: () => singlePhoto,
  singlePhoto,
};
