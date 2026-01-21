import Footer from "@/components/Footer";
import Header from "@/components/Header";
import SEO, { calculateReadingTime } from "@/components/SEO";
import StructuredData from "@/components/StructuredData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useArticle, useArticles } from "@/hooks/useArticles";
import { shareOnFacebook, shareOnLinkedIn, shareOnTwitter, useWebShare } from "@/lib/sharing";
import {
  ArrowLeft,
  Calendar,
  Clock,
  ExternalLink,
  Facebook,
  Linkedin,
  Loader2,
  Share2,
  Twitter,
} from "lucide-react";
import { Link, useRoute } from "wouter";
import NotFound from "./NotFound";

export default function Article() {
  const [, params] = useRoute("/article/:slug");
  const { article, isLoading, error } = useArticle(params?.slug || "");
  const { articles, categories } = useArticles();
  const { share, canShare } = useWebShare();

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

  if (error || !article) {
    return <NotFound />;
  }

  const category = categories.find((c) => c.id === article.category);
  const formattedDate = new Date(article.publishedAt).toLocaleDateString(
    "fr-FR",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );

  // Calculate actual reading time
  const readingTime = calculateReadingTime(article.content + article.excerpt);

  // Articles liés (même catégorie) - use articles from useArticles hook
  const relatedArticles = articles
    .filter((a) => a.category === article.category && a.id !== article.id)
    .slice(0, 3);

  const articleUrl = `https://flashinfoafrique.com/article/${article.slug}`;

  const handleShare = async () => {
    await share({
      title: article.title,
      text: article.excerpt,
      url: articleUrl,
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title={article.title}
        description={article.excerpt}
        keywords={article.tags.join(", ")}
        image={article.imageUrl}
        url={articleUrl}
        type="article"
        publishedTime={article.publishedAt}
        author={article.source.name}
        section={category?.name}
        tags={article.tags}
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
        <article className="container py-8">
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
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 font-['Sora']">
              {article.title}
            </h1>

            {/* Excerpt */}
            <p className="text-xl text-muted-foreground mb-6 leading-relaxed">
              {article.excerpt}
            </p>

            {/* Share buttons */}
            <div className="flex items-center gap-2 mb-8">
              <span className="text-sm text-muted-foreground mr-2">
                Partager :
              </span>
              {canShare && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleShare}
                  aria-label="Partager cet article"
                >
                  <Share2 className="h-4 w-4" />
                </Button>
              )}
              <Button
                variant="outline"
                size="icon"
                onClick={() => shareOnLinkedIn(articleUrl, article.title)}
                aria-label="Partager sur LinkedIn"
              >
                <Linkedin className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => shareOnFacebook(articleUrl)}
                aria-label="Partager sur Facebook"
              >
                <Facebook className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => shareOnTwitter(articleUrl, article.title)}
                aria-label="Partager sur Twitter"
              >
                <Twitter className="h-4 w-4" />
              </Button>
            </div>

            {/* Featured Image */}
            <div className="relative h-[400px] rounded-xl overflow-hidden mb-8">
              <img
                src={article.imageUrl}
                alt={`Image illustrant l'article: ${article.title}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            </div>

            {/* Source originale */}
            <Card className="mb-8 border-l-4 border-l-secondary bg-secondary/5">
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

            {/* Content */}
            <div className="prose prose-lg prose-gray max-w-none mb-12">
              {article.content.split("\n\n").map((paragraph, index) => (
                <p
                  key={index}
                  className="text-foreground leading-relaxed mb-6"
                >
                  {paragraph}
                </p>
              ))}
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-8" role="list" aria-label="Tags de l'article">
              {article.tags.map((tag) => (
                <Badge key={tag} variant="secondary" role="listitem">
                  {tag}
                </Badge>
              ))}
            </div>

            <Separator className="my-8" />

            {/* Share buttons (bottom) */}
            <div className="flex flex-wrap items-center justify-between gap-4 py-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  Partager cet article :
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => shareOnLinkedIn(articleUrl, article.title)}
                  aria-label="Partager sur LinkedIn"
                >
                  <Linkedin className="h-4 w-4 mr-2" aria-hidden="true" />
                  LinkedIn
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => shareOnFacebook(articleUrl)}
                  aria-label="Partager sur Facebook"
                >
                  <Facebook className="h-4 w-4 mr-2" aria-hidden="true" />
                  Facebook
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => shareOnTwitter(articleUrl, article.title)}
                  aria-label="Partager sur Twitter"
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
          <section className="bg-muted/30 py-12 border-t border-border" aria-labelledby="related-articles-heading">
            <div className="container">
              <h2 id="related-articles-heading" className="text-2xl font-bold text-foreground mb-6 font-['Sora']">
                Articles liés
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                {relatedArticles.map((relatedArticle) => (
                  <Card
                    key={relatedArticle.id}
                    className="overflow-hidden hover:shadow-lg transition-shadow"
                  >
                    <div className="relative h-40 overflow-hidden">
                      <img
                        src={relatedArticle.imageUrl}
                        alt={`Image illustrant: ${relatedArticle.title}`}
                        className="w-full h-full object-cover"
                        loading="lazy"
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
