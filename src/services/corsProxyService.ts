
/**
 * Service for handling CORS issues when accessing blockchain APIs
 */

/**
 * List of CORS proxy services that can be used
 */
const CORS_PROXIES = [
  'https://corsproxy.io/?',
  'https://api.allorigins.win/raw?url=',
  'https://cors-anywhere.herokuapp.com/',
  'https://crossorigin.me/',
  'https://thingproxy.freeboard.io/fetch/'
];

/**
 * Get the current CORS proxy to use
 * @returns The URL for the active CORS proxy
 */
export const getActiveProxy = (): string => {
  // Use the first proxy by default, but could be made configurable
  return CORS_PROXIES[0];
};

/**
 * Wrap a URL with a CORS proxy
 * @param url The URL to access through the proxy
 * @returns The proxied URL
 */
export const proxyUrl = (url: string): string => {
  const proxy = getActiveProxy();
  // Ensure URL is properly encoded for the proxy
  const encodedUrl = encodeURIComponent(url);
  return `${proxy}${encodedUrl}`;
};

/**
 * Make a fetch request through a CORS proxy
 * @param url URL to fetch
 * @param options Fetch options
 * @returns Response from the fetch request
 */
export const proxyFetch = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  const proxiedUrl = proxyUrl(url);
  console.log(`Making proxied request to ${url} via ${proxiedUrl}`);
  
  try {
    return await fetch(proxiedUrl, {
      ...options,
      // Make sure credentials are omitted for cross-origin requests
      credentials: 'omit',
      // Some proxies need these headers modified
      headers: {
        ...options.headers,
        'x-requested-with': 'XMLHttpRequest'
      }
    });
  } catch (error) {
    console.error(`Proxy fetch error for ${url}:`, error);
    throw new Error(`Failed to fetch ${url} through CORS proxy: ${error}`);
  }
};

/**
 * Check if we should use a proxy for a given URL based on known CORS issues
 * @param url URL to check
 * @returns Boolean indicating if proxy should be used
 */
export const shouldUseProxy = (url: string): boolean => {
  // List of domains known to have CORS issues
  const corsProblematicDomains = [
    'blockchain.info',
    'api.blockchain.info',
    'blockchair.com',
    'api.blockchair.com'
  ];
  
  // Check if the URL contains any of the problematic domains
  return corsProblematicDomains.some(domain => url.includes(domain));
};

/**
 * Make a fetch request, using a CORS proxy if necessary
 * @param url URL to fetch
 * @param options Fetch options
 * @returns Response from the fetch request
 */
export const safeFetch = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  if (shouldUseProxy(url)) {
    return await proxyFetch(url, options);
  } else {
    return await fetch(url, options);
  }
};
