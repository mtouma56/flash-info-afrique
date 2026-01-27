import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useArticles } from "@/hooks/useArticles";
import { useDossiers } from "@/hooks/useDossiers";
import { ChevronDown, Menu, Search, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import FeaturedDossierBar from "./FeaturedDossierBar";
import ThemeToggle from "./ThemeToggle";

export default function Header() {
  const [location, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { articles } = useArticles();
  const { dossiers, isLoading: isDossiersLoading } = useDossiers();

  // Derive the featured dossier (same logic as Home page)
  const featuredDossier = useMemo(() => {
    const featuredDossiers = dossiers
      .filter(d => d.isFeatured && d.isActive)
      .sort((a, b) => {
        if (a.order !== undefined && b.order !== undefined) return a.order - b.order;
        if (a.order !== undefined) return -1;
        if (b.order !== undefined) return 1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
    return featuredDossiers[0] || null;
  }, [dossiers]);

  // Show featured dossier bar on all pages except home
  const showFeaturedDossierBar = location !== "/" && !isDossiersLoading && featuredDossier;

  // Main navigation items
  const mainNavigation = [
    { name: "Accueil", href: "/" },
    { name: "Tous les articles", href: "/articles" },
    { name: "Dossiers", href: "/dossiers" },
  ];

  // Category items for dropdown
  const categoryNavigation = [
    { name: "Banque & Finance", href: "/categorie/banque-finance" },
    { name: "Régulation", href: "/categorie/regulation-conformite" },
    { name: "Marchés", href: "/categorie/marches-investissements" },
  ];

  // Combined for mobile navigation
  const navigation = [...mainNavigation, ...categoryNavigation];

  // Check if any category is active
  const isCategoryActive = categoryNavigation.some(cat => location === cat.href);

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

  // Highlight matching text in search results
  const highlightMatch = useCallback((text: string, query: string) => {
    if (!query.trim()) return text;
    
    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    
    return parts.map((part, index) => 
      regex.test(part) ? (
        <mark key={index} className="bg-primary/20 text-primary font-medium rounded px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    );
  }, []);

  // Category colors map
  const categoryColors: Record<string, string> = {
    'banque-finance': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
    'regulation-conformite': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    'marches-investissements': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300',
    'analyses-decryptages': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    'actualite': 'bg-lime-100 text-lime-800 dark:bg-lime-900/30 dark:text-lime-300',
  };

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
              {mainNavigation.map((item) => {
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
              
              {/* Categories Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors inline-flex items-center gap-1 ${
                    isCategoryActive
                      ? "bg-primary text-primary-foreground"
                      : "text-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  Catégories
                  <ChevronDown className="h-4 w-4" aria-hidden="true" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  {categoryNavigation.map((item) => {
                    const isActive = location === item.href;
                    return (
                      <DropdownMenuItem key={item.name} asChild>
                        <Link
                          href={item.href}
                          className={`w-full cursor-pointer ${
                            isActive ? "bg-primary/10 text-primary font-medium" : ""
                          }`}
                        >
                          {item.name}
                        </Link>
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>

            {/* Right Actions */}
            <div className="flex items-center space-x-1 sm:space-x-2">
              {/* Desktop/Tablet Search Bar - Visible from md breakpoint */}
              <button
                onClick={() => setSearchOpen(true)}
                className="hidden md:flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground bg-muted/50 hover:bg-muted border border-border rounded-lg transition-colors min-w-[200px] xl:min-w-[280px]"
                aria-label="Rechercher (Ctrl+K)"
              >
                <Search className="h-4 w-4" aria-hidden="true" />
                <span className="flex-1 text-left">Rechercher...</span>
                <kbd className="hidden xl:inline-flex items-center gap-1 px-1.5 py-0.5 text-xs font-mono bg-background border border-border rounded">
                  <span className="text-xs">⌘</span>K
                </kbd>
              </button>
              {/* Search icon for small tablet */}
              <Button
                variant="ghost"
                size="icon"
                className="hidden sm:flex md:hidden h-11 w-11 min-h-[44px] min-w-[44px]"
                onClick={() => setSearchOpen(true)}
                aria-label="Rechercher (Ctrl+K)"
              >
                <Search className="h-5 w-5" aria-hidden="true" />
              </Button>
              <ThemeToggle />
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

      {/* Featured Dossier Bar - shown on all pages except home */}
      {showFeaturedDossierBar && (
        <FeaturedDossierBar dossier={{ slug: featuredDossier.slug, title: featuredDossier.title }} />
      )}

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
                  <>
                    <p className="text-xs text-muted-foreground mb-2">
                      {searchResults.length} résultat{searchResults.length > 1 ? 's' : ''} trouvé{searchResults.length > 1 ? 's' : ''}
                    </p>
                    {searchResults.map((article) => (
                      <button
                        key={article.id}
                        className="w-full text-left p-3 rounded-lg hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary border border-transparent hover:border-border"
                        onClick={() => handleSearchSelect(article.slug)}
                        role="option"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-medium text-foreground line-clamp-1 flex-1">
                            {highlightMatch(article.title, searchQuery)}
                          </h4>
                          {article.category && (
                            <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${categoryColors[article.category] || 'bg-muted text-muted-foreground'}`}>
                              {article.category.replace(/-/g, ' ')}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {highlightMatch(article.excerpt.slice(0, 120), searchQuery)}
                          {article.excerpt.length > 120 ? '...' : ''}
                        </p>
                        {article.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {article.tags.slice(0, 3).map((tag) => (
                              <span key={tag} className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </button>
                    ))}
                  </>
                ) : (
                  <div className="text-center py-8">
                    <Search className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                    <p className="text-muted-foreground">
                      Aucun résultat pour "<span className="font-medium">{searchQuery}</span>"
                    </p>
                    <p className="text-sm text-muted-foreground/70 mt-1">
                      Essayez avec d'autres mots-clés
                    </p>
                  </div>
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
