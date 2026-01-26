// Dashboard principal de l'admin
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  FolderOpen,
  Plus,
  Rss,
  Tag,
  TrendingUp,
  Clock,
  Star,
  ArrowRight,
} from "lucide-react";
import { Link } from "wouter";
import AdminLayout from "./AdminLayout";
import { useEffect, useState } from "react";
import type { DashboardStats } from "@shared/types/admin";
import { useAuthFetch } from "@/contexts/AuthContext";

export default function AdminDashboard() {
  // #region agent log
  console.log("[DASHBOARD] Component rendering");
  if (typeof window !== 'undefined') {
    fetch('http://127.0.0.1:7242/ingest/a1d61db1-cb31-40e2-8e3d-081974469abb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Dashboard.tsx:28',message:'Dashboard component render',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
  }
  // #endregion
  const authFetch = useAuthFetch();
  // #region agent log
  console.log("[DASHBOARD] useAuthFetch called", { hasAuthFetch: !!authFetch });
  if (typeof window !== 'undefined') {
    fetch('http://127.0.0.1:7242/ingest/a1d61db1-cb31-40e2-8e3d-081974469abb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Dashboard.tsx:30',message:'after useAuthFetch',data:{hasAuthFetch:!!authFetch},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
  }
  // #endregion
  const [stats, setStats] = useState<DashboardStats>({
    totalArticles: 0,
    publishedArticles: 0,
    draftArticles: 0,
    featuredArticles: 0,
    totalDossiers: 0,
    activeDossiers: 0,
    totalCategories: 0,
    totalRSSFeeds: 0,
    enabledRSSFeeds: 0,
    pendingRSSArticles: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      // #region agent log
      console.log("[DASHBOARD] fetchStats starting");
      fetch('http://127.0.0.1:7242/ingest/a1d61db1-cb31-40e2-8e3d-081974469abb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Dashboard.tsx:45',message:'fetchStats start',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
      // #endregion
      try {
        // #region agent log
        console.log("[DASHBOARD] Calling authFetch('/api/admin/stats')");
        fetch('http://127.0.0.1:7242/ingest/a1d61db1-cb31-40e2-8e3d-081974469abb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Dashboard.tsx:47',message:'before authFetch call',data:{url:'/api/admin/stats'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
        // #endregion
        const response = await authFetch("/api/admin/stats");
        // #region agent log
        console.log("[DASHBOARD] authFetch response", { status: response.status, ok: response.ok });
        fetch('http://127.0.0.1:7242/ingest/a1d61db1-cb31-40e2-8e3d-081974469abb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Dashboard.tsx:48',message:'after authFetch call',data:{status:response.status,ok:response.ok},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
        // #endregion
        if (response.ok) {
          const data = await response.json();
          setStats(data);
          console.log("[DASHBOARD] Stats loaded successfully");
        } else {
          console.error("[DASHBOARD] Stats API returned error", { status: response.status });
        }
      } catch (error) {
        console.error("[DASHBOARD] Error fetching stats:", error);
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/a1d61db1-cb31-40e2-8e3d-081974469abb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Dashboard.tsx:53',message:'fetchStats catch error',data:{error:error instanceof Error?error.message:String(error),errorName:error instanceof Error?error.name:null,stack:error instanceof Error?error.stack:null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'G'})}).catch(()=>{});
        // #endregion
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const statCards = [
    {
      title: "Articles",
      value: stats.totalArticles,
      description: `${stats.publishedArticles} publiés, ${stats.draftArticles} brouillons`,
      icon: FileText,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      href: "/admin/articles",
    },
    {
      title: "Dossiers",
      value: stats.totalDossiers,
      description: `${stats.activeDossiers} actifs`,
      icon: FolderOpen,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      href: "/admin/dossiers",
    },
    {
      title: "Catégories",
      value: stats.totalCategories,
      description: "Catégories configurées",
      icon: Tag,
      color: "text-green-600",
      bgColor: "bg-green-50",
      href: "/admin/categories",
    },
    {
      title: "Flux RSS",
      value: stats.totalRSSFeeds,
      description: `${stats.enabledRSSFeeds} actifs, ${stats.pendingRSSArticles} en attente`,
      icon: Rss,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      href: "/admin/rss",
      badge: stats.pendingRSSArticles > 0 ? stats.pendingRSSArticles : undefined,
    },
  ];

  const quickActions = [
    {
      title: "Nouvel article",
      description: "Créer un nouvel article",
      icon: FileText,
      href: "/admin/articles/new",
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Nouveau dossier",
      description: "Créer un dossier thématique",
      icon: FolderOpen,
      href: "/admin/dossiers/new",
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      title: "Ajouter un flux RSS",
      description: "Configurer une nouvelle source",
      icon: Rss,
      href: "/admin/rss/feeds/new",
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      title: "Modérer les articles",
      description: "Valider les articles en attente",
      icon: Clock,
      href: "/admin/rss/pending",
      color: "text-red-600",
      bgColor: "bg-red-50",
      badge: stats.pendingRSSArticles > 0 ? stats.pendingRSSArticles : undefined,
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* En-tête */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Tableau de bord</h1>
            <p className="text-muted-foreground mt-1">
              Vue d'ensemble de votre site et accès rapide aux fonctionnalités
            </p>
          </div>
          <Link href="/admin/articles/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouvel article
            </Button>
          </Link>
        </div>

        {/* Statistiques */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Link key={stat.href} href={stat.href}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </CardTitle>
                    <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                      <Icon className={`h-4 w-4 ${stat.color}`} />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold">
                          {isLoading ? (
                            <span className="inline-block w-8 h-8 bg-muted animate-pulse rounded" />
                          ) : (
                            stat.value
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {stat.description}
                        </p>
                      </div>
                      {stat.badge && (
                        <Badge variant="destructive">{stat.badge}</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        {/* Actions rapides */}
        <div>
          <h2 className="text-xl font-bold mb-4">Actions rapides</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link key={action.href} href={action.href}>
                  <Card className="hover:shadow-md transition-all hover:scale-[1.02] cursor-pointer h-full">
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-4">
                        <div className={`p-3 rounded-lg ${action.bgColor}`}>
                          <Icon className={`h-5 w-5 ${action.color}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold truncate">
                              {action.title}
                            </h3>
                            {action.badge && (
                              <Badge variant="destructive" className="shrink-0">
                                {action.badge}
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {action.description}
                          </p>
                        </div>
                        <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Sections supplémentaires */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Articles en vedette */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5 text-yellow-500" />
                    Articles en vedette
                  </CardTitle>
                  <CardDescription>
                    {stats.featuredArticles} articles mis en avant
                  </CardDescription>
                </div>
                <Link href="/admin/articles?featured=true">
                  <Button variant="outline" size="sm">
                    Voir tout
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {stats.featuredArticles === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-4">
                  Aucun article en vedette
                </p>
              ) : (
                <p className="text-muted-foreground text-sm">
                  Gérez les articles qui apparaissent en première position sur
                  votre site.
                </p>
              )}
            </CardContent>
          </Card>

          {/* Activité récente */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                    Activité récente
                  </CardTitle>
                  <CardDescription>
                    Dernières actions sur le site
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm text-center py-4">
                L'historique des activités sera disponible prochainement
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
