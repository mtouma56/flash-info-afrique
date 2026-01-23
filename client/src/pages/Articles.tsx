import ArticleCard from "@/components/ArticleCard";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import SEO from "@/components/SEO";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useArticles } from "@/hooks/useArticles";
import { AlertCircle, FileText, Loader2, Newspaper, RefreshCw, WifiOff } from "lucide-react";
import { useCallback, useState } from "react";
import { useLocation } from "wouter";

export default function Articles() {
  const [, setLocation] = useLocation();
  const { articles, categories, isLoading, error, errorType, isOffline, refetch } = useArticles();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = useCallback(async () => {
    setIsRetrying(true);
    try {
      await refetch();
    } finally {
      setIsRetrying(false);
    }
  }, [refetch]);

  // Filter articles by category (excluding featured for main listing)
  const filteredArticles = activeCategory
    ? articles.filter((a) => a.category === activeCategory)
    : articles;

  // Sort by date (newest first)
  const sortedArticles = [...filteredArticles].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Chargement des articles...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Handle network errors
  if (error) {
    const isNetworkError = errorType === 'network' || errorType === 'timeout' || isOffline;
    const ErrorIcon = isNetworkError ? WifiOff : AlertCircle;
    const errorTitle = isNetworkError ? 'Problème de connexion' : 'Erreur de chargement';
    
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
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
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title="Tous les articles"
        description="Découvrez tous les articles d'actualité économique et financière de la zone UEMOA sur Flash Info Afrique."
        url="https://flashinfoafrique.com/articles"
      />
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section
          className="py-8 border-b border-border bg-gradient-to-br from-primary/5 to-secondary/5"
        >
          <div className="container">
            <div className="max-w-4xl mx-auto text-center">
              <div
                className="inline-flex items-center justify-center p-3 rounded-full mb-4 bg-primary/10"
              >
                <Newspaper className="h-10 w-10 text-primary" />
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 font-['Sora']">
                Tous les articles
              </h1>
              <p className="text-xl text-muted-foreground">
                Retrouvez l'ensemble de nos articles d'actualité économique et financière de la zone UEMOA
              </p>
            </div>
          </div>
        </section>

        {/* Articles Section */}
        <section className="container py-8 sm:py-12">
          {/* Category filters */}
          <div className="flex flex-wrap gap-2 mb-6 sm:mb-8" role="tablist" aria-label="Filtrer par catégorie">
            <Badge
              variant={activeCategory === null ? "default" : "outline"}
              className="px-4 py-2.5 min-h-[44px] cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors flex items-center"
              onClick={() => setActiveCategory(null)}
              role="tab"
              aria-selected={activeCategory === null}
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && setActiveCategory(null)}
            >
              Toutes ({articles.length})
            </Badge>
            {categories.map((category) => {
              const count = articles.filter((a) => a.category === category.id).length;
              return (
                <Badge
                  key={category.id}
                  variant={activeCategory === category.id ? "default" : "outline"}
                  className="px-4 py-2.5 min-h-[44px] cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors flex items-center"
                  style={
                    activeCategory !== category.id
                      ? { borderColor: category.color, color: category.color }
                      : {}
                  }
                  onClick={() => setActiveCategory(category.id)}
                  role="tab"
                  aria-selected={activeCategory === category.id}
                  tabIndex={0}
                  onKeyDown={(e) => e.key === "Enter" && setActiveCategory(category.id)}
                >
                  {category.name} ({count})
                </Badge>
              );
            })}
          </div>

          {/* Articles count */}
          <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground mb-6 sm:mb-8 font-['Sora']">
            {sortedArticles.length} article{sortedArticles.length > 1 ? "s" : ""}
            {activeCategory && categories.find((c) => c.id === activeCategory) 
              ? ` dans "${categories.find((c) => c.id === activeCategory)?.name}"`
              : ""}
          </h2>

          {/* Articles Grid */}
          {sortedArticles.length > 0 ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6" role="tabpanel">
              {sortedArticles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-foreground mb-2 font-['Sora']">
                Aucun article
              </h2>
              <p className="text-muted-foreground">
                {activeCategory 
                  ? "Il n'y a pas encore d'articles dans cette catégorie."
                  : "Il n'y a pas encore d'articles disponibles."}
              </p>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
