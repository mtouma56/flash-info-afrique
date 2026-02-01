import ArticleCard from "@/components/ArticleCard";
import SEO from "@/components/SEO";
import StructuredData from "@/components/StructuredData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useArticles } from "@/hooks/useArticles";
import { useDossiers } from "@/hooks/useDossiers";
import { ArrowRight, Calendar, FileText, FolderOpen, Loader2, Star, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "wouter";

export default function HomeMobile() {
  const { articles, categories, isLoading } = useArticles();
  const { dossiers } = useDossiers();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Featured articles - limit to 3 on mobile
  const featuredArticles = articles
    .filter((a) => a.isFeatured)
    .sort((a, b) => {
      if (a.order !== undefined && b.order !== undefined) return a.order - b.order;
      if (a.order !== undefined) return -1;
      if (b.order !== undefined) return 1;
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    })
    .slice(0, 3);

  // Filter and limit regular articles
  const filteredArticles = activeCategory
    ? articles.filter((a) => a.category === activeCategory && !a.isFeatured)
    : articles.filter((a) => !a.isFeatured);
  
  const regularArticles = filteredArticles.slice(0, 8);

  // Featured dossier
  const featuredDossier = useMemo(() => {
    return dossiers
      .filter(d => d.isFeatured && d.isActive)
      .sort((a, b) => {
        if (a.order !== undefined && b.order !== undefined) return a.order - b.order;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      })[0];
  }, [dossiers]);

  // Recent dossiers
  const recentDossiers = useMemo(() => {
    return dossiers
      .filter(d => d.isActive && !d.isFeatured)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 3);
  }, [dossiers]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center py-12">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground text-sm">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO url="https://flashinfoafrique.com/" />
      <StructuredData />

      {/* Featured Article - Hero Card */}
      {featuredArticles.length > 0 && (
        <section className="px-4 pt-4" aria-label="À la une">
          <Link href={`/article/${featuredArticles[0].slug}`}>
            <Card className="overflow-hidden">
              {featuredArticles[0].imageUrl && (
                <div className="aspect-video relative">
                  <img
                    src={featuredArticles[0].imageUrl}
                    alt={featuredArticles[0].title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <Badge variant="secondary" className="mb-2 text-xs">
                      À la une
                    </Badge>
                    <h2 className="text-lg font-bold text-white line-clamp-2">
                      {featuredArticles[0].title}
                    </h2>
                  </div>
                </div>
              )}
            </Card>
          </Link>
        </section>
      )}

      {/* Other featured articles */}
      {featuredArticles.length > 1 && (
        <section className="px-4 pt-4">
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {featuredArticles.slice(1).map((article) => (
              <Link key={article.id} href={`/article/${article.slug}`}>
                <Card className="w-[280px] flex-shrink-0 overflow-hidden">
                  <div className="aspect-[16/10] relative">
                    <img
                      src={article.imageUrl || "/placeholder-image.svg"}
                      alt={article.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <CardContent className="p-3">
                    <h3 className="text-sm font-semibold line-clamp-2">{article.title}</h3>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Dossier en vedette */}
      {featuredDossier && (
        <section className="px-4 pt-6" aria-label="Dossier en vedette">
          <div className="flex items-center gap-2 mb-3">
            <Star className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold">Dossier en vedette</h2>
          </div>
          <Link href={`/dossier/${featuredDossier.slug}`}>
            <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
              <CardContent className="p-4">
                <h3 className="font-bold text-base mb-2">{featuredDossier.title}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {featuredDossier.description}
                </p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <FileText className="h-3 w-3" />
                    {featuredDossier.articleIds.length} articles
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {new Date(featuredDossier.updatedAt).toLocaleDateString("fr-FR", { month: "short", year: "numeric" })}
                  </span>
                </div>
              </CardContent>
            </Card>
          </Link>
        </section>
      )}

      {/* Recent Dossiers */}
      {recentDossiers.length > 0 && (
        <section className="px-4 pt-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-bold">Autres dossiers</h2>
            </div>
            <Link href="/dossiers">
              <Button variant="ghost" size="sm" className="text-xs">
                Tous <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {recentDossiers.map((dossier) => (
              <Link key={dossier.id} href={`/dossier/${dossier.slug}`}>
                <Card className="w-[200px] flex-shrink-0">
                  <CardContent className="p-3">
                    <h4 className="font-semibold text-sm line-clamp-2 mb-2">{dossier.title}</h4>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <FileText className="h-3 w-3" />
                      {dossier.articleIds.length}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Latest articles */}
      <section className="px-4 pt-6 pb-4" aria-label="Dernières actualités">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold">Actualités</h2>
          </div>
          <Link href="/articles">
            <Button variant="ghost" size="sm" className="text-xs">
              Tous <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </Link>
        </div>

        {/* Category pills - horizontal scrollable */}
        <div className="flex gap-2 overflow-x-auto pb-3 -mx-4 px-4 scrollbar-hide">
          <Badge
            variant={activeCategory === null ? "default" : "outline"}
            className="px-3 py-1.5 cursor-pointer whitespace-nowrap flex-shrink-0"
            onClick={() => setActiveCategory(null)}
          >
            Toutes
          </Badge>
          {categories.map((category) => (
            <Badge
              key={category.id}
              variant={activeCategory === category.id ? "default" : "outline"}
              className="px-3 py-1.5 cursor-pointer whitespace-nowrap flex-shrink-0"
              style={
                activeCategory !== category.id
                  ? { borderColor: category.color, color: category.color }
                  : {}
              }
              onClick={() => setActiveCategory(category.id)}
            >
              {category.name}
            </Badge>
          ))}
        </div>

        {/* Articles list - compact cards */}
        <div className="space-y-3">
          {regularArticles.map((article) => (
            <ArticleCard key={article.id} article={article} variant="compact" />
          ))}
        </div>

        {/* View all button */}
        {filteredArticles.length > 8 && (
          <div className="flex justify-center mt-4">
            <Link href="/articles">
              <Button variant="outline" size="lg" className="w-full">
                Voir tous les articles
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </Link>
          </div>
        )}
      </section>
    </>
  );
}
