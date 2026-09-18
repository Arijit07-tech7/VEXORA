import multer from "multer";
import path from "path";
import fs from "fs";
import { UPLOADS_DIR } from "../database/db.js";

fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOADS_DIR),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${Date.now()}-${safe}`);
  }
});

const allowed = new Set([
  "image/jpeg", "image/png", "image/webp", "application/pdf",
  "text/plain", "application/zip"
]);

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!allowed.has(file.mimetype)) return cb(new Error("Unsupported file type"));
    cb(null, true);
  }
});
