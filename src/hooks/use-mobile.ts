
import { useState, useEffect } from "react";

/**
 * Custom hook for responsive design with media queries
 * @param query Media query string e.g. '(max-width: 768px)'
 * @returns Boolean indicating if the media query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);
  
  useEffect(() => {
    // Initialize with current match state
    const media = window.matchMedia(query);
    setMatches(media.matches);
    
    // Create a handler function for changes
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches);
    
    // Add event listener
    media.addEventListener("change", handler);
    
    // Clean up on unmount
    return () => media.removeEventListener("change", handler);
  }, [query]);
  
  return matches;
}

/**
 * Custom hook to detect mobile devices based on a width breakpoint
 * @returns Boolean indicating if the current viewport is mobile-sized
 */
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 767px)');
}
