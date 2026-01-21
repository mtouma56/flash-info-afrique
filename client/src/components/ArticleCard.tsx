import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
      <article className="group">
        <Card className="overflow-hidden hover:shadow-xl transition-all duration-300 border-2 hover:border-primary/20">
          <div className="grid md:grid-cols-2 gap-0">
            {/* Image */}
            <div className="relative h-64 md:h-full overflow-hidden">
              <img
                src={article.imageUrl}
                alt={`Image illustrant: ${article.title}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              {article.isFeatured && (
                <Badge
                  className="absolute top-4 left-4 bg-secondary text-secondary-foreground"
                  style={{ backgroundColor: "#F97316" }}
                >
                  À la une
                </Badge>
              )}
            </div>

            {/* Content */}
            <CardContent className="p-6 md:p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-4">
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
                </div>

                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4 group-hover:text-primary transition-colors line-clamp-3">
                  {article.title}
                </h2>

                <p className="text-muted-foreground mb-4 line-clamp-3">
                  {article.excerpt}
                </p>

                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  <span>Source : {article.source.name}</span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <Link href={`/article/${article.slug}`}>
                  <Button className="group/btn">
                    Lire la suite
                    <ArrowRight className="ml-2 h-4 w-4 group-hover/btn:translate-x-1 transition-transform" aria-hidden="true" />
                  </Button>
                </Link>
                <a
                  href={article.source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
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
    <article className="group">
      <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 h-full flex flex-col">
        {/* Image */}
        <div className="relative h-48 overflow-hidden">
          <img
            src={article.imageUrl}
            alt={`Image illustrant: ${article.title}`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </div>

        {/* Content */}
        <CardContent className="p-5 flex-1 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <Badge
              variant="outline"
              className="text-xs font-medium"
              style={{
                borderColor: category?.color,
                color: category?.color,
              }}
            >
              {category?.name}
            </Badge>
            <div className="flex items-center text-xs text-muted-foreground font-mono">
              <Calendar className="h-3 w-3 mr-1" aria-hidden="true" />
              <time dateTime={article.publishedAt}>{formattedDate}</time>
            </div>
          </div>

          <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
            {article.title}
          </h3>

          <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-1">
            {article.excerpt}
          </p>

          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
            <span>{article.source.name}</span>
          </div>

          <div className="flex items-center justify-between mt-auto">
            <Link href={`/article/${article.slug}`}>
              <Button variant="outline" size="sm" className="group/btn">
                Lire
                <ArrowRight className="ml-2 h-3 w-3 group-hover/btn:translate-x-1 transition-transform" aria-hidden="true" />
              </Button>
            </Link>
            <a
              href={article.source.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-primary hover:underline"
            >
              Source →
            </a>
          </div>
        </CardContent>
      </Card>
    </article>
  );
}
