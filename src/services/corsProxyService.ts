
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

// Track which proxies are working and which have failed
let proxyStatus: Record<string, { working: boolean, lastFailed?: number }> = {};

// Initialize status for each proxy
CORS_PROXIES.forEach(proxy => {
  proxyStatus[proxy] = { working: true };
});

/**
 * Get the current CORS proxy to use
 * @returns The URL for the active CORS proxy
 */
export const getActiveProxy = (): string => {
  // Find the first working proxy
  const workingProxies = CORS_PROXIES.filter(proxy => 
    proxyStatus[proxy].working || 
    (proxyStatus[proxy].lastFailed && Date.now() - proxyStatus[proxy].lastFailed > 5 * 60 * 1000) // Retry failed proxies after 5 minutes
  );
  
  // If all proxies failed, reset and try the first one again
  if (workingProxies.length === 0) {
    console.warn("All proxies have failed, resetting and trying the first one");
    CORS_PROXIES.forEach(proxy => {
      proxyStatus[proxy] = { working: true };
    });
    return CORS_PROXIES[0];
  }
  
  return workingProxies[0];
};

/**
 * Mark a proxy as failed
 * @param proxy The proxy URL that failed
 */
export const markProxyFailed = (proxy: string): void => {
  if (proxyStatus[proxy]) {
    proxyStatus[proxy].working = false;
    proxyStatus[proxy].lastFailed = Date.now();
    console.warn(`Marked proxy as failed: ${proxy}`);
  }
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
  // Try each proxy until one works
  for (let i = 0; i < CORS_PROXIES.length; i++) {
    const proxy = getActiveProxy();
    const proxiedUrl = `${proxy}${encodeURIComponent(url)}`;
    console.log(`Making proxied request to ${url} via ${proxiedUrl}`);
    
    try {
      const response = await fetch(proxiedUrl, {
        ...options,
        // Make sure credentials are omitted for cross-origin requests
        credentials: 'omit',
        // Some proxies need these headers modified
        headers: {
          ...options.headers,
          'x-requested-with': 'XMLHttpRequest'
        }
      });
      
      // If successful, return the response
      if (response.ok) {
        return response;
      } else {
        console.warn(`Proxy ${proxy} returned status ${response.status}, trying next proxy`);
        markProxyFailed(proxy);
      }
    } catch (error) {
      console.error(`Proxy fetch error for ${url} with proxy ${proxy}:`, error);
      markProxyFailed(proxy);
    }
  }
  
  // If all proxies failed
  throw new Error(`Failed to fetch ${url} through any CORS proxy`);
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
    'api.blockchair.com',
    'btc.com',
    'api.btc.com'
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
  // Always use proxy for blockchain info APIs due to consistent CORS issues
  if (shouldUseProxy(url)) {
    return await proxyFetch(url, options);
  } else {
    try {
      return await fetch(url, options);
    } catch (error) {
      console.warn(`Direct fetch failed, trying with proxy: ${error}`);
      return await proxyFetch(url, options);
    }
  }
};
