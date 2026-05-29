import multer from "multer";
import path from "path";
import fs from "fs";

const UPLOAD_DIR = "uploads";
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

// Ensure uploads/ exists at startup
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),

  filename: (_req, file, cb) => {
    const timestamp = Date.now();
    const random = Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `resume-${timestamp}-${random}${ext}`);
  },
});

const fileFilter = (_req, file, cb) => {
  if (file.mimetype === "application/pdf") {
    cb(null, true);
  } else {
    cb(new Error("Only PDF files are allowed"), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_SIZE_BYTES },
});

// Wraps multer so multer errors surface as proper Express errors
const uploadResume = (req, res, next) => {
  upload.single("resume")(req, res, (err) => {
    if (!err) return next();

    if (err instanceof multer.MulterError) {
      const message =
        err.code === "LIMIT_FILE_SIZE"
          ? "File too large. Maximum size is 5 MB"
          : err.message;
      res.status(400);
      return next(new Error(message));
    }

    // fileFilter rejection or unexpected error
    res.status(400);
    next(err);
  });
};

export default uploadResume;
