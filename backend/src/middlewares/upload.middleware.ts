import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import multer from 'multer';

const uploadsRoot = join(process.cwd(), 'uploads');
const imageDir = join(uploadsRoot, 'images');
const pdfDir = join(uploadsRoot, 'pdfs');

[uploadsRoot, imageDir, pdfDir].forEach((directory) => {
  if (!existsSync(directory)) mkdirSync(directory, { recursive: true });
});

const storage = multer.diskStorage({
  destination: (_req, file, callback) => {
    callback(null, file.mimetype === 'application/pdf' ? pdfDir : imageDir);
  },
  filename: (_req, file, callback) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9_.-]/g, '_');
    callback(null, `${Date.now()}-${safeName}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      callback(null, true);
      return;
    }
    callback(new Error('Formato no permitido'));
  }
});

export const uploadSingle = upload.single('file');
