"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleQrRedirect = handleQrRedirect;
const qrService_1 = require("../services/qrService");
async function handleQrRedirect(req, res, next) {
    try {
        const code = req.params['code'];
        const result = await (0, qrService_1.resolveRedirect)(code, req.ip, req.get('user-agent') || undefined);
        if (!result) {
            return res.status(404).send('Invalid QR');
        }
        return res.redirect(302, result.url);
    }
    catch (err) {
        return next(err);
    }
}
