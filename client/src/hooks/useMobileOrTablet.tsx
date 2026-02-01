import * as React from "react";

// Breakpoint for mobile/tablet detection
// Anything below 1024px is considered mobile/tablet
const MOBILE_TABLET_BREAKPOINT = 1024;

/**
 * Hook to detect if the current device is a mobile or tablet.
 * Uses viewport width to determine device type.
 * 
 * @returns true if viewport width is less than 1024px
 */
export function useIsMobileOrTablet() {
  const [isMobileOrTablet, setIsMobileOrTablet] = React.useState<boolean>(() => {
    // Initialize with current viewport width if available (avoids flash)
    if (typeof window !== "undefined") {
      return window.innerWidth < MOBILE_TABLET_BREAKPOINT;
    }
    return false;
  });

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_TABLET_BREAKPOINT - 1}px)`);
    
    const onChange = () => {
      setIsMobileOrTablet(window.innerWidth < MOBILE_TABLET_BREAKPOINT);
    };
    
    // Set initial value
    setIsMobileOrTablet(window.innerWidth < MOBILE_TABLET_BREAKPOINT);
    
    // Listen for changes
    mql.addEventListener("change", onChange);
    
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isMobileOrTablet;
}

/**
 * Hook to detect if the current device is specifically a mobile phone.
 * Uses viewport width to determine device type.
 * 
 * @returns true if viewport width is less than 768px
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(() => {
    if (typeof window !== "undefined") {
      return window.innerWidth < 768;
    }
    return false;
  });

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: 767px)`);
    
    const onChange = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    setIsMobile(window.innerWidth < 768);
    mql.addEventListener("change", onChange);
    
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isMobile;
}

/**
 * Hook to detect if the current device is specifically a tablet.
 * 
 * @returns true if viewport width is between 768px and 1023px
 */
export function useIsTablet() {
  const [isTablet, setIsTablet] = React.useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const width = window.innerWidth;
      return width >= 768 && width < MOBILE_TABLET_BREAKPOINT;
    }
    return false;
  });

  React.useEffect(() => {
    const checkTablet = () => {
      const width = window.innerWidth;
      setIsTablet(width >= 768 && width < MOBILE_TABLET_BREAKPOINT);
    };
    
    checkTablet();
    window.addEventListener("resize", checkTablet);
    
    return () => window.removeEventListener("resize", checkTablet);
  }, []);

  return isTablet;
}
