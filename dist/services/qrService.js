"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveRedirect = resolveRedirect;
const prisma_1 = require("../lib/prisma");
const redirectBuilder_1 = require("../utils/redirectBuilder");
const qrParser_1 = require("../utils/qrParser");
const cache_1 = require("../lib/cache");
const CACHE_TTL_SECONDS = 60;
async function resolveRedirect(code, ip, userAgent) {
    const parsed = (0, qrParser_1.parseQrCode)(code);
    if (!parsed)
        return null;
    const cacheKey = `qr:${parsed.restaurantCode}`;
    const cached = await cache_1.cache.get(cacheKey);
    if (cached) {
        const restaurant = JSON.parse(cached);
        const url = (0, redirectBuilder_1.buildRedirectUrl)(restaurant, parsed.tableCode);
        return url ? { url } : null;
    }
    const restaurant = await prisma_1.prisma.restaurant.findFirst({
        where: {
            OR: [
                { qrCode: parsed.restaurantCode },
                { id: parsed.restaurantCode },
                { slug: parsed.restaurantCode },
                { subdomain: parsed.restaurantCode },
            ],
        },
        select: {
            id: true,
            name: true,
            plan: true,
            qrCode: true,
            slug: true,
            customDomain: true,
        },
    });
    if (!restaurant)
        return null;
    const url = (0, redirectBuilder_1.buildRedirectUrl)(restaurant, parsed.tableCode);
    if (!url)
        return null;
    await cache_1.cache.set(cacheKey, JSON.stringify(restaurant), CACHE_TTL_SECONDS);
    if (process.env.ENABLE_QR_ANALYTICS === '1') {
        // Fire-and-forget to keep redirects fast.
        void logQrScan(restaurant.id, parsed.restaurantCode, parsed.tableCode, ip, userAgent);
    }
    return { url };
}
async function logQrScan(restaurantId, restaurantCode, tableCode, ip, userAgent) {
    try {
        const day = new Date();
        day.setUTCHours(0, 0, 0, 0);
        await prisma_1.prisma.qrScanLog.create({
            data: {
                restaurantId,
                qrCode: restaurantCode,
                tableCode: tableCode || null,
                ip: ip || null,
                userAgent: userAgent || null,
            },
        });
        if (tableCode) {
            await prisma_1.prisma.qrScanDaily.upsert({
                where: {
                    restaurantId_tableCode_day: {
                        restaurantId,
                        tableCode,
                        day,
                    },
                },
                create: {
                    restaurantId,
                    tableCode,
                    day,
                    scanCount: 1,
                },
                update: {
                    scanCount: { increment: 1 },
                },
            });
        }
        else {
            const updated = await prisma_1.prisma.qrScanDaily.updateMany({
                where: {
                    restaurantId,
                    tableCode: null,
                    day,
                },
                data: {
                    scanCount: { increment: 1 },
                },
            });
            if (updated.count === 0) {
                await prisma_1.prisma.qrScanDaily.create({
                    data: {
                        restaurantId,
                        tableCode: null,
                        day,
                        scanCount: 1,
                    },
                });
            }
        }
    }
    catch (err) {
        // analytics should never block redirects
        console.warn('Failed to log QR scan', err);
    }
}
