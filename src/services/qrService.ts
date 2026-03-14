import { prisma } from '../lib/prisma';
import { buildRedirectUrl } from '../utils/redirectBuilder';
import { parseQrCode } from '../utils/qrParser';
import { cache } from '../lib/cache';

const CACHE_TTL_SECONDS = 60;

export async function resolveRedirect(code: string, ip?: string, userAgent?: string) {
  const parsed = parseQrCode(code);
  if (!parsed) return null;

  const cacheKey = `qr:${parsed.restaurantCode}`;
  const cached = await cache.get(cacheKey);
  if (cached) {
    const restaurant = JSON.parse(cached);
    const url = buildRedirectUrl(restaurant, parsed.tableCode);
    return url ? { url } : null;
  }

  const restaurant = await prisma.restaurant.findFirst({
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

  if (!restaurant) return null;

  const url = buildRedirectUrl(restaurant, parsed.tableCode);
  if (!url) return null;

  await cache.set(cacheKey, JSON.stringify(restaurant), CACHE_TTL_SECONDS);

  if (process.env.ENABLE_QR_ANALYTICS === '1') {
    // Fire-and-forget to keep redirects fast.
    void logQrScan(restaurant.id, parsed.restaurantCode, parsed.tableCode, ip, userAgent);
  }

  return { url };
}

async function logQrScan(
  restaurantId: string,
  restaurantCode: string,
  tableCode?: string,
  ip?: string,
  userAgent?: string
) {
  try {
    const day = new Date();
    day.setUTCHours(0, 0, 0, 0);

    await prisma.qrScanLog.create({
      data: {
        restaurantId,
        qrCode: restaurantCode,
        tableCode: tableCode || null,
        ip: ip || null,
        userAgent: userAgent || null,
      },
    });

    if (tableCode) {
      await prisma.qrScanDaily.upsert({
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
    } else {
      const updated = await prisma.qrScanDaily.updateMany({
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
        await prisma.qrScanDaily.create({
          data: {
            restaurantId,
            tableCode: null,
            day,
            scanCount: 1,
          },
        });
      }
    }
  } catch (err) {
    // analytics should never block redirects
    console.warn('Failed to log QR scan', err);
  }
}
