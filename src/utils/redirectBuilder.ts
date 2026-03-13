import { RestaurantPlan } from '@prisma/client';

type RestaurantLike = {
  id: string;
  slug?: string | null;
  plan: RestaurantPlan | string;
  customDomain?: string | null;
};

export function buildRedirectUrl(restaurant: RestaurantLike, tableCode?: string | null) {
  const plan = String(restaurant.plan || '').toUpperCase();
  let baseUrl: string | null = null;
  const slugOrId = restaurant.slug || restaurant.id;

  if (plan === 'BASIC') {
    baseUrl = `https://bite-menu.dequeue.co.in/${slugOrId}`;
  } else if (plan === 'PRO') {
    baseUrl = `https://bite.dequeue.co.in/${slugOrId}`;
  } else if (plan === 'ENTERPRISE') {
    if (!restaurant.customDomain) return null;
    baseUrl = `https://${restaurant.customDomain}`;
  }

  if (!baseUrl) return null;

  if (tableCode) {
    const sep = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${sep}table=${encodeURIComponent(tableCode)}`;
  }

  return baseUrl;
}
