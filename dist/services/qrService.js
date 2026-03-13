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
    await cache_1.cache.set(cacheKey, JSON.stringify(restaurant), CACHE_TTL_SECONDS);
    if (process.env.ENABLE_QR_ANALYTICS === '1') {
        try {
            const day = new Date();
            day.setUTCHours(0, 0, 0, 0);
            await prisma_1.prisma.qrScanLog.create({
                data: {
                    restaurantId: restaurant.id,
                    qrCode: parsed.restaurantCode,
                    tableCode: parsed.tableCode || null,
                    ip: ip || null,
                    userAgent: userAgent || null,
                },
            });
            if (parsed.tableCode) {
                await prisma_1.prisma.qrScanDaily.upsert({
                    where: {
                        restaurantId_tableCode_day: {
                            restaurantId: restaurant.id,
                            tableCode: parsed.tableCode,
                            day,
                        },
                    },
                    create: {
                        restaurantId: restaurant.id,
                        tableCode: parsed.tableCode,
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
                        restaurantId: restaurant.id,
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
                            restaurantId: restaurant.id,
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
    const url = (0, redirectBuilder_1.buildRedirectUrl)(restaurant, parsed.tableCode);
    return url ? { url } : null;
}
