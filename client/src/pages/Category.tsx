import ArticleCard from "@/components/ArticleCard";
import PublicLayout from "@/components/PublicLayout";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useArticles } from "@/hooks/useArticles";
import { AlertCircle, FileText, Loader2, RefreshCw, WifiOff } from "lucide-react";
import { useCallback, useState } from "react";
import { useRoute, useLocation } from "wouter";
import NotFound from "./NotFound";

export default function Category() {
  const [, params] = useRoute("/categorie/:slug");
  const [, setLocation] = useLocation();
  const { articles, categories, isLoading, error, errorType, isOffline, refetch } = useArticles();
  const [isRetrying, setIsRetrying] = useState(false);
  
  const category = categories.find((c) => c.slug === params?.slug);

  const handleRetry = useCallback(async () => {
    setIsRetrying(true);
    try {
      await refetch();
    } finally {
      setIsRetrying(false);
    }
  }, [refetch]);

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="flex-1 flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Chargement...</p>
          </div>
        </div>
      </PublicLayout>
    );
  }

  // Handle network errors
  if (error) {
    const isNetworkError = errorType === 'network' || errorType === 'timeout' || isOffline;
    const ErrorIcon = isNetworkError ? WifiOff : AlertCircle;
    const errorTitle = isNetworkError ? 'Problème de connexion' : 'Erreur de chargement';
    
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

  if (!category) {
    return <NotFound />;
  }

  const categoryArticles = articles.filter((a) => a.category === category.id);

  return (
    <PublicLayout>
      <SEO
        title={category.name}
        description={category.description}
        url={`https://flashinfoafrique.com/categorie/${category.slug}`}
      />

      {/* Hero Section */}
        <section
          className="py-6 border-b border-border"
          style={{
            background: `linear-gradient(135deg, ${category.color}10, ${category.color}05)`,
          }}
        >
          <div className="container">
            <div className="max-w-4xl mx-auto text-center">
              <div
                className="inline-flex items-center justify-center p-3 rounded-full mb-4"
                style={{ backgroundColor: `${category.color}15` }}
              >
                <FileText className="h-10 w-10" style={{ color: category.color }} />
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 font-['Sora']">
                {category.name}
              </h1>
              <p className="text-xl text-muted-foreground">{category.description}</p>
            </div>
          </div>
        </section>

        {/* Articles Grid */}
        <section className="container py-6 sm:py-8">
          {categoryArticles.length > 0 ? (
            <>
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground mb-4 sm:mb-6 font-['Sora']">
                {categoryArticles.length} article{categoryArticles.length > 1 ? "s" : ""} dans cette catégorie
              </h2>
              <div className="flex flex-col gap-3 min-w-0">
                {categoryArticles.map((article) => (
                  <ArticleCard key={article.id} article={article} variant="row" />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-foreground mb-2 font-['Sora']">
                Aucun article
              </h2>
              <p className="text-muted-foreground">
                Il n'y a pas encore d'articles dans cette catégorie.
              </p>
            </div>
          )}
        </section>
    </PublicLayout>
  );
}
