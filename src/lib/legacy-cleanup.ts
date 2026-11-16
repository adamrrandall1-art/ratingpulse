export function isLegacyTestAddress(addr?: string | null): boolean {
  if (!addr) return false;
  const lower = addr.toLowerCase().trim();
  return (
    lower.includes('1400 broadway') ||
    lower.includes('932 s winton') ||
    lower === 'ny, ny' ||
    lower === 'new york, ny' ||
    lower === 'rochester, ny' ||
    lower === 'rochester, ny 14618' ||
    lower === 'rochester, ny 14604' ||
    lower === '1400 broadway, new york, ny 10018' ||
    lower === '1400 broadway, ny, ny'
  );
}

export function isLegacyTestPlaceId(placeId?: string | null): boolean {
  if (!placeId) return false;
  const trimmed = placeId.trim();
  return (
    trimmed.startsWith('demo_') ||
    trimmed === 'ChIJN1t_tDeuEmsRUsoyG83frY4' ||
    trimmed === 'ChIJawEUC_oN04kRB70LP1wHuPg'
  );
}

export function isLegacyTestReviewUrl(url?: string | null): boolean {
  if (!url) return false;
  return (
    url.includes('Cc5qbA6YaZ6-EBM') ||
    url.includes('ChIJawEUC_oN04kRB70LP1wHuPg') ||
    url.includes('ChIJN1t_tDeuEmsRUsoyG83frY4')
  );
}

export function sanitizeAddress(addr?: string | null): string {
  if (!addr || isLegacyTestAddress(addr)) return '';
  return addr.trim();
}

export function sanitizePlaceId(placeId?: string | null): string {
  if (!placeId || isLegacyTestPlaceId(placeId)) return '';
  return placeId.trim();
}

export function sanitizeReviewUrl(url?: string | null): string {
  if (!url || isLegacyTestReviewUrl(url)) return '';
  return url.trim();
}
