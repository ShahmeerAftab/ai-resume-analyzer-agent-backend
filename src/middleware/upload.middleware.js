import multer from "multer";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

// memoryStorage keeps the uploaded file in RAM as req.file.buffer — no disk needed
const storage = multer.memoryStorage();

// reject any file that is not a PDF before it reaches the controller
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
  limits: { fileSize: MAX_FILE_SIZE },
});

// wraps multer so its errors reach Express's central error handler
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

    res.status(400);
    next(err);
  });
};

export default uploadResume;
