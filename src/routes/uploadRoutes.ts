import { Router, Request, Response } from 'express';
import { protect } from '../middleware/auth';
import { uploadSingle } from '../middleware/upload';
import cloudinary from '../config/cloudinary';
import logger from '../utils/logger';

const router = Router();

// Any authenticated user can upload (admins for products, users for proof images)
router.post('/', protect, (req: Request, res: Response) => {
  uploadSingle(req, res, async (err) => {
    if (err) {
      res.status(400).json({ message: err.message });
      return;
    }
    if (!req.file) {
      res.status(400).json({ message: 'No file uploaded' });
      return;
    }
    try {
      const b64 = Buffer.from(req.file.buffer).toString('base64');
      const dataURI = `data:${req.file.mimetype};base64,${b64}`;
      const result = await cloudinary.uploader.upload(dataURI, {
        folder: 'catalog',
        resource_type: 'image',
        transformation: [{ quality: 'auto', fetch_format: 'auto' }],
      });
      logger.info('Image uploaded to Cloudinary', { url: result.secure_url, user: (req as any).user?._id });
      res.status(201).json({ url: result.secure_url });
    } catch (uploadErr) {
      logger.error('Cloudinary upload failed', { error: (uploadErr as Error).message });
      res.status(500).json({ message: 'Image upload failed. Check Cloudinary credentials.' });
    }
  });
});

export default router;
