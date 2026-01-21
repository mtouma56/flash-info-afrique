import ArticleCard from "@/components/ArticleCard";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import SEO from "@/components/SEO";
import StructuredData from "@/components/StructuredData";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useArticles } from "@/hooks/useArticles";
import { AlertCircle, ArrowRight, Loader2, Mail, TrendingUp } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Link } from "wouter";

export default function Home() {
  const { articles, categories, isLoading } = useArticles();
  const [email, setEmail] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  // Séparer les articles featured et réguliers
  const featuredArticles = articles.filter((a) => a.isFeatured).slice(0, 2);
  
  // Filter articles by category
  const filteredArticles = activeCategory
    ? articles.filter((a) => a.category === activeCategory && !a.isFeatured)
    : articles.filter((a) => !a.isFeatured);
  
  const regularArticles = filteredArticles.slice(0, 6);

  // Articles FIDELIS pour l'encart spécial
  const fidelisArticles = articles.filter((a) =>
    a.tags.includes("FIDELIS Finance")
  );

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

        {/* Hero Section - Featured Article */}
        <section id="main-content" className="container py-8" aria-label="Article à la une">
          {featuredArticles[0] && (
            <ArticleCard article={featuredArticles[0]} featured />
          )}
        </section>

        {/* Dossier FIDELIS - Encart spécial */}
        <section className="bg-gradient-to-br from-primary/5 to-secondary/5 py-12 border-y border-border" aria-labelledby="fidelis-heading">
          <div className="container">
            <div className="flex items-center gap-3 mb-6">
              <AlertCircle className="h-6 w-6 text-secondary" aria-hidden="true" />
              <h2 id="fidelis-heading" className="text-3xl font-bold text-foreground font-['Sora']">
                Dossier spécial : FIDELIS Finance
              </h2>
            </div>
            <p className="text-muted-foreground mb-8 max-w-3xl">
              Suivez l'évolution du dossier FIDELIS Finance, accusé de
              violation du secret bancaire dans l'UEMOA. Un cas inédit qui
              pourrait créer la première jurisprudence pénale en la matière
              dans la zone.
            </p>

            <div className="grid md:grid-cols-3 gap-6 mb-8">
              {fidelisArticles.slice(0, 3).map((article) => (
                <ArticleCard key={article.id} article={article} />
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
        <section className="container py-12" aria-labelledby="news-heading">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <TrendingUp className="h-6 w-6 text-primary" aria-hidden="true" />
              <h2 id="news-heading" className="text-3xl font-bold text-foreground font-['Sora']">
                Dernières actualités
              </h2>
            </div>
          </div>

          {/* Catégories tabs */}
          <div className="flex flex-wrap gap-2 mb-8" role="tablist" aria-label="Filtrer par catégorie">
            <Badge
              variant={activeCategory === null ? "default" : "outline"}
              className="px-4 py-2 cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
              onClick={() => setActiveCategory(null)}
              role="tab"
              aria-selected={activeCategory === null}
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && setActiveCategory(null)}
            >
              Toutes
            </Badge>
            {categories.map((category) => (
              <Badge
                key={category.id}
                variant={activeCategory === category.id ? "default" : "outline"}
                className="px-4 py-2 cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                style={
                  activeCategory !== category.id
                    ? { borderColor: category.color, color: category.color }
                    : {}
                }
                onClick={() => setActiveCategory(category.id)}
                role="tab"
                aria-selected={activeCategory === category.id}
                tabIndex={0}
                onKeyDown={(e) => e.key === "Enter" && setActiveCategory(category.id)}
              >
                {category.name}
              </Badge>
            ))}
          </div>

          {/* Articles grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6" role="tabpanel">
            {regularArticles.length > 0 ? (
              regularArticles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <p className="text-muted-foreground">
                  Aucun article dans cette catégorie pour le moment.
                </p>
              </div>
            )}
          </div>
        </section>

        {/* Newsletter Section */}
        <section className="bg-gradient-to-br from-primary to-primary/80 py-16" aria-labelledby="newsletter-heading">
          <div className="container">
            <Card className="max-w-2xl mx-auto border-none shadow-2xl">
              <CardContent className="p-8 text-center">
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
                    className="flex-1"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isSubscribing}
                    aria-label="Adresse email pour la newsletter"
                    required
                  />
                  <Button type="submit" size="lg" disabled={isSubscribing}>
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
        <section className="container py-12" aria-label="Statistiques">
          <div className="grid md:grid-cols-4 gap-6">
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-4xl font-bold text-primary mb-2 font-['Sora']">
                  {fidelisArticles.length}+
                </div>
                <p className="text-sm text-muted-foreground">
                  Articles sur FIDELIS
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-4xl font-bold text-secondary mb-2 font-['Sora']">
                  {new Set(articles.map((a) => a.source.name)).size}
                </div>
                <p className="text-sm text-muted-foreground">Médias sources</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-4xl font-bold text-accent mb-2 font-['Sora']">
                  {categories.length}
                </div>
                <p className="text-sm text-muted-foreground">
                  Catégories
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 text-center">
                <div className="text-4xl font-bold text-primary mb-2 font-['Sora']">
                  UEMOA
                </div>
                <p className="text-sm text-muted-foreground">
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
