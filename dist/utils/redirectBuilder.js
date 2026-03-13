"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.buildRedirectUrl = buildRedirectUrl;
function buildRedirectUrl(restaurant, tableCode) {
    const plan = String(restaurant.plan || '').toUpperCase();
    let baseUrl = null;
    const slugOrId = restaurant.slug || restaurant.id;
    if (plan === 'BASIC') {
        baseUrl = `https://bite-menu.dequeue.co.in/${slugOrId}`;
    }
    else if (plan === 'PRO') {
        baseUrl = `https://bite.dequeue.co.in/${slugOrId}`;
    }
    else if (plan === 'ENTERPRISE') {
        if (!restaurant.customDomain)
            return null;
        baseUrl = `https://${restaurant.customDomain}`;
    }
    if (!baseUrl)
        return null;
    if (tableCode) {
        const sep = baseUrl.includes('?') ? '&' : '?';
        return `${baseUrl}${sep}table=${encodeURIComponent(tableCode)}`;
    }
    return baseUrl;
}
