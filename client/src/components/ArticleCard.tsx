import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import OptimizedImage from "@/components/OptimizedImage";
import { useArticles, type Article } from "@/hooks/useArticles";
import { ArrowRight, Calendar, ExternalLink } from "lucide-react";
import { Link } from "wouter";

interface ArticleCardProps {
  article: Article;
  featured?: boolean;
}

export default function ArticleCard({
  article,
  featured = false,
}: ArticleCardProps) {
  const { categories } = useArticles();
  const category = categories.find((c) => c.id === article.category);
  const formattedDate = new Date(article.publishedAt).toLocaleDateString(
    "fr-FR",
    {
      year: "numeric",
      month: "long",
      day: "numeric",
    }
  );

  if (featured) {
    return (
      <article className="group min-w-0 max-w-full">
        <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/20 max-w-full">
          <div className="grid md:grid-cols-2 gap-0 min-w-0">
            {/* Image */}
            <div className="relative h-48 md:h-72 overflow-hidden">
              <OptimizedImage
                src={article.imageUrl}
                alt={`Image illustrant: ${article.title}`}
                className="w-full h-full group-hover:scale-105 transition-transform duration-500"
                aspectRatio="16/9"
                width={800}
                height={450}
                priority={true}
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
              {article.isFeatured && (
                <Badge
                  className="absolute top-4 left-4 bg-secondary text-secondary-foreground z-10"
                  style={{ backgroundColor: "#F97316" }}
                >
                  À la une
                </Badge>
              )}
            </div>

            {/* Content */}
            <CardContent className="p-3 sm:p-4 md:p-6 flex flex-col justify-between overflow-hidden">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <Badge
                    variant="outline"
                    className="font-medium text-xs sm:text-sm shrink-0"
                    style={{
                      borderColor: category?.color,
                      color: category?.color,
                    }}
                  >
                    {category?.name}
                  </Badge>
                  <div className="flex items-center text-xs sm:text-sm text-muted-foreground font-mono">
                    <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1 shrink-0" aria-hidden="true" />
                    <time dateTime={article.publishedAt}>{formattedDate}</time>
                  </div>
                </div>

                <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl font-bold text-foreground mb-2 sm:mb-3 group-hover:text-primary transition-colors line-clamp-3 break-words">
                  {article.title}
                </h2>

                <p className="text-sm sm:text-base text-muted-foreground mb-2 sm:mb-3 line-clamp-2 break-words">
                  {article.excerpt}
                </p>

                <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4">
                  <ExternalLink className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" aria-hidden="true" />
                  <span className="truncate">Source : {article.source.name}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                <Link href={`/article/${article.slug}`}>
                  <Button className="group/btn min-h-[44px]">
                    Lire la suite
                    <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" aria-hidden="true" />
                  </Button>
                </Link>
                <a
                  href={article.source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline py-2"
                >
                  Article original →
                </a>
              </div>
            </CardContent>
          </div>
        </Card>
      </article>
    );
  }

  return (
    <article className="group min-w-0 max-w-full">
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 h-full flex flex-col max-w-full">
        {/* Image */}
        <div className="relative h-48 overflow-hidden">
          <OptimizedImage
            src={article.imageUrl}
            alt={`Image illustrant: ${article.title}`}
            className="w-full h-full group-hover:scale-105 transition-transform duration-500"
            aspectRatio="16/9"
            width={400}
            height={225}
            priority={false}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
        </div>

        {/* Content */}
        <CardContent className="p-3 sm:p-4 md:p-5 flex-1 flex flex-col overflow-hidden">
          <div className="flex flex-wrap items-center gap-2 mb-2 sm:mb-3">
            <Badge
              variant="outline"
              className="text-xs font-medium shrink-0"
              style={{
                borderColor: category?.color,
                color: category?.color,
              }}
            >
              {category?.name}
            </Badge>
            <div className="flex items-center text-xs text-muted-foreground font-mono">
              <Calendar className="h-3 w-3 mr-1 shrink-0" aria-hidden="true" />
              <time dateTime={article.publishedAt}>{formattedDate}</time>
            </div>
          </div>

          <h3 className="text-base sm:text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2 break-words">
            {article.title}
          </h3>

          <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 line-clamp-2 flex-1 break-words">
            {article.excerpt}
          </p>

          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3 sm:mb-4">
            <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
            <span className="truncate">{article.source.name}</span>
          </div>

          <div className="flex items-center justify-between mt-auto gap-2">
            <Link href={`/article/${article.slug}`}>
              <Button variant="outline" size="sm" className="group/btn text-xs sm:text-sm">
                Lire
                <ArrowRight className="ml-1 sm:ml-2 h-3 w-3 group-hover/btn:translate-x-1 transition-transform" aria-hidden="true" />
              </Button>
            </Link>
            <a
              href={article.source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline truncate"
            >
              Source →
            </a>
          </div>
        </CardContent>
      </Card>
    </article>
  );
}
