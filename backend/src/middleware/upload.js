const multer = require("multer");

// Explicit MIME type whitelist — no arbitrary uploads
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

// Keep frames in memory (no disk I/O for real-time performance)
const storage = multer.memoryStorage();

const fileFilter = (_req, file, cb) => {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only JPEG, PNG, and WebP images are allowed."), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE_MB || "5") * 1024 * 1024,
  },
});

module.exports = upload;
