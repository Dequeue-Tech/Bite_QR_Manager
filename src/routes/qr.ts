import { Router } from 'express';
import { handleQrRedirect } from '../controllers/qrController';

const router = Router();

router.get('/:code', handleQrRedirect);

export default router;
