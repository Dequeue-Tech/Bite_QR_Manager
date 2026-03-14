import express from 'express';
import { createRateLimiter } from './middleware/rateLimit';
import { errorHandler } from './middleware/errorHandler';
import qrRouter from './routes/qr';

const app = express();

const trustProxyEnv = process.env.TRUST_PROXY;
if (trustProxyEnv !== undefined) {
  const normalized = trustProxyEnv.trim().toLowerCase();
  const asNumber = Number(normalized);
  if (!Number.isNaN(asNumber) && normalized !== '') {
    app.set('trust proxy', asNumber);
  } else {
    app.set('trust proxy', normalized === 'true');
  }
} else if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
  // Common proxy setups (e.g. Vercel) add X-Forwarded-For.
  app.set('trust proxy', 1);
}

app.use(express.json({ limit: '1mb' }));
app.use(createRateLimiter());

app.get('/health', (_req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
  });
});

app.get('/', (_req, res) => {
  res.status(200).json({
    message: 'Welcome to the QR Redirect System',
  });
});

app.use('/', qrRouter);

app.use(errorHandler);

export default app;
