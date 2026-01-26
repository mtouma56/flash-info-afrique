import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, FolderOpen, Home } from "lucide-react";
import { Helmet } from "react-helmet-async";
import { Link, useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  const handleGoHome = () => {
    setLocation("/");
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <SEO
        title="Page non trouvée"
        description="La page que vous recherchez n'existe pas ou a été déplacée."
        url="https://flashinfoafrique.com/"
      />
      {/* Keep prerender-status-code for SSR/prerendering services to return proper 404 status */}
      <Helmet>
        <meta name="prerender-status-code" content="404" />
      </Helmet>
      <Card className="w-full max-w-lg mx-4 shadow-lg border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
        <CardContent className="pt-8 pb-8 text-center">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-red-100 dark:bg-red-900/30 rounded-full animate-pulse" />
              <AlertCircle className="relative h-16 w-16 text-red-500" aria-hidden="true" />
            </div>
          </div>

          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-2 font-['Sora']">404</h1>

          <h2 className="text-xl font-semibold text-slate-700 dark:text-slate-300 mb-4">
            Page non trouvée
          </h2>

          <p className="text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
            Désolé, la page que vous recherchez n'existe pas.
            <br />
            Elle a peut-être été déplacée ou supprimée.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={handleGoHome}
              className="bg-primary hover:bg-primary/90 text-white px-6 py-2.5 rounded-lg transition-all duration-200 shadow-md hover:shadow-lg"
            >
              <Home className="w-4 h-4 mr-2" aria-hidden="true" />
              Retour à l'accueil
            </Button>
            <Link href="/dossiers">
              <Button
                variant="outline"
                className="px-6 py-2.5 rounded-lg transition-all duration-200"
              >
                <FolderOpen className="w-4 h-4 mr-2" aria-hidden="true" />
                Voir les dossiers
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
