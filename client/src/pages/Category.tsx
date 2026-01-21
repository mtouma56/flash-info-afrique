import ArticleCard from "@/components/ArticleCard";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import SEO from "@/components/SEO";
import { useArticles } from "@/hooks/useArticles";
import { FileText, Loader2 } from "lucide-react";
import { useRoute } from "wouter";
import NotFound from "./NotFound";

export default function Category() {
  const [, params] = useRoute("/categorie/:slug");
  const { articles, categories, isLoading } = useArticles();
  
  const category = categories.find((c) => c.slug === params?.slug);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Chargement...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!category) {
    return <NotFound />;
  }

  const categoryArticles = articles.filter((a) => a.category === category.id);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SEO
        title={category.name}
        description={category.description}
        url={`https://flashinfoafrique.com/categorie/${category.slug}`}
      />
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section
          className="py-16 border-b border-border"
          style={{
            background: `linear-gradient(135deg, ${category.color}10, ${category.color}05)`,
          }}
        >
          <div className="container">
            <div className="max-w-4xl mx-auto text-center">
              <div
                className="inline-flex items-center justify-center p-4 rounded-full mb-6"
                style={{ backgroundColor: `${category.color}15` }}
              >
                <FileText className="h-12 w-12" style={{ color: category.color }} />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 font-['Sora']">
                {category.name}
              </h1>
              <p className="text-xl text-muted-foreground">{category.description}</p>
            </div>
          </div>
        </section>

        {/* Articles Grid */}
        <section className="container py-12">
          {categoryArticles.length > 0 ? (
            <>
              <h2 className="text-2xl font-bold text-foreground mb-8 font-['Sora']">
                {categoryArticles.length} article{categoryArticles.length > 1 ? "s" : ""} dans cette catégorie
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categoryArticles.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-foreground mb-2 font-['Sora']">
                Aucun article
              </h2>
              <p className="text-muted-foreground">
                Il n'y a pas encore d'articles dans cette catégorie.
              </p>
            </div>
          )}
        </section>
      </main>

      <Footer />
    </div>
  );
}
