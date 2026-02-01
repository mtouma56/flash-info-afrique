import ArticleCard from "@/components/ArticleCard";
import PublicLayout from "@/components/PublicLayout";
import SEO from "@/components/SEO";
import StructuredData, { fidelisFaqItems } from "@/components/StructuredData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useArticles } from "@/hooks/useArticles";
import { useDossier } from "@/hooks/useDossiers";
import { AlertCircle, Calendar, FileText, HelpCircle, Loader2, RefreshCw, Scale, WifiOff } from "lucide-react";
import { useMemo, useCallback, useState } from "react";
import { useRoute, useLocation } from "wouter";
import NotFound from "./NotFound";

export default function Dossier() {
  const [, params] = useRoute("/dossier/:slug");
  const [, setLocation] = useLocation();
  const { dossier, isLoading: isDossierLoading, error, errorType, refetch: refetchDossier } = useDossier(params?.slug || "");
  const { articles, isLoading: isArticlesLoading, isOffline, refetch: refetchArticles } = useArticles();
  const [isRetrying, setIsRetrying] = useState(false);

  const isLoading = isDossierLoading || isArticlesLoading;

  const handleRetry = useCallback(async () => {
    setIsRetrying(true);
    try {
      await Promise.all([refetchDossier(), refetchArticles()]);
    } finally {
      setIsRetrying(false);
    }
  }, [refetchDossier, refetchArticles]);

  // All hooks must be called before any conditional returns
  // Check if this is the FIDELIS dossier for enhanced SEO
  const isFidelisDossier = useMemo(() => {
    if (!dossier) return false;
    return dossier.slug === "fidelis" || dossier.title.toLowerCase().includes("fidelis");
  }, [dossier]);

  // Generate enhanced keywords for FIDELIS dossier
  const enhancedKeywords = useMemo(() => {
    if (!dossier) return "";
    const baseKeywords = `${dossier.title}, UEMOA, actualité économique`;
    if (isFidelisDossier) {
      return `${baseKeywords}, Fidelis Finance Burkina Faso, Fidelis Finance Abidjan, Fidelis Finance Côte d'Ivoire, secret bancaire, Commission Bancaire UMOA, SOGETRA`;
    }
    return baseKeywords;
  }, [dossier, isFidelisDossier]);

  // Enhanced description for FIDELIS dossier
  const enhancedDescription = useMemo(() => {
    if (!dossier) return "";
    if (isFidelisDossier) {
      return `${dossier.description} Suivez l'affaire FIDELIS Finance Burkina Faso accusée de violation du secret bancaire en Côte d'Ivoire (Abidjan). Premier cas pénal dans l'UEMOA.`;
    }
    return dossier.description;
  }, [dossier, isFidelisDossier]);

  // Get articles associated with this dossier
  const dossierArticles = useMemo(() => {
    if (!dossier) return [];
    return articles.filter((a) => 
      dossier.articleIds.includes(a.id) || 
      a.tags.some(tag => dossier.title.toLowerCase().includes(tag.toLowerCase()))
    );
  }, [dossier, articles]);

  // Format the last update date
  const lastUpdate = useMemo(() => {
    if (!dossier) return "";
    return new Date(dossier.updatedAt).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
    });
  }, [dossier]);

  // FAQ items for FIDELIS dossier
  const faqItems = isFidelisDossier ? fidelisFaqItems : undefined;

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="flex-1 flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Chargement du dossier...</p>
          </div>
        </div>
      </PublicLayout>
    );
  }

  // Distinguish between 404 and network errors
  if (error) {
    if (error === "Dossier non trouvé") {
      return <NotFound />;
    }
    
    const isNetworkError = errorType === 'network' || errorType === 'timeout' || isOffline;
    const ErrorIcon = isNetworkError ? WifiOff : AlertCircle;
    const errorTitle = isNetworkError ? 'Problème de connexion' : 'Erreur de chargement';
    
    // Network or server error - show retry option
    return (
      <PublicLayout>
        <div className="flex-1 flex items-center justify-center py-12">
          <Card className="max-w-md mx-4">
            <CardContent className="pt-6 text-center">
              <ErrorIcon className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h2 className="text-xl font-bold text-foreground mb-2">
                {errorTitle}
              </h2>
              <p className="text-muted-foreground mb-4">
                {error}
              </p>
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
        </div>
      </PublicLayout>
    );
  }

  if (!dossier) {
    return <NotFound />;
  }

  return (
    <PublicLayout>
      <SEO
        title={dossier.title}
        description={enhancedDescription}
        keywords={enhancedKeywords}
        url={`https://flashinfoafrique.com/dossier/${dossier.slug}`}
        geoRegions={isFidelisDossier ? ["CI", "BF"] : []}
        geoPlacenames={isFidelisDossier ? ["Abidjan", "Ouagadougou"] : []}
      />
      <StructuredData dossier={dossier} faqItems={faqItems} />
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/5 py-6 border-b border-border" aria-labelledby="dossier-title">
          <div className="container">
            <div className="max-w-4xl mx-auto text-center">
              <div className="flex justify-center mb-4">
                <div className="p-3 bg-secondary/10 rounded-full">
                  <AlertCircle className="h-10 w-10 text-secondary" />
                </div>
              </div>
              <h1 id="dossier-title" className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 font-['Sora']">
                {dossier.title}
              </h1>
              <p className="text-xl text-muted-foreground mb-6">
                {dossier.description}
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Badge variant="outline" className="px-4 py-2">
                  <Scale className="h-4 w-4 mr-2" />
                  Dossier en cours
                </Badge>
                <Badge variant="outline" className="px-4 py-2">
                  <FileText className="h-4 w-4 mr-2" />
                  {dossierArticles.length} article{dossierArticles.length > 1 ? "s" : ""} publié{dossierArticles.length > 1 ? "s" : ""}
                </Badge>
                <Badge variant="outline" className="px-4 py-2">
                  <Calendar className="h-4 w-4 mr-2" />
                  Dernière mise à jour : {lastUpdate}
                </Badge>
              </div>
            </div>
          </div>
        </section>

        {/* Chronologie interactive */}
        {dossier.timelineEvents.length > 0 && (
          <section className="bg-muted/30 py-8">
            <div className="container">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-6 text-center font-['Sora']">
                Chronologie des événements
              </h2>
              <div className="max-w-4xl mx-auto">
                <div className="relative">
                  {/* Ligne verticale */}
                  <div className="absolute left-4 sm:left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-secondary to-accent" />

                  {/* Événements */}
                  <div className="space-y-6 sm:space-y-8">
                    {dossier.timelineEvents.map((event, index) => {
                      const date = new Date(event.date);
                      const formattedDate = date.toLocaleDateString("fr-FR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      });

                      return (
                        <div key={event.id || index} className="relative pl-12 sm:pl-20">
                          {/* Point sur la ligne */}
                          <div className="absolute left-2 sm:left-6 top-2 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-primary border-4 border-background shadow-lg" />

                          {/* Date */}
                          <div className="absolute left-0 top-0 text-[10px] sm:text-xs font-mono text-muted-foreground hidden sm:block">
                            {event.date}
                          </div>

                          {/* Contenu */}
                          <Card className="hover:shadow-lg transition-shadow">
                            <CardContent className="p-4 sm:p-5">
                              <p className="text-xs text-muted-foreground font-mono sm:hidden mb-2">
                                {formattedDate}
                              </p>
                              <h3 className="text-base sm:text-lg font-bold text-foreground mb-2">
                                {event.title}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {event.description}
                              </p>
                              <p className="text-xs text-muted-foreground mt-2 font-mono hidden sm:block">
                                {formattedDate}
                              </p>
                            </CardContent>
                          </Card>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Tous les articles */}
        <section className="container py-6 sm:py-8">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground mb-4 sm:mb-6 font-['Sora']">
            Tous les articles ({dossierArticles.length})
          </h2>
          {dossierArticles.length > 0 ? (
            <div className="flex flex-col gap-3 min-w-0">
              {dossierArticles.map((article) => (
                <ArticleCard key={article.id} article={article} variant="row" />
              ))}
            </div>
          ) : (
            <Card className="bg-muted/50">
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Aucun article associé à ce dossier pour le moment.
                </p>
              </CardContent>
            </Card>
          )}
        </section>

        {/* FAQ Section for FIDELIS dossier */}
        {isFidelisDossier && faqItems && (
          <section className="bg-muted/30 py-6 sm:py-8" aria-labelledby="faq-heading">
            <div className="container">
              <div className="max-w-4xl mx-auto">
                <div className="flex items-start sm:items-center gap-3 mb-4 sm:mb-6">
                  <HelpCircle className="h-6 w-6 text-primary" aria-hidden="true" />
                  <h2 id="faq-heading" className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground font-['Sora']">
                    Questions fréquentes sur FIDELIS Finance
                  </h2>
                </div>
                <div className="space-y-4">
                  {faqItems.map((item, index) => (
                    <Card key={index} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <h3 className="text-lg font-semibold text-foreground mb-3">
                          {item.question}
                        </h3>
                        <p className="text-muted-foreground leading-relaxed">
                          {item.answer}
                        </p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Disclaimer */}
        <section className="container py-6">
          <Card className="bg-muted/50 border-dashed">
            <CardContent className="p-6 text-center">
              <p className="text-sm text-muted-foreground">
                <strong>Disclaimer :</strong> Flash Info Afrique agrège et
                analyse l'information publique disponible sur ce dossier. Nous
                ne représentons aucune partie et maintenons une stricte
                neutralité éditoriale. Les personnes et entités mentionnées
                sont présumées innocentes.
              </p>
            </CardContent>
          </Card>
        </section>
    </PublicLayout>
  );
}
