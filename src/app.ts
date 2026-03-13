import express from 'express';
import { createRateLimiter } from './middleware/rateLimit';
import { errorHandler } from './middleware/errorHandler';
import qrRouter from './routes/qr';

const app = express();

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
