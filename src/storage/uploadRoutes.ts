import { Router } from 'express';
import multer from 'multer';
import { uploadController } from './uploadController';
import { authenticate, requireNotSuspended } from '../auth/authMiddleware';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB per file
});

const router = Router();

router.post(
  '/',
  authenticate,
  requireNotSuspended,
  upload.array('files', 5),
  (req, res, next) => uploadController.handleUpload(req, res, next)
);

// File serving endpoint
router.get('/files/:filename', (req, res, next) =>
  uploadController.getFile(req, res, next)
);

export default router;
