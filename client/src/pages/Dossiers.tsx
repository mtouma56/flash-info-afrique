import Footer from "@/components/Footer";
import Header from "@/components/Header";
import SEO from "@/components/SEO";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useDossiers } from "@/hooks/useDossiers";
import { AlertCircle, Calendar, FileText, FolderOpen, Loader2, RefreshCw, Star, WifiOff } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";

export default function Dossiers() {
  const [, setLocation] = useLocation();
  const { dossiers, isLoading, error, errorType, isOffline, refetch } = useDossiers();
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = useCallback(async () => {
    setIsRetrying(true);
    try {
      await refetch();
    } finally {
      setIsRetrying(false);
    }
  }, [refetch]);

  // Separate featured and regular dossiers
  const { featuredDossiers, regularDossiers } = useMemo(() => {
    const featured = dossiers.filter((d) => d.isFeatured && d.isActive);
    const regular = dossiers.filter((d) => !d.isFeatured && d.isActive);
    return { featuredDossiers: featured, regularDossiers: regular };
  }, [dossiers]);

  // Format date helper
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <SEO
          title="Dossiers d'investigation économique UEMOA"
          description="Découvrez tous nos dossiers d'investigation sur l'actualité économique, financière et réglementaire de la zone UEMOA."
          keywords="dossiers d'investigation, UEMOA, économie, finance, régulation, affaires économiques"
        />
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Chargement des dossiers...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Error handling
  if (error) {
    const isNetworkError = errorType === 'network' || errorType === 'timeout' || isOffline;
    const ErrorIcon = isNetworkError ? WifiOff : AlertCircle;
    const errorTitle = isNetworkError ? 'Problème de connexion' : 'Erreur de chargement';

    return (
      <div className="min-h-screen flex flex-col bg-background">
        <SEO
          title="Dossiers d'investigation économique UEMOA"
          description="Découvrez tous nos dossiers d'investigation sur l'actualité économique, financière et réglementaire de la zone UEMOA."
        />
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <Card className="max-w-md mx-4">
            <CardContent className="pt-6 text-center">
              <ErrorIcon className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-bold text-foreground mb-2">{errorTitle}</h2>
              <p className="text-muted-foreground mb-4">{error}</p>
              {isNetworkError && (
                <p className="text-sm text-muted-foreground mb-4">
                  Vérifiez votre connexion internet et réessayez.
                </p>
              )}
              <div className="flex gap-3 justify-center">
                <Button onClick={handleRetry} variant="default" disabled={isRetrying}>
                  {isRetrying ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  {isRetrying ? 'Chargement...' : 'Réessayer'}
                </Button>
                <Button onClick={() => setLocation("/")} variant="outline">
                  Retour à l'accueil
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const allDossiers = [...featuredDossiers, ...regularDossiers];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="Dossiers d'investigation économique UEMOA"
        description="Découvrez tous nos dossiers d'investigation sur l'actualité économique, financière et réglementaire de la zone UEMOA. Suivez les affaires en cours et les analyses approfondies."
        keywords="dossiers d'investigation, UEMOA, économie, finance, régulation, affaires économiques, investigation économique"
        url="https://flashinfoafrique.com/dossiers"
      />
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/5 py-8 border-b border-border" aria-labelledby="dossiers-title">
          <div className="container">
            <div className="max-w-4xl mx-auto text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-secondary/10 rounded-full">
                  <FolderOpen className="h-10 w-10 text-secondary" />
                </div>
              </div>
              <h1 id="dossiers-title" className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 font-['Sora']">
                Dossiers d'investigation économique
              </h1>
              <p className="text-xl text-muted-foreground mb-6">
                Suivez les affaires économiques et financières importantes de la zone UEMOA. 
                Analyses approfondies, chronologies détaillées et suivi de l'actualité.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Badge variant="outline" className="px-4 py-2">
                  <FileText className="h-4 w-4 mr-2" />
                  {allDossiers.length} dossier{allDossiers.length > 1 ? "s" : ""} actif{allDossiers.length > 1 ? "s" : ""}
                </Badge>
                <Badge variant="outline" className="px-4 py-2">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Investigation en cours
                </Badge>
              </div>
            </div>
          </div>
        </section>

        {/* Dossiers List */}
        <section className="container py-8 sm:py-12" aria-labelledby="dossiers-list-heading">
          {allDossiers.length === 0 ? (
            <Card className="bg-muted/50">
              <CardContent className="p-12 text-center">
                <FolderOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-xl font-bold text-foreground mb-2">
                  Aucun dossier disponible
                </h2>
                <p className="text-muted-foreground">
                  Les dossiers d'investigation seront affichés ici lorsqu'ils seront disponibles.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-8">
              {/* Featured Dossiers */}
              {featuredDossiers.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-6">
                    <Star className="h-5 w-5 text-primary" />
                    <h2 id="dossiers-list-heading" className="text-xl sm:text-2xl font-bold text-foreground font-['Sora']">
                      Dossiers en vedette
                    </h2>
                  </div>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {featuredDossiers.map((dossier) => (
                      <Link key={dossier.id} href={`/dossier/${dossier.slug}`}>
                        <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group">
                          <CardContent className="p-6">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                                    {dossier.title}
                                  </h3>
                                  <Badge variant="default" className="shrink-0">
                                    <Star className="h-3 w-3 mr-1" />
                                    En vedette
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                              {dossier.description}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <FileText className="h-4 w-4" />
                                {dossier.articleIds.length} article{dossier.articleIds.length > 1 ? "s" : ""}
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {formatDate(dossier.updatedAt)}
                              </div>
                            </div>
                            {dossier.timelineEvents.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-border">
                                <p className="text-xs text-muted-foreground">
                                  {dossier.timelineEvents.length} événement{dossier.timelineEvents.length > 1 ? "s" : ""} dans la chronologie
                                </p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Regular Dossiers */}
              {regularDossiers.length > 0 && (
                <div>
                  <h2 className={`text-xl sm:text-2xl font-bold text-foreground mb-6 font-['Sora'] ${featuredDossiers.length > 0 ? 'mt-8' : ''}`}>
                    {featuredDossiers.length > 0 ? 'Tous les dossiers' : 'Dossiers d\'investigation'}
                  </h2>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {regularDossiers.map((dossier) => (
                      <Link key={dossier.id} href={`/dossier/${dossier.slug}`}>
                        <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer group">
                          <CardContent className="p-6">
                            <h3 className="text-lg font-bold text-foreground mb-3 group-hover:text-primary transition-colors line-clamp-2">
                              {dossier.title}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                              {dossier.description}
                            </p>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <FileText className="h-4 w-4" />
                                {dossier.articleIds.length} article{dossier.articleIds.length > 1 ? "s" : ""}
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                {formatDate(dossier.updatedAt)}
                              </div>
                            </div>
                            {dossier.timelineEvents.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-border">
                                <p className="text-xs text-muted-foreground">
                                  {dossier.timelineEvents.length} événement{dossier.timelineEvents.length > 1 ? "s" : ""} dans la chronologie
                                </p>
                              </div>
                            )}
                          </CardContent>
                        </Card>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
