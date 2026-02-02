import { useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useCookieConsent } from "@/contexts/CookieConsentContext";

/**
 * ScrollToTop component that scrolls to the top of the page
 * whenever the route changes. This ensures that when navigating
 * via footer links or any other navigation, the user lands at
 * the top of the new page.
 * 
 * Also handles GA4 page_view tracking for SPA navigation.
 */
export default function ScrollToTop() {
  const [location] = useLocation();
  const { consent } = useCookieConsent();
  const isFirstRender = useRef(true);

  useEffect(() => {
    // Skip scrolling on the first render (initial page load)
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Scroll to the top of the page on route change
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location]);

  // GA4 page_view tracking on route change
  useEffect(() => {
    // Only track if analytics consent is given and gtag is available
    if (consent?.analytics && typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "page_view", {
        page_path: window.location.pathname + window.location.search,
        page_title: document.title,
      });
    }
  }, [location, consent?.analytics]);

  return null;
}
