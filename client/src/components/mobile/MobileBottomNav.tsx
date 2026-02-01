import { Home, Newspaper, FolderOpen, Grid3X3 } from "lucide-react";
import { Link, useLocation } from "wouter";

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { name: "Accueil", href: "/", icon: Home },
  { name: "Articles", href: "/articles", icon: Newspaper },
  { name: "Dossiers", href: "/dossiers", icon: FolderOpen },
  { name: "Catégories", href: "/categories", icon: Grid3X3 },
];

export default function MobileBottomNav() {
  const [location] = useLocation();

  // Check if current location matches any category
  const isCategoryActive = location.startsWith("/categorie/");

  return (
    <nav 
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 safe-area-inset-bottom"
      aria-label="Navigation principale"
    >
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          // Special handling for categories - show active on any category page
          const isActive = item.href === "/categories" 
            ? isCategoryActive 
            : location === item.href;
          
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              href={item.href === "/categories" ? "/articles" : item.href}
              className={`flex flex-col items-center justify-center flex-1 py-2 px-1 min-h-[44px] rounded-lg transition-colors ${
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground active:text-foreground"
              }`}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon 
                className={`h-5 w-5 mb-1 ${isActive ? "text-primary" : ""}`} 
                aria-hidden="true" 
              />
              <span className={`text-xs font-medium ${isActive ? "text-primary" : ""}`}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
      {/* Safe area padding for iOS */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
