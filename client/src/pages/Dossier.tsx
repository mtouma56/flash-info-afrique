import ArticleCard from "@/components/ArticleCard";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import SEO from "@/components/SEO";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useArticles } from "@/hooks/useArticles";
import { useDossier } from "@/hooks/useDossiers";
import { AlertCircle, Calendar, FileText, Loader2, Scale } from "lucide-react";
import { useRoute } from "wouter";
import NotFound from "./NotFound";

export default function Dossier() {
  const [, params] = useRoute("/dossier/:slug");
  const { dossier, isLoading: isDossierLoading, error } = useDossier(params?.slug || "");
  const { articles, isLoading: isArticlesLoading } = useArticles();

  const isLoading = isDossierLoading || isArticlesLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Chargement du dossier...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !dossier) {
    return <NotFound />;
  }

  // Get articles associated with this dossier (by articleIds or by tag matching the dossier title)
  const dossierArticles = articles.filter((a) => 
    dossier.articleIds.includes(a.id) || 
    a.tags.some(tag => dossier.title.toLowerCase().includes(tag.toLowerCase()))
  );

  // Format the last update date
  const lastUpdate = new Date(dossier.updatedAt).toLocaleDateString("fr-FR", {
    year: "numeric",
    month: "long",
  });

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title={dossier.title}
        description={dossier.description}
        keywords={`${dossier.title}, UEMOA, actualité économique`}
        url={`https://flashinfoafrique.com/dossier/${dossier.slug}`}
      />
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/5 py-16 border-b border-border" aria-labelledby="dossier-title">
          <div className="container">
            <div className="max-w-4xl mx-auto text-center">
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-secondary/10 rounded-full">
                  <AlertCircle className="h-12 w-12 text-secondary" />
                </div>
              </div>
              <h1 id="dossier-title" className="text-4xl md:text-5xl font-bold text-foreground mb-4 font-['Sora']">
                {dossier.title}
              </h1>
              <p className="text-xl text-muted-foreground mb-6">
                {dossier.description}
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <Badge variant="outline" className="px-4 py-2">
                  <Scale className="h-4 w-4 mr-2" />
                  Dossier en cours
                </Badge>
                <Badge variant="outline" className="px-4 py-2">
                  <FileText className="h-4 w-4 mr-2" />
                  {dossierArticles.length} article{dossierArticles.length > 1 ? "s" : ""} publié{dossierArticles.length > 1 ? "s" : ""}
                </Badge>
                <Badge variant="outline" className="px-4 py-2">
                  <Calendar className="h-4 w-4 mr-2" />
                  Dernière mise à jour : {lastUpdate}
                </Badge>
              </div>
            </div>
          </div>
        </section>

        {/* Chronologie interactive */}
        {dossier.timelineEvents.length > 0 && (
          <section className="bg-muted/30 py-12">
            <div className="container">
              <h2 className="text-3xl font-bold text-foreground mb-8 text-center font-['Sora']">
                Chronologie des événements
              </h2>
              <div className="max-w-4xl mx-auto">
                <div className="relative">
                  {/* Ligne verticale */}
                  <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-secondary to-accent" />

                  {/* Événements */}
                  <div className="space-y-8">
                    {dossier.timelineEvents.map((event, index) => {
                      const date = new Date(event.date);
                      const formattedDate = date.toLocaleDateString("fr-FR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      });

                      return (
                        <div key={event.id || index} className="relative pl-20">
                          {/* Point sur la ligne */}
                          <div className="absolute left-6 top-2 w-5 h-5 rounded-full bg-primary border-4 border-background shadow-lg" />

                          {/* Date */}
                          <div className="absolute left-0 top-0 text-xs font-mono text-muted-foreground">
                            {event.date}
                          </div>

                          {/* Contenu */}
                          <Card className="hover:shadow-lg transition-shadow">
                            <CardContent className="p-5">
                              <h3 className="text-lg font-bold text-foreground mb-2">
                                {event.title}
                              </h3>
                              <p className="text-sm text-muted-foreground">
                                {event.description}
                              </p>
                              <p className="text-xs text-muted-foreground mt-2 font-mono">
                                {formattedDate}
                              </p>
                            </CardContent>
                          </Card>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Tous les articles */}
        <section className="container py-12">
          <h2 className="text-3xl font-bold text-foreground mb-8 font-['Sora']">
            Tous les articles ({dossierArticles.length})
          </h2>
          {dossierArticles.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {dossierArticles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          ) : (
            <Card className="bg-muted/50">
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Aucun article associé à ce dossier pour le moment.
                </p>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Disclaimer */}
        <section className="container py-8">
          <Card className="bg-muted/50 border-dashed">
            <CardContent className="p-6 text-center">
              <p className="text-sm text-muted-foreground">
                <strong>Disclaimer :</strong> Flash Info Afrique agrège et
                analyse l'information publique disponible sur ce dossier. Nous
                ne représentons aucune partie et maintenons une stricte
                neutralité éditoriale. Les personnes et entités mentionnées
                sont présumées innocentes.
              </p>
            </CardContent>
          </Card>
        </section>
      </main>

      <Footer />
    </div>
  );
}
