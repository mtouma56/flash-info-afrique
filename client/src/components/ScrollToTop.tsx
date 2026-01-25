import { useEffect, useRef } from "react";
import { useLocation } from "wouter";

/**
 * ScrollToTop component that scrolls to the top of the page
 * whenever the route changes. This ensures that when navigating
 * via footer links or any other navigation, the user lands at
 * the top of the new page.
 */
export default function ScrollToTop() {
  const [location] = useLocation();
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

  return null;
}
