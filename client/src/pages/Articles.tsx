import ArticleCard from "@/components/ArticleCard";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import SEO from "@/components/SEO";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useArticles } from "@/hooks/useArticles";
import { AlertCircle, ChevronLeft, ChevronRight, FileText, Loader2, Newspaper, RefreshCw, WifiOff } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";

const ARTICLES_PER_PAGE = 12;

export default function Articles() {
  const [, setLocation] = useLocation();
  const { articles, categories, isLoading, error, errorType, isOffline, refetch } = useArticles();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

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
  const sortedArticles = useMemo(() => 
    [...filteredArticles].sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    ),
    [filteredArticles]
  );

  // Pagination
  const totalPages = Math.ceil(sortedArticles.length / ARTICLES_PER_PAGE);
  const paginatedArticles = useMemo(() => {
    const start = (currentPage - 1) * ARTICLES_PER_PAGE;
    const end = start + ARTICLES_PER_PAGE;
    return sortedArticles.slice(start, end);
  }, [sortedArticles, currentPage]);

  // Reset to page 1 when category changes
  useEffect(() => {
    setCurrentPage(1);
  }, [activeCategory]);

  // Handle page change with scroll to top
  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    // Scroll to top of articles section
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Generate page numbers to display
  const getPageNumbers = useMemo(() => {
    const pages: (number | 'ellipsis')[] = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    
    // Always show first page
    pages.push(1);
    
    if (currentPage > 3) {
      pages.push('ellipsis');
    }
    
    // Pages around current
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      if (!pages.includes(i)) {
        pages.push(i);
      }
    }
    
    if (currentPage < totalPages - 2) {
      pages.push('ellipsis');
    }
    
    // Always show last page
    if (!pages.includes(totalPages)) {
      pages.push(totalPages);
    }
    
    return pages;
  }, [currentPage, totalPages]);

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
          className="py-6 border-b border-border bg-gradient-to-br from-primary/5 to-secondary/5"
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
        <section className="container py-6 sm:py-8">
          {/* Category filters */}
          <div className="flex flex-wrap gap-2 mb-4 sm:mb-6" role="tablist" aria-label="Filtrer par catégorie">
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
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-foreground font-['Sora']">
              {sortedArticles.length} article{sortedArticles.length > 1 ? "s" : ""}
              {activeCategory && categories.find((c) => c.id === activeCategory) 
                ? ` dans "${categories.find((c) => c.id === activeCategory)?.name}"`
                : ""}
            </h2>
            {totalPages > 1 && (
              <p className="text-sm text-muted-foreground">
                Page {currentPage} sur {totalPages}
              </p>
            )}
          </div>

          {/* Articles Grid */}
          {paginatedArticles.length > 0 ? (
            <>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6" role="tabpanel">
                {paginatedArticles.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <nav 
                  className="flex items-center justify-center gap-1 mt-6 sm:mt-8" 
                  aria-label="Pagination des articles"
                >
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    aria-label="Page précédente"
                    className="h-10 w-10"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  <div className="flex items-center gap-1">
                    {getPageNumbers.map((pageNum, index) => (
                      pageNum === 'ellipsis' ? (
                        <span 
                          key={`ellipsis-${index}`} 
                          className="px-2 text-muted-foreground"
                          aria-hidden="true"
                        >
                          ...
                        </span>
                      ) : (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="icon"
                          onClick={() => handlePageChange(pageNum)}
                          aria-label={`Page ${pageNum}`}
                          aria-current={currentPage === pageNum ? "page" : undefined}
                          className="h-10 w-10"
                        >
                          {pageNum}
                        </Button>
                      )
                    ))}
                  </div>

                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    aria-label="Page suivante"
                    className="h-10 w-10"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </nav>
              )}

              {/* Page info */}
              {totalPages > 1 && (
                <p className="text-center text-sm text-muted-foreground mt-4">
                  Affichage de {(currentPage - 1) * ARTICLES_PER_PAGE + 1} à {Math.min(currentPage * ARTICLES_PER_PAGE, sortedArticles.length)} sur {sortedArticles.length} articles
                </p>
              )}
            </>
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
