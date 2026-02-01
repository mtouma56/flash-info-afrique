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
  /** Vignette horizontale : image à gauche, texte à droite (tous écrans) */
  /** compact: version très compacte pour mobile */
  variant?: "card" | "row" | "compact";
}

export default function ArticleCard({
  article,
  featured = false,
  variant = "card",
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
  const shortDate = new Date(article.publishedAt).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

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
                priority={true}
                sizes="(max-width: 768px) 100vw, 50vw"
                objectFit="contain"
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

  /* Variante compacte pour mobile */
  if (variant === "compact") {
    return (
      <article className="group w-full min-w-0">
        <Link href={`/article/${article.slug}`} className="block w-full">
          <Card className="overflow-hidden rounded-lg border border-border/80 bg-card shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary/20 flex w-full flex-row min-h-[5rem] active:scale-[0.99]">
            {/* Petite image à gauche */}
            <div className="relative flex-shrink-0 w-24 h-24 overflow-hidden bg-muted/80">
              <OptimizedImage
                src={article.imageUrl}
                alt={`Image illustrant: ${article.title}`}
                className="w-full h-full group-hover:scale-105 transition-transform duration-300"
                objectFit="cover"
                objectPosition="center"
                priority={false}
                sizes="96px"
              />
            </div>

            {/* Contenu compact */}
            <CardContent className="flex flex-1 min-w-0 flex-col justify-center gap-1 p-3">
              <div className="flex items-center gap-2">
                <Badge
                  variant="outline"
                  className="text-[10px] font-medium shrink-0 px-1.5 py-0 rounded"
                  style={{ borderColor: category?.color, color: category?.color }}
                >
                  {category?.name}
                </Badge>
                <time dateTime={article.publishedAt} className="text-[10px] text-muted-foreground font-mono tabular-nums">
                  {shortDate}
                </time>
              </div>
              <h3 className="text-sm font-semibold leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-2 break-words">
                {article.title}
              </h3>
            </CardContent>
          </Card>
        </Link>
      </article>
    );
  }

  /* Vignette horizontale : image à gauche, texte à droite (tous écrans) */
  if (variant === "row") {
    return (
      <article className="group w-full min-w-0">
        <Link href={`/article/${article.slug}`} className="block w-full">
          <Card className="overflow-hidden rounded-lg border border-border/80 bg-card shadow-sm transition-all duration-300 hover:shadow-md hover:border-primary/20 flex w-full flex-row min-h-[7rem] sm:min-h-[8.5rem] pl-3 sm:pl-4">
            {/* Image à gauche, largeur fixe */}
            <div className="relative flex-shrink-0 w-36 sm:w-44 h-28 sm:h-34 overflow-hidden bg-muted/80 rounded-lg my-auto">
              <OptimizedImage
                src={article.imageUrl}
                alt={`Image illustrant: ${article.title}`}
                className="w-full h-full group-hover:scale-105 transition-transform duration-300"
                objectFit="cover"
                objectPosition="center"
                priority={false}
                sizes="(max-width: 640px) 144px, 176px"
              />
            </div>

            {/* Contenu à droite */}
            <CardContent className="flex flex-1 min-w-0 flex-col justify-center gap-1.5 border-l border-border/60 p-4 sm:p-5">
              <div className="flex items-center gap-2 shrink-0">
                <Badge
                  variant="outline"
                  className="text-[11px] font-medium shrink-0 px-2 py-0.5 rounded"
                  style={{ borderColor: category?.color, color: category?.color }}
                >
                  {category?.name}
                </Badge>
                <time dateTime={article.publishedAt} className="text-xs text-muted-foreground font-mono tabular-nums shrink-0">
                  {shortDate}
                </time>
              </div>
              <h3 className="font-['Sora'] text-base sm:text-lg font-semibold leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-2 break-words">
                {article.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 break-words">
                {article.excerpt}
              </p>
            </CardContent>
          </Card>
        </Link>
      </article>
    );
  }

  /* Carte par défaut : image au-dessus, texte en dessous */
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
