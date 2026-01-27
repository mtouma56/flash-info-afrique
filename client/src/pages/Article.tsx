import Footer from "@/components/Footer";
import Header from "@/components/Header";
import OptimizedImage from "@/components/OptimizedImage";
import SEO, { calculateReadingTime, extractGeoKeywords, generateEnhancedKeywords } from "@/components/SEO";
import StructuredData from "@/components/StructuredData";
import TableOfContents, { generateContentWithIds } from "@/components/TableOfContents";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useArticle, useArticles } from "@/hooks/useArticles";
import { shareOnFacebook, shareOnLinkedIn, shareOnTwitter, useWebShare } from "@/lib/sharing";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Clock,
  ExternalLink,
  Facebook,
  Linkedin,
  Loader2,
  RefreshCw,
  Share2,
  Twitter,
  WifiOff,
} from "lucide-react";
import { useMemo, useCallback, useState } from "react";
import { Link, useRoute, useLocation } from "wouter";
import NotFound from "./NotFound";

export default function Article() {
  const [, params] = useRoute("/article/:slug");
  const [, setLocation] = useLocation();
  const { article, isLoading, error, errorType, refetch: refetchArticle } = useArticle(params?.slug || "");
  const { articles, categories, isOffline, refetch: refetchArticles } = useArticles();
  const { share, canShare } = useWebShare();
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = useCallback(async () => {
    setIsRetrying(true);
    try {
      await Promise.all([refetchArticle(), refetchArticles()]);
    } finally {
      setIsRetrying(false);
    }
  }, [refetchArticle, refetchArticles]);

  // All hooks must be called before any conditional returns
  // Extract geographic keywords from article content for enhanced SEO
  const geoInfo = useMemo(() => {
    if (!article) return { regions: [], placenames: [], keywords: [] };
    const fullContent = `${article.title} ${article.excerpt} ${article.content}`;
    return extractGeoKeywords(fullContent);
  }, [article]);

  // Generate enhanced keywords with geographic data
  const enhancedKeywords = useMemo(() => {
    if (!article) return "";
    return generateEnhancedKeywords(
      article.tags.join(", "),
      article.tags,
      `${article.title} ${article.excerpt} ${article.content}`
    );
  }, [article]);

  // Category for this article
  const category = useMemo(() => {
    if (!article) return undefined;
    return categories.find((c) => c.id === article.category);
  }, [article, categories]);

  // Formatted date
  const formattedDate = useMemo(() => {
    if (!article) return "";
    return new Date(article.publishedAt).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, [article]);

  // Calculate actual reading time
  const readingTime = useMemo(() => {
    if (!article) return 0;
    return calculateReadingTime(article.content + article.excerpt);
  }, [article]);

  // Generate content with IDs for TOC
  const contentWithIds = useMemo(() => {
    if (!article) return { paragraphs: [] };
    return generateContentWithIds(article.content);
  }, [article]);

  // Articles liés (même catégorie)
  const relatedArticles = useMemo(() => {
    if (!article) return [];
    return articles
      .filter((a) => a.category === article.category && a.id !== article.id)
      .slice(0, 3);
  }, [article, articles]);

  // Article URL for sharing
  const articleUrl = useMemo(() => {
    if (!article) return "";
    return `https://flashinfoafrique.com/article/${article.slug}`;
  }, [article]);

  const handleShare = useCallback(async () => {
    if (!article) return;
    await share({
      title: article.title,
      text: article.excerpt,
      url: articleUrl,
    });
  }, [article, share, articleUrl]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Chargement de l'article...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Distinguish between 404 and network errors
  if (error) {
    if (error === "Article non trouvé") {
      return <NotFound />;
    }
    
    const isNetworkError = errorType === 'network' || errorType === 'timeout' || isOffline;
    const ErrorIcon = isNetworkError ? WifiOff : AlertCircle;
    const errorTitle = isNetworkError ? 'Problème de connexion' : 'Erreur de chargement';
    
    // Network or server error - show retry option
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

  if (!article) {
    return <NotFound />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title={article.title}
        description={article.excerpt}
        keywords={enhancedKeywords}
        image={article.imageUrl}
        imageAlt={`Image illustrant: ${article.title}`}
        url={articleUrl}
        type="article"
        publishedTime={article.publishedAt}
        modifiedTime={article.updatedAt || article.publishedAt}
        author={article.source.name}
        section={category?.name}
        tags={article.tags}
        geoRegions={geoInfo.regions}
        geoPlacenames={geoInfo.placenames}
      />
      <StructuredData article={article} />
      <Header />

      <main className="flex-1">
        {/* Back button */}
        <div className="container py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.history.back()}
            aria-label="Retour à la page précédente"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </div>

        {/* Article Header */}
        <article className="container py-6">
          <div className="max-w-4xl mx-auto">
            {/* Meta */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <Badge
                variant="outline"
                className="font-medium"
                style={{
                  borderColor: category?.color,
                  color: category?.color,
                }}
              >
                {category?.name}
              </Badge>
              <div className="flex items-center text-sm text-muted-foreground font-mono">
                <Calendar className="h-4 w-4 mr-1" aria-hidden="true" />
                <time dateTime={article.publishedAt}>{formattedDate}</time>
              </div>
              <Separator orientation="vertical" className="h-4" />
              <span className="flex items-center text-sm text-muted-foreground">
                <Clock className="h-4 w-4 mr-1" aria-hidden="true" />
                {readingTime} min de lecture
              </span>
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-6 font-['Sora']">
              {article.title}
            </h1>

            {/* Excerpt */}
            <p className="text-xl text-muted-foreground mb-6 leading-relaxed">
              {article.excerpt}
            </p>

            {/* Share buttons */}
            <div className="flex flex-wrap items-center gap-2 mb-4 sm:mb-6">
              <span className="text-sm text-muted-foreground mr-2 w-full sm:w-auto mb-2 sm:mb-0">
                Partager :
              </span>
              {canShare && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleShare}
                  aria-label="Partager cet article"
                  className="h-11 w-11 min-h-[44px] min-w-[44px]"
                >
                  <Share2 className="h-5 w-5" />
                </Button>
              )}
              <Button
                variant="outline"
                size="icon"
                onClick={() => shareOnLinkedIn(articleUrl, article.title)}
                aria-label="Partager sur LinkedIn"
                className="h-11 w-11 min-h-[44px] min-w-[44px]"
              >
                <Linkedin className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => shareOnFacebook(articleUrl)}
                aria-label="Partager sur Facebook"
                className="h-11 w-11 min-h-[44px] min-w-[44px]"
              >
                <Facebook className="h-5 w-5" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => shareOnTwitter(articleUrl, article.title)}
                aria-label="Partager sur Twitter"
                className="h-11 w-11 min-h-[44px] min-w-[44px]"
              >
                <Twitter className="h-5 w-5" />
              </Button>
            </div>

            {/* Featured Image */}
            <div className="relative h-[250px] sm:h-[350px] md:h-[400px] rounded-xl overflow-hidden mb-4 sm:mb-6">
              <OptimizedImage
                src={article.imageUrl}
                alt={`Image illustrant l'article: ${article.title}`}
                className="w-full h-full"
                aspectRatio="16/9"
                priority={true}
                sizes="(max-width: 768px) 100vw, 896px"
              />
            </div>

            {/* Source originale */}
            <Card className="mb-6 border-l-4 border-l-secondary bg-secondary/5">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <ExternalLink className="h-5 w-5 text-secondary mt-1 flex-shrink-0" aria-hidden="true" />
                  <div>
                    <p className="text-sm font-semibold text-foreground mb-2">
                      Article original publié par {article.source.name}
                    </p>
                    <p className="text-sm text-muted-foreground mb-3">
                      Cet article est un résumé d'une publication de{" "}
                      {article.source.name}. Consultez l'article original pour
                      le contenu complet.
                    </p>
                    <a
                      href={article.source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-sm font-medium text-secondary hover:underline"
                    >
                      Lire l'article complet sur {article.source.name}
                      <ArrowLeft className="ml-2 h-4 w-4 rotate-180" aria-hidden="true" />
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Content with optional TOC sidebar */}
            <div className="lg:grid lg:grid-cols-[1fr_220px] lg:gap-8 mb-8">
              {/* Main content */}
              <div className="prose prose-lg prose-gray max-w-none">
                {contentWithIds.paragraphs.map((paragraph, index) => (
                  <p
                    key={index}
                    id={paragraph.id}
                    className="text-foreground leading-relaxed mb-6"
                  >
                    {paragraph.text}
                  </p>
                ))}
              </div>

              {/* Table of Contents sidebar (desktop only) */}
              <aside className="hidden lg:block" aria-label="Table des matières">
                <div className="sticky top-24">
                  <TableOfContents
                    content={article.content}
                    readingTime={readingTime}
                    minReadingTime={5}
                  />
                </div>
              </aside>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-6" role="list" aria-label="Tags de l'article">
              {article.tags.map((tag) => (
                <Badge key={tag} variant="secondary" role="listitem">
                  {tag}
                </Badge>
              ))}
            </div>

            <Separator className="my-6" />

            {/* Share buttons (bottom) */}
            <div className="flex flex-wrap items-center justify-between gap-4 py-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted-foreground w-full sm:w-auto mb-2 sm:mb-0">
                  Partager cet article :
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => shareOnLinkedIn(articleUrl, article.title)}
                  aria-label="Partager sur LinkedIn"
                  className="min-h-[44px] px-4"
                >
                  <Linkedin className="h-4 w-4 mr-2" aria-hidden="true" />
                  LinkedIn
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => shareOnFacebook(articleUrl)}
                  aria-label="Partager sur Facebook"
                  className="min-h-[44px] px-4"
                >
                  <Facebook className="h-4 w-4 mr-2" aria-hidden="true" />
                  Facebook
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => shareOnTwitter(articleUrl, article.title)}
                  aria-label="Partager sur Twitter"
                  className="min-h-[44px] px-4"
                >
                  <Twitter className="h-4 w-4 mr-2" aria-hidden="true" />
                  Twitter
                </Button>
              </div>
            </div>
          </div>
        </article>

        {/* Related Articles */}
        {relatedArticles.length > 0 && (
          <section className="bg-muted/30 py-6 sm:py-8 border-t border-border" aria-labelledby="related-articles-heading">
            <div className="container">
              <h2 id="related-articles-heading" className="text-xl sm:text-2xl font-bold text-foreground mb-4 sm:mb-6 font-['Sora']">
                Articles liés
              </h2>
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
                {relatedArticles.map((relatedArticle) => (
                  <Card
                    key={relatedArticle.id}
                    className="overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <div className="relative h-40 overflow-hidden">
                      <OptimizedImage
                        src={relatedArticle.imageUrl}
                        alt={`Image illustrant: ${relatedArticle.title}`}
                        className="w-full h-full"
                        aspectRatio="16/9"
                        priority={false}
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    </div>
                    <CardContent className="p-4">
                      <h3 className="text-lg font-bold text-foreground mb-2 line-clamp-2">
                        {relatedArticle.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                        {relatedArticle.excerpt}
                      </p>
                      <Link
                        href={`/article/${relatedArticle.slug}`}
                        className="text-sm text-primary hover:underline"
                      >
                        Lire la suite →
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      <Footer />
    </div>
  );
}
