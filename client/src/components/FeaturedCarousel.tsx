import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Autoplay from "embla-carousel-autoplay";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";
import { Button } from "@/components/ui/button";
import ArticleCard from "@/components/ArticleCard";
import type { Article } from "@/hooks/useArticles";
import { cn } from "@/lib/utils";
import { Pause, Play } from "lucide-react";

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
  const [isPlaying, setIsPlaying] = useState(true);

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

  // Reference to autoplay plugin for control
  const autoplayRef = useRef(autoplayPlugin);
  autoplayRef.current = autoplayPlugin;

  // Toggle autoplay
  const toggleAutoplay = useCallback(() => {
    const autoplay = autoplayRef.current;
    if (!autoplay) return;

    if (isPlaying) {
      autoplay.stop();
      setIsPlaying(false);
    } else {
      autoplay.play();
      setIsPlaying(true);
    }
  }, [isPlaying]);

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
    <div className="relative overflow-hidden max-w-full">
      <Carousel
        setApi={setApi}
        opts={{
          loop: true,
          align: "start",
        }}
        plugins={[autoplayPlugin]}
        className="w-full max-w-full"
      >
        <CarouselContent className="max-w-full min-w-0">
          {articles.map((article) => (
            <CarouselItem key={article.id} className="max-w-full min-w-0">
              <div className="min-w-0 max-w-full">
                <ArticleCard article={article} featured />
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>

        {/* Boutons de navigation - positionnés à l'intérieur */}
        <CarouselPrevious
          className="absolute left-1 sm:left-4 top-1/2 -translate-y-1/2 z-10 bg-background/80 hover:bg-background border-border shadow-lg h-10 w-10 sm:h-11 sm:w-11 min-h-[44px] min-w-[44px]"
          aria-label="Article précédent"
        />
        <CarouselNext
          className="absolute right-1 sm:right-4 top-1/2 -translate-y-1/2 z-10 bg-background/80 hover:bg-background border-border shadow-lg h-10 w-10 sm:h-11 sm:w-11 min-h-[44px] min-w-[44px]"
          aria-label="Article suivant"
        />
      </Carousel>

      {/* Indicateurs de pagination (dots) + Play/Pause control */}
      <div
        className="flex justify-center items-center gap-2 mt-3 sm:mt-4 flex-wrap"
        role="tablist"
        aria-label="Navigation des articles en vedette"
      >
        {/* Play/Pause button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleAutoplay}
          className="h-8 w-8 rounded-full bg-muted/50 hover:bg-muted"
          aria-label={isPlaying ? "Mettre en pause le défilement automatique" : "Reprendre le défilement automatique"}
        >
          {isPlaying ? (
            <Pause className="h-3.5 w-3.5" aria-hidden="true" />
          ) : (
            <Play className="h-3.5 w-3.5 ml-0.5" aria-hidden="true" />
          )}
        </Button>

        {/* Pagination dots */}
        {Array.from({ length: count }).map((_, index) => (
          <button
            key={index}
            onClick={() => scrollTo(index)}
            className={cn(
              "w-2.5 h-2.5 sm:w-2.5 sm:h-2.5 rounded-full transition-all duration-300",
              "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
              "p-2 flex items-center justify-center",
              current === index
                ? "bg-primary w-6 sm:w-6"
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
