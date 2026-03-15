"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const rateLimit_1 = require("./middleware/rateLimit");
const errorHandler_1 = require("./middleware/errorHandler");
const qr_1 = __importDefault(require("./routes/qr"));
const app = (0, express_1.default)();
const trustProxyEnv = process.env.TRUST_PROXY;
if (trustProxyEnv !== undefined) {
    const normalized = trustProxyEnv.trim().toLowerCase();
    const asNumber = Number(normalized);
    if (!Number.isNaN(asNumber) && normalized !== '') {
        app.set('trust proxy', asNumber);
    }
    else {
        app.set('trust proxy', normalized === 'true');
    }
}
else if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
    // Common proxy setups (e.g. Vercel) add X-Forwarded-For.
    app.set('trust proxy', 1);
}
app.use(express_1.default.json({ limit: '1mb' }));
app.use((0, rateLimit_1.createRateLimiter)());
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
app.use('/', qr_1.default);
app.use(errorHandler_1.errorHandler);
exports.default = app;
