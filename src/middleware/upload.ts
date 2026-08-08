import multer from 'multer';
import { Request } from 'express';

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowed = /jpeg|jpg|png|webp|gif|avif/;
  const ok = allowed.test(file.mimetype.split('/')[1]);
  if (ok) cb(null, true);
  else cb(new Error('Only image files are allowed (jpeg, jpg, png, webp, gif, avif)'));
};

// Use memory storage — buffer is passed to Cloudinary directly
export const uploadSingle = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 8 * 1024 * 1024 }, // 8 MB
}).single('image');
