/**
 * Smart Links - Generate store URLs for shopping list items
 * Supports: Nigeria, USA, UK, China
 */

export const REGIONS = {
  NIGERIA: 'nigeria',
  USA: 'usa',
  UK: 'uk',
  CHINA: 'china'
};

export const STORES = {
  // Nigeria
  JUMIA: { name: 'Jumia Food', region: REGIONS.NIGERIA, baseUrl: 'https://food.jumia.com.ng' },
  KONGA: { name: 'Konga', region: REGIONS.NIGERIA, baseUrl: 'https://www.konga.com' },

  // USA
  AMAZON_FRESH: { name: 'Amazon Fresh', region: REGIONS.USA, baseUrl: 'https://www.amazon.com' },
  WALMART: { name: 'Walmart', region: REGIONS.USA, baseUrl: 'https://www.walmart.com' },
  INSTACART: { name: 'Instacart', region: REGIONS.USA, baseUrl: 'https://www.instacart.com' },

  // UK
  TESCO: { name: 'Tesco', region: REGIONS.UK, baseUrl: 'https://www.tesco.com' },
  SAINSBURYS: { name: 'Sainsbury\'s', region: REGIONS.UK, baseUrl: 'https://www.sainsburys.co.uk' },
  ASDA: { name: 'Asda', region: REGIONS.UK, baseUrl: 'https://groceries.asda.com' },

  // China
  TAOBAO: { name: 'Taobao', region: REGIONS.CHINA, baseUrl: 'https://s.taobao.com' },
  JD: { name: 'JD.com', region: REGIONS.CHINA, baseUrl: 'https://search.jd.com' },
};

/**
 * Generate search URL for a specific store and item
 */
export function generateStoreLink(store, itemName) {
  const encodedItem = encodeURIComponent(itemName);

  switch (store) {
    // Nigeria
    case 'JUMIA':
      return `${STORES.JUMIA.baseUrl}/search?q=${encodedItem}`;

    case 'KONGA':
      return `${STORES.KONGA.baseUrl}/search?search=${encodedItem}`;

    // USA
    case 'AMAZON_FRESH':
      return `${STORES.AMAZON_FRESH.baseUrl}/s?k=${encodedItem}&i=amazonfresh`;

    case 'WALMART':
      return `${STORES.WALMART.baseUrl}/search?q=${encodedItem}&cat_id=976759`;

    case 'INSTACART':
      return `${STORES.INSTACART.baseUrl}/store/search_v3/${encodedItem}`;

    // UK
    case 'TESCO':
      return `${STORES.TESCO.baseUrl}/groceries/en-GB/search?query=${encodedItem}`;

    case 'SAINSBURYS':
      return `${STORES.SAINSBURYS.baseUrl}/gol-ui/SearchResults/${encodedItem}`;

    case 'ASDA':
      return `${STORES.ASDA.baseUrl}/search/${encodedItem}`;

    // China
    case 'TAOBAO':
      return `${STORES.TAOBAO.baseUrl}/search?q=${encodedItem}`;

    case 'JD':
      return `${STORES.JD.baseUrl}/Search?keyword=${encodedItem}`;

    default:
      return null;
  }
}

/**
 * Get stores for a specific region
 */
export function getStoresForRegion(region) {
  return Object.entries(STORES)
    .filter(([_, store]) => store.region === region)
    .map(([key, store]) => ({
      key,
      ...store
    }));
}

/**
 * Generate all store links for an item based on user's region
 */
export function generateAllStoreLinks(itemName, region) {
  const stores = getStoresForRegion(region);

  return stores.map(store => ({
    store: store.name,
    storeKey: store.key,
    url: generateStoreLink(store.key, itemName)
  }));
}

/**
 * Generate a combined search URL for multiple items
 * Creates a single link to search for all unchecked items
 */
export function generateBulkSearchLink(items, storeKey) {
  const uncheckedItems = items
    .filter(item => !item.checked)
    .map(item => item.name);

  if (uncheckedItems.length === 0) {
    return null;
  }

  // Combine items into a single search query
  const searchQuery = uncheckedItems.join(' ');
  return generateStoreLink(storeKey, searchQuery);
}

/**
 * Detect user's region from browser (fallback: USA)
 * You can enhance this with IP geolocation or user settings
 */
export function detectUserRegion() {
  // Try to detect from timezone
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  if (timezone.includes('Africa/Lagos')) return REGIONS.NIGERIA;
  if (timezone.includes('Europe/London')) return REGIONS.UK;
  if (timezone.includes('Asia/Shanghai') || timezone.includes('Asia/Hong_Kong')) return REGIONS.CHINA;

  // Default to USA
  return REGIONS.USA;
}
