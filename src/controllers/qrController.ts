import { Request, Response, NextFunction } from 'express';
import { resolveRedirect } from '../services/qrService';

export async function handleQrRedirect(req: Request, res: Response, next: NextFunction) {
  try {
    const code = req.params['code'];
    const result = await resolveRedirect(code, req.ip, req.get('user-agent') || undefined);

    if (!result) {
      return res.status(404).send('Invalid QR');
    }

    return res.redirect(302, result.url);
  } catch (err) {
    return next(err);
  }
}
