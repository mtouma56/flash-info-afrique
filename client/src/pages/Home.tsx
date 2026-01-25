import ArticleCard from "@/components/ArticleCard";
import FeaturedCarousel from "@/components/FeaturedCarousel";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import SEO from "@/components/SEO";
import StructuredData from "@/components/StructuredData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useArticles } from "@/hooks/useArticles";
import { useDossier } from "@/hooks/useDossiers";
import { AlertCircle, ArrowRight, Loader2, Mail, TrendingUp, CheckCircle, XCircle } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Link } from "wouter";

export default function Home() {
  const { articles, categories, isLoading } = useArticles();
  const { dossier: fidelisDossier } = useDossier("fidelis");
  const [email, setEmail] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [displayedCount, setDisplayedCount] = useState(6);

  // Handle newsletter confirmation/unsubscription feedback from URL parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const newsletterStatus = urlParams.get("newsletter");

    if (newsletterStatus) {
      // Clear the URL parameters without reloading
      const newUrl = window.location.pathname;
      window.history.replaceState({}, "", newUrl);

      switch (newsletterStatus) {
        case "confirmed":
          toast.success("Inscription confirmée !", {
            description: "Vous recevrez notre newsletter chaque vendredi.",
            duration: 5000,
            icon: <CheckCircle className="h-5 w-5 text-green-500" />,
          });
          break;
        case "unsubscribed":
          toast.success("Désinscription réussie", {
            description: "Vous ne recevrez plus notre newsletter.",
            duration: 5000,
          });
          break;
        case "error":
          const reason = urlParams.get("reason") || "unknown";
          let errorMessage = "Une erreur est survenue.";
          
          if (reason.includes("expiré") || reason === "expired") {
            errorMessage = "Le lien de confirmation a expiré. Veuillez vous réinscrire.";
          } else if (reason === "invalid-token") {
            errorMessage = "Lien invalide. Veuillez vous réinscrire.";
          } else if (reason === "server-error") {
            errorMessage = "Erreur serveur. Veuillez réessayer plus tard.";
          }
          
          toast.error("Erreur", {
            description: errorMessage,
            duration: 5000,
            icon: <XCircle className="h-5 w-5 text-red-500" />,
          });
          break;
      }
    }
  }, []);

  // Séparer les articles featured et réguliers
  // Trier par ordre de priorité (champ order), puis par date de publication
  const featuredArticles = articles
    .filter((a) => a.isFeatured)
    .sort((a, b) => {
      // Si les deux ont un ordre défini, trier par ordre croissant (1 = priorité haute)
      if (a.order !== undefined && b.order !== undefined) {
        return a.order - b.order;
      }
      // Si seul a a un ordre, il passe en premier
      if (a.order !== undefined) return -1;
      // Si seul b a un ordre, il passe en premier
      if (b.order !== undefined) return 1;
      // Sinon, trier par date de publication (plus récent en premier)
      return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
    });
  
  // Filter articles by category
  const filteredArticles = activeCategory
    ? articles.filter((a) => a.category === activeCategory && !a.isFeatured)
    : articles.filter((a) => !a.isFeatured);
  
  const regularArticles = filteredArticles.slice(0, displayedCount);
  const hasMore = filteredArticles.length > displayedCount;
  const remainingCount = filteredArticles.length - displayedCount;

  // Handler for category change - reset displayed count
  const handleCategoryChange = (categoryId: string | null) => {
    setActiveCategory(categoryId);
    setDisplayedCount(6);
  };

  // Handler for loading more articles
  const handleLoadMore = () => {
    setDisplayedCount((prev) => prev + 6);
  };

  // Articles FIDELIS pour l'encart spécial
  // Uses same logic as Dossier page: check articleIds OR tag matching
  const fidelisArticles = useMemo(() => {
    return articles.filter((a) =>
      (fidelisDossier?.articleIds?.includes(a.id)) ||
      a.tags.some(tag => 
        tag === "FIDELIS" || 
        tag === "FIDELIS Finance" || 
        tag.toLowerCase().includes("fidelis")
      )
    );
  }, [articles, fidelisDossier]);

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error("Veuillez entrer une adresse email");
      return;
    }

    setIsSubscribing(true);

    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || "Inscription réussie !");
        setEmail("");
      } else {
        toast.error(data.error || "Une erreur est survenue");
      }
    } catch {
      toast.error("Impossible de se connecter au serveur");
    } finally {
      setIsSubscribing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <SEO />
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

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO />
      <StructuredData />
      <Header />

      <main className="flex-1">
        {/* Skip to main content link for accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md"
        >
          Aller au contenu principal
        </a>

        {/* Hero Section - Featured Articles Carousel */}
        {featuredArticles.length > 0 && (
          <section id="main-content" className="container py-8" aria-label="Articles à la une">
            <FeaturedCarousel articles={featuredArticles} />
          </section>
        )}

        {/* Dossier FIDELIS - Encart spécial */}
        <section className="bg-gradient-to-br from-primary/5 to-secondary/5 py-8 sm:py-12 border-y border-border" aria-labelledby="fidelis-heading">
          <div className="container">
            <div className="flex items-start sm:items-center gap-3 mb-4 sm:mb-6">
              <AlertCircle className="h-6 w-6 text-secondary" aria-hidden="true" />
              <h2 id="fidelis-heading" className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground font-['Sora']">
                Dossier spécial : FIDELIS Finance Burkina Faso
              </h2>
            </div>
            <p className="text-muted-foreground mb-4 max-w-3xl">
              Suivez l'évolution du dossier <strong>FIDELIS Finance</strong>, établissement financier 
              basé au <strong>Burkina Faso</strong> avec une succursale à <strong>Abidjan</strong>, 
              accusé de violation du secret bancaire en <strong>Côte d'Ivoire</strong>. 
              Un cas inédit qui pourrait créer la première jurisprudence pénale en la matière dans l'UEMOA.
            </p>
            <p className="text-sm text-muted-foreground mb-8 max-w-3xl">
              Cette affaire oppose la PME ivoirienne SOGETRA à Fidelis Finance Abidjan et 
              Fidelis Finance Côte d'Ivoire. Quatre dirigeants sont mis en examen pour 
              violation présumée du secret bancaire, destruction de preuves et subornation de témoin.
            </p>

            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8 min-w-0">
              {fidelisArticles.slice(0, 3).map((article) => (
                <div key={article.id} className="min-w-0">
                  <ArticleCard article={article} />
                </div>
              ))}
            </div>

            <div className="flex justify-center">
              <Link href="/dossier/fidelis">
                <Button size="lg" className="group">
                  Voir tous les articles du dossier
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Dernières actualités */}
        <section className="container py-8 sm:py-12" aria-labelledby="news-heading">
          <div className="flex items-center justify-between mb-6 sm:mb-8">
            <div className="flex items-center gap-2 sm:gap-3">
              <TrendingUp className="h-6 w-6 text-primary" aria-hidden="true" />
              <h2 id="news-heading" className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground font-['Sora']">
                Dernières actualités
              </h2>
            </div>
          </div>

          {/* Catégories tabs */}
          <div className="flex flex-wrap gap-2 mb-6 sm:mb-8" role="tablist" aria-label="Filtrer par catégorie">
            <Badge
              variant={activeCategory === null ? "default" : "outline"}
              className="px-4 py-2.5 min-h-[44px] cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors flex items-center"
              onClick={() => handleCategoryChange(null)}
              role="tab"
              aria-selected={activeCategory === null}
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && handleCategoryChange(null)}
            >
              Toutes
            </Badge>
            {categories.map((category) => (
              <Badge
                key={category.id}
                variant={activeCategory === category.id ? "default" : "outline"}
                className="px-4 py-2.5 min-h-[44px] cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors flex items-center"
                style={
                  activeCategory !== category.id
                    ? { borderColor: category.color, color: category.color }
                    : {}
                }
                onClick={() => handleCategoryChange(category.id)}
                role="tab"
                aria-selected={activeCategory === category.id}
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && handleCategoryChange(category.id)}
              >
                {category.name}
              </Badge>
            ))}
          </div>

          {/* Articles grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 min-w-0" role="tabpanel">
            {regularArticles.length > 0 ? (
              regularArticles.map((article) => (
                <div key={article.id} className="min-w-0">
                  <ArticleCard article={article} />
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground">
                  Aucun article dans cette catégorie pour le moment.
                </p>
              </div>
            )}
          </div>

          {/* Load more / View all articles button */}
          {regularArticles.length > 0 && hasMore && (
            <div className="flex justify-center mt-8">
              {remainingCount > 6 ? (
                <Button 
                  size="lg" 
                  variant="outline" 
                  onClick={handleLoadMore}
                  className="group"
                >
                  Afficher plus d'articles
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                </Button>
              ) : (
                <Link href="/articles">
                  <Button size="lg" className="group">
                    Voir tous les articles
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                  </Button>
                </Link>
              )}
            </div>
          )}

          {/* Link to all articles when all are displayed */}
          {regularArticles.length > 0 && !hasMore && filteredArticles.length > 6 && (
            <div className="flex justify-center mt-8">
              <Link href="/articles">
                <Button size="lg" variant="outline" className="group">
                  Voir tous les articles
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" aria-hidden="true" />
                </Button>
              </Link>
            </div>
          )}
        </section>

        {/* Newsletter Section */}
        <section className="bg-gradient-to-br from-primary to-primary/80 py-10 sm:py-16" aria-labelledby="newsletter-heading">
          <div className="container">
            <Card className="max-w-2xl mx-auto border-none shadow-2xl">
              <CardContent className="p-5 sm:p-8 text-center">
                <div className="flex justify-center mb-4">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <Mail className="h-8 w-8 text-primary" aria-hidden="true" />
                  </div>
                </div>
                <h3 id="newsletter-heading" className="text-2xl font-bold text-foreground mb-2 font-['Sora']">
                  Newsletter hebdomadaire
                </h3>
                <p className="text-muted-foreground mb-6">
                  Recevez chaque vendredi le résumé de l'actualité économique
                  et financière de la zone UEMOA
                </p>
                <form onSubmit={handleNewsletterSubmit} className="flex flex-col sm:flex-row gap-3">
                  <Input
                    type="email"
                    placeholder="votre@email.com"
                    className="flex-1 min-h-[44px]"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isSubscribing}
                    aria-label="Adresse email pour la newsletter"
                    required
                  />
                  <Button type="submit" size="lg" disabled={isSubscribing} className="min-h-[44px]">
                    {isSubscribing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                        Inscription...
                      </>
                    ) : (
                      "S'inscrire"
                    )}
                  </Button>
                </form>
                <p className="text-xs text-muted-foreground mt-4">
                  Pas de spam. Désinscription possible à tout moment.
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Stats Section */}
        <section className="container py-8 sm:py-12" aria-label="Statistiques">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            <Card>
              <CardContent className="p-4 sm:p-6 text-center">
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary mb-1 sm:mb-2 font-['Sora']">
                  {fidelisArticles.length}+
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Articles sur FIDELIS
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 sm:p-6 text-center">
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-secondary mb-1 sm:mb-2 font-['Sora']">
                  {new Set(articles.map((a) => a.source.name)).size}
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">Médias sources</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 sm:p-6 text-center">
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-accent mb-1 sm:mb-2 font-['Sora']">
                  {categories.length}
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Catégories
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 sm:p-6 text-center">
                <div className="text-2xl sm:text-3xl md:text-4xl font-bold text-primary mb-1 sm:mb-2 font-['Sora']">
                  UEMOA
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Zone de couverture
                </p>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
