import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useCookieConsent, type ConsentPreferences } from "@/contexts/CookieConsentContext";
import { Cookie, Settings } from "lucide-react";

export default function CookieConsent() {
  const { showBanner, acceptAll, rejectAll, setPreferences } = useCookieConsent();
  const [showSettings, setShowSettings] = useState(false);
  const [customPrefs, setCustomPrefs] = useState<ConsentPreferences>({
    analytics: false,
    preferences: true,
  });

  if (!showBanner) {
    return null;
  }

  const handleSaveCustom = () => {
    setPreferences(customPrefs);
    setShowSettings(false);
  };

  return (
    <>
      {/* Cookie Banner - Fixed at bottom */}
      <div
        role="dialog"
        aria-label="Gestion des cookies"
        aria-describedby="cookie-banner-description"
        className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background/95 backdrop-blur-sm shadow-lg"
      >
        <div className="container py-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            {/* Text content */}
            <div className="flex items-start gap-3 flex-1">
              <Cookie className="h-5 w-5 text-primary mt-0.5 shrink-0" aria-hidden="true" />
              <div className="space-y-1">
                <p id="cookie-banner-description" className="text-sm text-foreground">
                  Nous utilisons des cookies pour améliorer votre expérience et analyser le trafic.
                </p>
                <p className="text-xs text-muted-foreground">
                  Consultez notre{" "}
                  <Link
                    href="/confidentialite"
                    className="underline underline-offset-2 hover:text-foreground transition-colors"
                  >
                    politique de confidentialité
                  </Link>{" "}
                  pour en savoir plus.
                </p>
              </div>
            </div>

            {/* Action buttons - Equal prominence as required by CNIL */}
            <div className="flex flex-col sm:flex-row gap-2 sm:items-center shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(true)}
                className="order-3 sm:order-1"
              >
                <Settings className="h-4 w-4 mr-1.5" aria-hidden="true" />
                Personnaliser
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={rejectAll}
                className="order-2"
              >
                Tout refuser
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={acceptAll}
                className="order-1 sm:order-3"
              >
                Tout accepter
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Settings Dialog */}
      <Dialog open={showSettings} onOpenChange={setShowSettings}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Paramètres des cookies</DialogTitle>
            <DialogDescription>
              Choisissez les cookies que vous acceptez. Les cookies essentiels sont toujours actifs.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Essential cookies - Always on */}
            <div className="flex items-center justify-between gap-4 p-3 rounded-lg bg-muted/50">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Cookies essentiels</p>
                <p className="text-xs text-muted-foreground">
                  Nécessaires au fonctionnement du site (authentification, sécurité).
                </p>
              </div>
              <Switch checked disabled aria-label="Cookies essentiels (toujours actifs)" />
            </div>

            {/* Preferences cookies */}
            <div className="flex items-center justify-between gap-4 p-3 rounded-lg border">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Cookies de préférences</p>
                <p className="text-xs text-muted-foreground">
                  Mémorisent vos préférences (thème, langue).
                </p>
              </div>
              <Switch
                checked={customPrefs.preferences}
                onCheckedChange={(checked) =>
                  setCustomPrefs((prev) => ({ ...prev, preferences: checked }))
                }
                aria-label="Cookies de préférences"
              />
            </div>

            {/* Analytics cookies */}
            <div className="flex items-center justify-between gap-4 p-3 rounded-lg border">
              <div className="space-y-0.5">
                <p className="text-sm font-medium">Cookies analytiques</p>
                <p className="text-xs text-muted-foreground">
                  Nous aident à comprendre comment le site est utilisé (Umami Analytics).
                </p>
              </div>
              <Switch
                checked={customPrefs.analytics}
                onCheckedChange={(checked) =>
                  setCustomPrefs((prev) => ({ ...prev, analytics: checked }))
                }
                aria-label="Cookies analytiques"
              />
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setCustomPrefs({ analytics: false, preferences: false });
                setPreferences({ analytics: false, preferences: false });
                setShowSettings(false);
              }}
              className="w-full sm:w-auto"
            >
              Tout refuser
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setCustomPrefs({ analytics: true, preferences: true });
                setPreferences({ analytics: true, preferences: true });
                setShowSettings(false);
              }}
              className="w-full sm:w-auto"
            >
              Tout accepter
            </Button>
            <Button onClick={handleSaveCustom} className="w-full sm:w-auto">
              Enregistrer mes choix
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
