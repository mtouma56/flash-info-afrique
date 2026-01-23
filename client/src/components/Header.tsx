import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useArticles } from "@/hooks/useArticles";
import { Menu, Search, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import ThemeToggle from "./ThemeToggle";

export default function Header() {
  const [location, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { articles } = useArticles();

  const navigation = [
    { name: "Accueil", href: "/" },
    { name: "Tous les articles", href: "/articles" },
    { name: "Dossier FIDELIS", href: "/dossier/fidelis" },
    { name: "Banque & Finance", href: "/categorie/banque-finance" },
    { name: "Régulation", href: "/categorie/regulation-conformite" },
    { name: "Marchés", href: "/categorie/marches-investissements" },
  ];

  // Search results
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];

    const query = searchQuery.toLowerCase();
    return articles
      .filter(
        (article) =>
          article.title.toLowerCase().includes(query) ||
          article.excerpt.toLowerCase().includes(query) ||
          article.tags.some((tag) => tag.toLowerCase().includes(query))
      )
      .slice(0, 5);
  }, [searchQuery, articles]);

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "Escape") {
        setSearchOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleSearchSelect = useCallback(
    (slug: string) => {
      setSearchOpen(false);
      setSearchQuery("");
      setLocation(`/article/${slug}`);
    },
    [setLocation]
  );

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center hover:opacity-80 transition-opacity"
              aria-label="Flash Info Afrique - Accueil"
            >
              <img 
                src="/logo.png" 
                alt="Flash Info Afrique" 
                className="h-14 w-auto object-contain"
              />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1" aria-label="Navigation principale">
              {navigation.map((item) => {
                const isActive = location === item.href;
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-foreground hover:bg-muted hover:text-foreground"
                    }`}
                    aria-current={isActive ? "page" : undefined}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </nav>

            {/* Right Actions */}
            <div className="flex items-center space-x-1 sm:space-x-2">
              <ThemeToggle />
              <Button
                variant="ghost"
                size="icon"
                className="hidden sm:flex h-11 w-11 min-h-[44px] min-w-[44px]"
                onClick={() => setSearchOpen(true)}
                aria-label="Rechercher (Ctrl+K)"
              >
                <Search className="h-5 w-5" aria-hidden="true" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden h-11 w-11 min-h-[44px] min-w-[44px]"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-expanded={mobileMenuOpen}
                aria-controls="mobile-menu"
                aria-label={mobileMenuOpen ? "Fermer le menu" : "Ouvrir le menu"}
              >
                {mobileMenuOpen ? (
                  <X className="h-6 w-6" aria-hidden="true" />
                ) : (
                  <Menu className="h-6 w-6" aria-hidden="true" />
                )}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <nav id="mobile-menu" className="md:hidden border-t border-border py-4" aria-label="Navigation mobile">
              <div className="flex flex-col space-y-1">
                <Button
                  variant="ghost"
                  className="justify-start h-12 min-h-[44px]"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setSearchOpen(true);
                  }}
                >
                  <Search className="h-5 w-5 mr-3" aria-hidden="true" />
                  Rechercher
                </Button>
                {navigation.map((item) => {
                  const isActive = location === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`px-4 py-3 min-h-[44px] rounded-md text-base font-medium transition-colors block flex items-center ${
                        isActive
                          ? "bg-primary text-primary-foreground"
                          : "text-foreground hover:bg-muted"
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                      aria-current={isActive ? "page" : undefined}
                    >
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </nav>
          )}
        </div>
      </header>

      {/* Search Dialog */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Rechercher un article</DialogTitle>
            <DialogDescription>
              Tapez votre recherche pour trouver des articles
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Input
              type="search"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              aria-label="Rechercher des articles"
            />
            {searchQuery && (
              <div className="space-y-2 max-h-80 overflow-y-auto" role="listbox" aria-label="Résultats de recherche">
                {searchResults.length > 0 ? (
                  searchResults.map((article) => (
                    <button
                      key={article.id}
                      className="w-full text-left p-3 rounded-lg hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
                      onClick={() => handleSearchSelect(article.slug)}
                      role="option"
                    >
                      <h4 className="font-medium text-foreground line-clamp-1">
                        {article.title}
                      </h4>
                      <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
                        {article.excerpt}
                      </p>
                    </button>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-4">
                    Aucun résultat pour "{searchQuery}"
                  </p>
                )}
              </div>
            )}
            <p className="text-xs text-muted-foreground text-center">
              <kbd className="px-2 py-1 bg-muted rounded text-xs">Ctrl</kbd> +{" "}
              <kbd className="px-2 py-1 bg-muted rounded text-xs">K</kbd> pour
              ouvrir la recherche
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
