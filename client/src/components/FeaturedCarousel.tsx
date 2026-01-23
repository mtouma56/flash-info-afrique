import { useCallback, useEffect, useMemo, useState } from "react";
import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import ArticleCard from "@/components/ArticleCard";
import type { Article } from "@/hooks/useArticles";
import { cn } from "@/lib/utils";

interface FeaturedCarouselProps {
  articles: Article[];
  autoplayInterval?: number; // en millisecondes, défaut 8000ms
}

export default function FeaturedCarousel({
  articles,
  autoplayInterval = 8000,
}: FeaturedCarouselProps) {
  const [api, setApi] = useState<CarouselApi>();
  const [current, setCurrent] = useState(0);
  const [count, setCount] = useState(0);

  // Plugin autoplay avec pause au survol
  const autoplayPlugin = useMemo(
    () =>
      Autoplay({
        delay: autoplayInterval,
        stopOnInteraction: false,
        stopOnMouseEnter: true,
      }),
    [autoplayInterval]
  );

  // Mettre à jour l'index courant quand le carousel change
  const onSelect = useCallback(() => {
    if (!api) return;
    setCurrent(api.selectedScrollSnap());
    setCount(api.scrollSnapList().length);
  }, [api]);

  useEffect(() => {
    if (!api) return;

    onSelect();
    api.on("select", onSelect);
    api.on("reInit", onSelect);

    return () => {
      api.off("select", onSelect);
      api.off("reInit", onSelect);
    };
  }, [api, onSelect]);

  // Naviguer vers un slide spécifique
  const scrollTo = useCallback(
    (index: number) => {
      api?.scrollTo(index);
    },
    [api]
  );

  // S'il n'y a pas d'articles, ne rien afficher
  if (articles.length === 0) {
    return null;
  }

  // S'il n'y a qu'un seul article, afficher directement sans carousel
  if (articles.length === 1) {
    return <ArticleCard article={articles[0]} featured />;
  }

  return (
    <div className="relative">
      <Carousel
        setApi={setApi}
        opts={{
          loop: true,
          align: "start",
        }}
        plugins={[autoplayPlugin]}
        className="w-full"
      >
        <CarouselContent>
          {articles.map((article) => (
            <CarouselItem key={article.id}>
              <ArticleCard article={article} featured />
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* Boutons de navigation - positionnés à l'intérieur */}
        <CarouselPrevious
          className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-10 bg-background/80 hover:bg-background border-border shadow-lg h-10 w-10 sm:h-8 sm:w-8"
          aria-label="Article précédent"
        />
        <CarouselNext
          className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-10 bg-background/80 hover:bg-background border-border shadow-lg h-10 w-10 sm:h-8 sm:w-8"
          aria-label="Article suivant"
        />
      </Carousel>

      {/* Indicateurs de pagination (dots) */}
      <div
        className="flex justify-center gap-3 sm:gap-2 mt-4"
        role="tablist"
        aria-label="Navigation des articles en vedette"
      >
        {Array.from({ length: count }).map((_, index) => (
          <button
            key={index}
            onClick={() => scrollTo(index)}
            className={cn(
              "w-3 h-3 sm:w-2.5 sm:h-2.5 rounded-full transition-all duration-300",
              "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
              "min-h-[44px] min-w-[44px] sm:min-h-0 sm:min-w-0 flex items-center justify-center",
              current === index
                ? "bg-primary w-8 sm:w-6"
                : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
            )}
            role="tab"
            aria-selected={current === index}
            aria-label={`Voir l'article ${index + 1} sur ${count}`}
            tabIndex={current === index ? 0 : -1}
          />
        ))}
      </div>
    </div>
  );
}
