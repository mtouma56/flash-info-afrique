// Layout pour toutes les pages admin
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import {
  FileText,
  FolderOpen,
  Home,
  LayoutDashboard,
  LogOut,
  Menu,
  Rss,
  Settings,
  Tag,
  Users,
  X,
  ChevronRight,
} from "lucide-react";
import { ReactNode, useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
}

export default function AdminLayout({
  children,
  title,
  description,
}: AdminLayoutProps) {
  const { logout, user } = useAuth();
  const [location, setLocation] = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [pendingRSSCount, setPendingRSSCount] = useState(0);

  // #region agent log
  if (typeof window !== 'undefined') {
    fetch('http://127.0.0.1:7242/ingest/a1d61db1-cb31-40e2-8e3d-081974469abb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AdminLayout.tsx:36',message:'AdminLayout render',data:{hasUser:!!user,userId:user?.id,username:user?.username,location},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
  }
  // #endregion

  // Fermer la sidebar sur mobile lors d'un changement de page
  useEffect(() => {
    setSidebarOpen(false);
  }, [location]);

  // TODO: Récupérer le nombre d'articles RSS en attente
  useEffect(() => {
    // Simulation pour l'instant
    setPendingRSSCount(0);
  }, []);

  const handleLogout = () => {
    logout();
    toast.success("Déconnexion réussie");
    setLocation("/admin/login");
  };

  const navigation = [
    {
      name: "Tableau de bord",
      href: "/admin",
      icon: LayoutDashboard,
      exact: true,
    },
    { name: "Articles", href: "/admin/articles", icon: FileText },
    { name: "Dossiers", href: "/admin/dossiers", icon: FolderOpen },
    { name: "Catégories", href: "/admin/categories", icon: Tag },
    {
      name: "Flux RSS",
      href: "/admin/rss",
      icon: Rss,
      badge: pendingRSSCount > 0 ? pendingRSSCount : undefined,
    },
    { name: "Utilisateurs", href: "/admin/users", icon: Users, adminOnly: true },
    { name: "Paramètres", href: "/admin/settings", icon: Settings },
  ];

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return location === href;
    return location === href || location.startsWith(href + "/");
  };

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <Link href="/admin">
          <div className="flex items-center gap-3">
            <img 
              src="/logo.png" 
              alt="Flash Info Afrique" 
              className="h-10 w-auto object-contain"
            />
            <div>
              <p className="text-xs text-muted-foreground">Administration</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-4">
        <nav className="px-3 space-y-1">
          {navigation
            .filter((item) => !item.adminOnly || user?.role === "admin")
            .map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href, item.exact);
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={active ? "secondary" : "ghost"}
                    className={`w-full justify-start gap-3 ${
                      active ? "font-medium" : ""
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="flex-1 text-left">{item.name}</span>
                    {item.badge && (
                      <Badge
                        variant="destructive"
                        className="h-5 min-w-5 px-1.5 text-xs"
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </Button>
                </Link>
              );
            })}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="p-3 border-t border-border space-y-2">
        <Link href="/">
          <Button variant="ghost" className="w-full justify-start gap-3">
            <Home className="h-4 w-4" />
            Voir le site
          </Button>
        </Link>

        <Separator />

        <div className="px-3 py-2">
          <p className="text-sm font-medium">{user?.username || "Admin"}</p>
          <p className="text-xs text-muted-foreground">
            {user?.role === "admin" ? "Administrateur" : "Éditeur"}
          </p>
        </div>

        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4" />
          Déconnexion
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-background border-b border-border z-40 flex items-center px-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="h-11 w-11 min-h-[44px] min-w-[44px]"
          aria-label={sidebarOpen ? "Fermer le menu" : "Ouvrir le menu"}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <span className="ml-3 font-semibold text-sm sm:text-base truncate">Administration</span>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 w-64 bg-background border-r border-border z-50 transform transition-transform duration-200 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Mobile close button */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden absolute top-4 right-4"
          onClick={() => setSidebarOpen(false)}
        >
          <X className="h-4 w-4" />
        </Button>

        <Sidebar />
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        <main className="min-h-screen pt-16 lg:pt-0">
          {/* Page header */}
          {(title || description) && (
            <div className="bg-background border-b border-border px-4 sm:px-6 py-4 sm:py-6">
              <div className="max-w-7xl mx-auto">
                {/* Breadcrumb */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Link href="/admin" className="hover:text-foreground">
                    Admin
                  </Link>
                  {title && (
                    <>
                      <ChevronRight className="h-4 w-4" />
                      <span className="text-foreground">{title}</span>
                    </>
                  )}
                </div>

                {title && (
                  <h1 className="text-xl sm:text-2xl font-bold text-foreground">
                    {title}
                  </h1>
                )}
                {description && (
                  <p className="text-muted-foreground mt-1">{description}</p>
                )}
              </div>
            </div>
          )}

          {/* Page content */}
          <div className="p-4 sm:p-6">
            <div className="max-w-7xl mx-auto">{children}</div>
          </div>
        </main>
      </div>
    </div>
  );
}
