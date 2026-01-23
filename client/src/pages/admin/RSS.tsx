// Page principale de gestion des flux RSS
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import AdminLayout from "./AdminLayout";
import { useAuthFetch } from "@/contexts/AuthContext";
import {
  Clock,
  Edit,
  ExternalLink,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Rss,
  Trash2,
  AlertCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import type { RSSFeed, RSSArticle } from "@shared/types/admin";

export default function AdminRSS() {
  const authFetch = useAuthFetch();
  const [feeds, setFeeds] = useState<RSSFeed[]>([]);
  const [pendingArticles, setPendingArticles] = useState<RSSArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [feedToDelete, setFeedToDelete] = useState<RSSFeed | null>(null);
  const [fetchingFeedId, setFetchingFeedId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [feedsResponse, pendingResponse] = await Promise.all([
        authFetch("/api/admin/rss/feeds"),
        authFetch("/api/admin/rss/pending"),
      ]);

      if (feedsResponse.ok) {
        const data = await feedsResponse.json();
        setFeeds(data);
      }

      if (pendingResponse.ok) {
        const data = await pendingResponse.json();
        setPendingArticles(data.items || data);
      }
    } catch (error) {
      console.error("Error fetching RSS data:", error);
      toast.error("Erreur lors du chargement des données RSS");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleEnabled = async (feed: RSSFeed) => {
    try {
      const response = await authFetch(`/api/admin/rss/feeds/${feed.id}`, {
        method: "PUT",
        body: JSON.stringify({ ...feed, enabled: !feed.enabled }),
      });

      if (response.ok) {
        setFeeds((prev) =>
          prev.map((f) =>
            f.id === feed.id ? { ...f, enabled: !f.enabled } : f
          )
        );
        toast.success(feed.enabled ? "Flux désactivé" : "Flux activé");
      }
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const handleFetchFeed = async (feedId: string) => {
    setFetchingFeedId(feedId);
    try {
      const response = await authFetch(
        `/api/admin/rss/feeds/${feedId}/fetch`,
        { method: "POST" }
      );

      if (response.ok) {
        const data = await response.json();
        toast.success(`${data.newArticles || 0} nouveaux articles importés`);
        fetchData(); // Recharger les données
      } else {
        const error = await response.json();
        toast.error(error.message || "Erreur lors de la récupération du flux");
      }
    } catch (error) {
      toast.error("Erreur lors de la récupération du flux");
    } finally {
      setFetchingFeedId(null);
    }
  };

  const handleDelete = async () => {
    if (!feedToDelete) return;

    try {
      const response = await authFetch(
        `/api/admin/rss/feeds/${feedToDelete.id}`,
        { method: "DELETE" }
      );

      if (response.ok) {
        setFeeds((prev) => prev.filter((f) => f.id !== feedToDelete.id));
        toast.success("Flux supprimé");
      }
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeleteDialogOpen(false);
      setFeedToDelete(null);
    }
  };

  const pendingCount = pendingArticles.filter(
    (a) => a.status === "pending"
  ).length;

  return (
    <AdminLayout
      title="Flux RSS"
      description="Gérez les sources RSS et modérez les articles importés"
    >
      <Tabs defaultValue="feeds" className="space-y-6">
        <TabsList>
          <TabsTrigger value="feeds" className="gap-2">
            <Rss className="h-4 w-4" />
            Flux configurés
          </TabsTrigger>
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="h-4 w-4" />
            En attente
            {pendingCount > 0 && (
              <Badge variant="destructive" className="ml-1">
                {pendingCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Onglet Flux */}
        <TabsContent value="feeds" className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <p className="text-muted-foreground">
              {feeds.length} flux configuré{feeds.length > 1 ? "s" : ""}
            </p>
            <Link href="/admin/rss/feeds/new">
              <Button className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Ajouter un flux
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            </div>
          ) : feeds.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-64 text-center">
                <Rss className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground mb-4">
                  Aucun flux RSS configuré
                </p>
                <Link href="/admin/rss/feeds/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter votre premier flux
                  </Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {feeds.map((feed) => (
                <Card
                  key={feed.id}
                  className={`${!feed.enabled ? "opacity-60" : ""}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row items-start sm:justify-between gap-3">
                      <div className="flex-1 min-w-0 w-full sm:w-auto">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-1">
                          <CardTitle className="text-base sm:text-lg truncate">
                            {feed.name}
                          </CardTitle>
                          <div className="flex flex-wrap gap-1 sm:gap-2">
                            {!feed.enabled && (
                              <Badge variant="secondary">Désactivé</Badge>
                            )}
                            {feed.autoPublish ? (
                              <Badge variant="outline" className="text-blue-600 border-blue-600 text-xs">
                                Pré-approuvé
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-orange-600 border-orange-600 text-xs">
                                Modération requise
                              </Badge>
                            )}
                          </div>
                        </div>
                        <CardDescription className="truncate text-xs sm:text-sm">
                          {feed.url}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2 self-end sm:self-start">
                        <Switch
                          checked={feed.enabled}
                          onCheckedChange={() => handleToggleEnabled(feed)}
                        />
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleFetchFeed(feed.id)}
                              disabled={fetchingFeedId === feed.id}
                            >
                              <RefreshCw
                                className={`h-4 w-4 mr-2 ${
                                  fetchingFeedId === feed.id ? "animate-spin" : ""
                                }`}
                              />
                              Récupérer maintenant
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <a
                                href={feed.url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                <ExternalLink className="h-4 w-4 mr-2" />
                                Voir le flux
                              </a>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/rss/feeds/${feed.id}/edit`}>
                                <Edit className="h-4 w-4 mr-2" />
                                Modifier
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => {
                                setFeedToDelete(feed);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      {feed.lastFetch && (
                        <div className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          Dernier import:{" "}
                          {new Date(feed.lastFetch).toLocaleString("fr-FR")}
                        </div>
                      )}
                      {feed.lastError && (
                        <div className="flex items-center gap-1 text-destructive">
                          <AlertCircle className="h-4 w-4" />
                          Erreur
                        </div>
                      )}
                      {feed.filters.keywords && feed.filters.keywords.length > 0 && (
                        <div className="flex items-center gap-1">
                          {feed.filters.keywords.length} filtre
                          {feed.filters.keywords.length > 1 ? "s" : ""}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Onglet En attente */}
        <TabsContent value="pending" className="space-y-6">
          <div className="flex items-center justify-between">
            <p className="text-muted-foreground">
              {pendingCount} article{pendingCount > 1 ? "s" : ""} en attente de
              modération
            </p>
            <Link href="/admin/rss/pending">
              <Button variant="outline">
                Voir tout
              </Button>
            </Link>
          </div>

          {pendingArticles.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center h-64 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
                <p className="text-muted-foreground">
                  Aucun article en attente de modération
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pendingArticles.slice(0, 5).map((article) => (
                <Card key={article.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium line-clamp-1">
                          {article.title}
                        </h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {article.excerpt}
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          <span>{article.feedName}</span>
                          <span>
                            {new Date(article.pubDate).toLocaleDateString(
                              "fr-FR"
                            )}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Badge
                          variant={
                            article.status === "pending"
                              ? "outline"
                              : article.status === "approved"
                              ? "default"
                              : "destructive"
                          }
                        >
                          {article.status === "pending"
                            ? "En attente"
                            : article.status === "approved"
                            ? "Approuvé"
                            : "Rejeté"}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {pendingArticles.length > 5 && (
                <div className="text-center">
                  <Link href="/admin/rss/pending">
                    <Button variant="outline">
                      Voir les {pendingArticles.length - 5} autres articles
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le flux ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le flux "{feedToDelete?.name}" et
              tous les articles en attente associés seront supprimés.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
