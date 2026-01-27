import { ArrowRight, Star } from "lucide-react";
import { Link } from "wouter";

interface FeaturedDossierBarProps {
  dossier: {
    slug: string;
    title: string;
  };
  className?: string;
}

export default function FeaturedDossierBar({ dossier, className = "" }: FeaturedDossierBarProps) {
  return (
    <section 
      className={`border-y border-border bg-gradient-to-r from-primary/5 to-secondary/5 py-2.5 sm:py-3 ${className}`}
      aria-label="Dossier en vedette"
    >
      <div className="container">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Star className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
            <span className="hidden sm:inline">Dossier en vedette :</span>
            <span className="sm:hidden">Dossier vedette :</span>
            <Link
              href={`/dossier/${dossier.slug}`}
              className="text-primary hover:text-primary/80 transition-colors font-semibold truncate max-w-[200px] sm:max-w-none"
              aria-label={`Lire le dossier en vedette : ${dossier.title}`}
            >
              {dossier.title}
            </Link>
          </div>
          <Link
            href={`/dossier/${dossier.slug}`}
            className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary/80 transition-colors whitespace-nowrap group"
          >
            Découvrir
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
