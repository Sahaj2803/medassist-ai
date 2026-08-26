import fs from "fs";
import path from "path";
import multer from "multer";
import { AppError } from "./errorHandler.js";

const PRESCRIPTION_UPLOAD_ROOT = path.resolve("uploads/prescriptions");
const LAB_REPORT_UPLOAD_ROOT = path.resolve("uploads/lab-reports");

const ALLOWED_MIME_TYPES = {
  "image/jpeg": "image",
  "image/jpg": "image",
  "image/png": "image",
  "image/webp": "image",
  "application/pdf": "pdf",
};

function makeStorage(uploadRoot) {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      const userDir = path.join(uploadRoot, String(req.user.id));
      fs.mkdirSync(userDir, { recursive: true });
      cb(null, userDir);
    },
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      const safeName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      cb(null, safeName);
    },
  });
}

const fileFilter = (req, file, cb) => {
  if (!ALLOWED_MIME_TYPES[file.mimetype]) {
    return cb(
      new AppError(
        "Unsupported file type. Upload a JPG, PNG, WEBP image or a PDF.",
        400
      )
    );
  }
  cb(null, true);
};

function buildUploadMiddleware(uploadRoot) {
  const multerUpload = multer({
    storage: makeStorage(uploadRoot),
    fileFilter,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  }).single("file");

  /**
   * multer's own middleware calls next(err) with a MulterError, which
   * our errorHandler doesn't recognize by default. Normalize it here.
   */
  return (req, res, next) => {
    multerUpload(req, res, (err) => {
      if (!err) return next();

      if (err instanceof multer.MulterError && err.code === "LIMIT_FILE_SIZE") {
        return next(new AppError("File is too large. Maximum size is 10MB.", 400));
      }
      if (err instanceof AppError) return next(err);
      return next(new AppError(err.message || "File upload failed", 400));
    });
  };
}

export const uploadPrescriptionFile = buildUploadMiddleware(PRESCRIPTION_UPLOAD_ROOT);
export const uploadLabReportFile = buildUploadMiddleware(LAB_REPORT_UPLOAD_ROOT);

export const fileKindFromMime = (mimeType) => ALLOWED_MIME_TYPES[mimeType];
