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
import { Search, X, MoreVertical } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import ThemeToggle from "../ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function MobileHeader() {
  const [, setLocation] = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { articles } = useArticles();

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
        <div className="flex h-14 items-center justify-between px-4">
          {/* Logo - compact version */}
          <Link
            href="/"
            className="flex items-center hover:opacity-80 transition-opacity"
            aria-label="Flash Info Afrique - Accueil"
          >
            <img 
              src="/logo.png" 
              alt="Flash Info Afrique" 
              className="h-10 w-auto object-contain"
            />
          </Link>

          {/* Right Actions */}
          <div className="flex items-center space-x-1">
            {/* Search button */}
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10"
              onClick={() => setSearchOpen(true)}
              aria-label="Rechercher"
            >
              <Search className="h-5 w-5" aria-hidden="true" />
            </Button>

            {/* Theme Toggle */}
            <ThemeToggle />

            {/* More menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10"
                  aria-label="Plus d'options"
                >
                  <MoreVertical className="h-5 w-5" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                  <Link href="/mentions-legales" className="w-full cursor-pointer">
                    Mentions légales
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/confidentialite" className="w-full cursor-pointer">
                    Confidentialité
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/conditions-utilisation" className="w-full cursor-pointer">
                    Conditions d'utilisation
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Search Dialog */}
      <Dialog open={searchOpen} onOpenChange={setSearchOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg top-[10%] translate-y-0">
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
              className="h-12 text-base"
            />
            {searchQuery && (
              <div className="space-y-2 max-h-[50vh] overflow-y-auto" role="listbox" aria-label="Résultats de recherche">
                {searchResults.length > 0 ? (
                  <>
                    <p className="text-xs text-muted-foreground mb-2">
                      {searchResults.length} résultat{searchResults.length > 1 ? 's' : ''} trouvé{searchResults.length > 1 ? 's' : ''}
                    </p>
                    {searchResults.map((article) => (
                      <button
                        key={article.id}
                        className="w-full text-left p-3 rounded-lg hover:bg-muted active:bg-muted/80 transition-colors focus:outline-none focus:ring-2 focus:ring-primary border border-transparent hover:border-border"
                        onClick={() => handleSearchSelect(article.slug)}
                        role="option"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-medium text-foreground line-clamp-2 flex-1 text-sm">
                            {highlightMatch(article.title, searchQuery)}
                          </h4>
                          {article.category && (
                            <span className={`text-xs px-2 py-0.5 rounded-full whitespace-nowrap ${categoryColors[article.category] || 'bg-muted text-muted-foreground'}`}>
                              {article.category.replace(/-/g, ' ')}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                          {highlightMatch(article.excerpt.slice(0, 100), searchQuery)}
                          {article.excerpt.length > 100 ? '...' : ''}
                        </p>
                      </button>
                    ))}
                  </>
                ) : (
                  <div className="text-center py-6">
                    <Search className="h-10 w-10 text-muted-foreground/50 mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm">
                      Aucun résultat pour "<span className="font-medium">{searchQuery}</span>"
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
