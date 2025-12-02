import { Request, Response, Router } from 'express';
import { upload } from '../config/multer';
import { analyzeController } from '../controllers/pdf-analyzer.controller';

const router = Router();

router.post(
  '/analyze', upload.any(), 
  (req: Request, res: Response) => analyzeController(req, res)
);

export default router;
