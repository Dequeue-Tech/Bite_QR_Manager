export function parseQrCode(code: string): { restaurantCode: string; tableCode?: string } | null {
  if (!code) return null;

  const trimmed = String(code).trim();
  if (!trimmed) return null;

  // Table-level support: restaurantCode-tableCode
  // If multiple hyphens (UUID), take the last segment as table code only when it is short.
  const parts = trimmed.split('-');
  if (parts.length >= 2) {
    const possibleTable = parts[parts.length - 1];
    if (possibleTable && possibleTable.length <= 12) {
      const restaurantCode = parts.slice(0, -1).join('-');
      if (restaurantCode) {
        return { restaurantCode, tableCode: possibleTable };
      }
    }
  }

  return { restaurantCode: trimmed };
}
