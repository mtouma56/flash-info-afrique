import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

const STORAGE_KEY = "cookie_consent";
const CONSENT_VERSION = 1; // Bump this to force re-consent when policy changes

export interface ConsentPreferences {
  analytics: boolean;
  preferences: boolean;
}

interface StoredConsent extends ConsentPreferences {
  timestamp: string;
  version: number;
}

interface CookieConsentContextType {
  /** Whether the consent banner should be shown */
  showBanner: boolean;
  /** Current consent preferences (null if not yet decided) */
  consent: ConsentPreferences | null;
  /** Accept all optional cookies */
  acceptAll: () => void;
  /** Reject all optional cookies */
  rejectAll: () => void;
  /** Set custom preferences */
  setPreferences: (prefs: ConsentPreferences) => void;
  /** Reset consent (for testing or settings page) */
  resetConsent: () => void;
}

const CookieConsentContext = createContext<CookieConsentContextType | undefined>(undefined);

function loadStoredConsent(): StoredConsent | null {
  if (typeof window === "undefined") return null;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return null;
    
    const parsed = JSON.parse(stored) as StoredConsent;
    
    // Check version - if policy changed, require new consent
    if (parsed.version !== CONSENT_VERSION) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    
    return parsed;
  } catch {
    return null;
  }
}

function saveConsent(prefs: ConsentPreferences): void {
  const stored: StoredConsent = {
    ...prefs,
    timestamp: new Date().toISOString(),
    version: CONSENT_VERSION,
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
}

function loadUmamiScript(): void {
  // Prevent loading twice
  if (document.getElementById("umami-script")) return;
  
  const endpoint = import.meta.env.VITE_ANALYTICS_ENDPOINT;
  const websiteId = import.meta.env.VITE_ANALYTICS_WEBSITE_ID;
  
  // Only load if both variables are set and valid
  if (
    endpoint &&
    websiteId &&
    typeof endpoint === "string" &&
    typeof websiteId === "string" &&
    endpoint.trim() !== "" &&
    websiteId.trim() !== ""
  ) {
    const script = document.createElement("script");
    script.id = "umami-script";
    script.defer = true;
    script.src = `${endpoint}/umami`;
    script.setAttribute("data-website-id", websiteId);
    document.head.appendChild(script);
  }
}

interface CookieConsentProviderProps {
  children: React.ReactNode;
}

export function CookieConsentProvider({ children }: CookieConsentProviderProps) {
  const [consent, setConsent] = useState<ConsentPreferences | null>(() => {
    const stored = loadStoredConsent();
    return stored ? { analytics: stored.analytics, preferences: stored.preferences } : null;
  });

  const [showBanner, setShowBanner] = useState<boolean>(() => {
    return loadStoredConsent() === null;
  });

  // Load Umami when analytics consent is granted
  useEffect(() => {
    if (consent?.analytics) {
      loadUmamiScript();
    }
  }, [consent?.analytics]);

  const acceptAll = useCallback(() => {
    const prefs: ConsentPreferences = { analytics: true, preferences: true };
    saveConsent(prefs);
    setConsent(prefs);
    setShowBanner(false);
  }, []);

  const rejectAll = useCallback(() => {
    const prefs: ConsentPreferences = { analytics: false, preferences: false };
    saveConsent(prefs);
    setConsent(prefs);
    setShowBanner(false);
  }, []);

  const setPreferences = useCallback((prefs: ConsentPreferences) => {
    saveConsent(prefs);
    setConsent(prefs);
    setShowBanner(false);
  }, []);

  const resetConsent = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setConsent(null);
    setShowBanner(true);
  }, []);

  return (
    <CookieConsentContext.Provider
      value={{
        showBanner,
        consent,
        acceptAll,
        rejectAll,
        setPreferences,
        resetConsent,
      }}
    >
      {children}
    </CookieConsentContext.Provider>
  );
}

export function useCookieConsent() {
  const context = useContext(CookieConsentContext);
  if (!context) {
    throw new Error("useCookieConsent must be used within CookieConsentProvider");
  }
  return context;
}
