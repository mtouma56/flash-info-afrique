// Page de modération des articles RSS en attente
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Check,
  X,
  Eye,
  Edit,
  ExternalLink,
  Filter,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  ArrowLeft,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import type { RSSArticle, Category, RSSFeed } from "@shared/types/admin";

export default function RSSPending() {
  const authFetch = useAuthFetch();
  const [articles, setArticles] = useState<RSSArticle[]>([]);
  const [feeds, setFeeds] = useState<RSSFeed[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filtres
  const [searchQuery, setSearchQuery] = useState("");
  const [feedFilter, setFeedFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("pending");

  // Dialogs
  const [previewArticle, setPreviewArticle] = useState<RSSArticle | null>(null);
  const [editArticle, setEditArticle] = useState<RSSArticle | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [articleToReject, setArticleToReject] = useState<RSSArticle | null>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // État d'édition
  const [editForm, setEditForm] = useState({
    title: "",
    excerpt: "",
    content: "",
    category: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [articlesRes, feedsRes, categoriesRes] = await Promise.all([
        authFetch("/api/admin/rss/pending"),
        authFetch("/api/admin/rss/feeds"),
        authFetch("/api/admin/categories"),
      ]);

      if (articlesRes.ok) {
        const data = await articlesRes.json();
        setArticles(data.items || data);
      }
      if (feedsRes.ok) {
        const data = await feedsRes.json();
        setFeeds(data);
      }
      if (categoriesRes.ok) {
        const data = await categoriesRes.json();
        setCategories(data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Erreur lors du chargement");
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (article: RSSArticle) => {
    try {
      const response = await authFetch(
        `/api/admin/rss/articles/${article.id}/approve`,
        { method: "POST" }
      );

      if (response.ok) {
        setArticles((prev) =>
          prev.map((a) =>
            a.id === article.id ? { ...a, status: "approved" } : a
          )
        );
        toast.success("Article approuvé et publié");
      }
    } catch (error) {
      toast.error("Erreur lors de l'approbation");
    }
  };

  const handleReject = async () => {
    if (!articleToReject) return;

    try {
      const response = await authFetch(
        `/api/admin/rss/articles/${articleToReject.id}/reject`,
        {
          method: "POST",
          body: JSON.stringify({ reason: rejectionReason }),
        }
      );

      if (response.ok) {
        setArticles((prev) =>
          prev.map((a) =>
            a.id === articleToReject.id
              ? { ...a, status: "rejected", rejectionReason }
              : a
          )
        );
        toast.success("Article rejeté");
      }
    } catch (error) {
      toast.error("Erreur lors du rejet");
    } finally {
      setRejectDialogOpen(false);
      setArticleToReject(null);
      setRejectionReason("");
    }
  };

  const handleEdit = (article: RSSArticle) => {
    setEditArticle(article);
    setEditForm({
      title: article.title,
      excerpt: article.excerpt,
      content: article.content,
      category: article.suggestedCategory || "",
    });
  };

  const handleSaveAndApprove = async () => {
    if (!editArticle) return;

    try {
      const response = await authFetch(
        `/api/admin/rss/articles/${editArticle.id}/edit`,
        {
          method: "POST",
          body: JSON.stringify({
            ...editForm,
            approve: true,
          }),
        }
      );

      if (response.ok) {
        setArticles((prev) =>
          prev.map((a) =>
            a.id === editArticle.id
              ? {
                  ...a,
                  ...editForm,
                  status: "approved",
                }
              : a
          )
        );
        toast.success("Article modifié et publié");
        setEditArticle(null);
      }
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement");
    }
  };

  const filteredArticles = articles.filter((article) => {
    const matchesSearch =
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.excerpt.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFeed = feedFilter === "all" || article.feedId === feedFilter;

    const matchesStatus =
      statusFilter === "all" || article.status === statusFilter;

    return matchesSearch && matchesFeed && matchesStatus;
  });

  const pendingCount = articles.filter((a) => a.status === "pending").length;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="h-4 w-4 text-orange-500" />;
      case "approved":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "rejected":
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="text-orange-600 border-orange-600">En attente</Badge>;
      case "approved":
        return <Badge variant="default" className="bg-green-600">Approuvé</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejeté</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <AdminLayout
      title="Modération RSS"
      description="Validez ou rejetez les articles importés depuis les flux RSS"
    >
      <div className="space-y-6">
        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Link href="/admin/rss">
            <Button variant="ghost">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour aux flux
            </Button>
          </Link>
          <Badge variant="outline" className="text-lg px-4 py-2">
            {pendingCount} en attente
          </Badge>
        </div>

        {/* Filtres */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={feedFilter} onValueChange={setFeedFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Source" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les sources</SelectItem>
                  {feeds.map((feed) => (
                    <SelectItem key={feed.id} value={feed.id}>
                      {feed.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="approved">Approuvés</SelectItem>
                  <SelectItem value="rejected">Rejetés</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Liste des articles */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : filteredArticles.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-64 text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
              <p className="text-muted-foreground">
                {statusFilter === "pending"
                  ? "Aucun article en attente de modération"
                  : "Aucun article correspondant aux critères"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredArticles.map((article) => (
              <Card key={article.id}>
                <CardContent className="pt-6">
                  <div className="flex flex-col lg:flex-row gap-4">
                    {/* Image */}
                    {article.imageUrl && (
                      <div className="lg:w-48 h-32 lg:h-auto shrink-0">
                        <img
                          src={article.imageUrl}
                          alt=""
                          className="w-full h-full object-cover rounded-lg"
                        />
                      </div>
                    )}

                    {/* Contenu */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            {getStatusIcon(article.status)}
                            <h3 className="font-semibold line-clamp-1">
                              {article.title}
                            </h3>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                            {article.excerpt}
                          </p>
                          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                            <span>{article.feedName}</span>
                            <span>
                              {new Date(article.pubDate).toLocaleDateString(
                                "fr-FR"
                              )}
                            </span>
                            {article.suggestedCategory && (
                              <Badge variant="secondary">
                                {categories.find(
                                  (c) => c.id === article.suggestedCategory
                                )?.name || article.suggestedCategory}
                              </Badge>
                            )}
                          </div>
                        </div>
                        {getStatusBadge(article.status)}
                      </div>

                      {/* Actions */}
                      {article.status === "pending" && (
                        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t">
                          <Button
                            size="sm"
                            onClick={() => handleApprove(article)}
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Approuver
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(article)}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Modifier
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setPreviewArticle(article)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Aperçu
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              setArticleToReject(article);
                              setRejectDialogOpen(true);
                            }}
                          >
                            <X className="h-4 w-4 mr-2" />
                            Rejeter
                          </Button>
                        </div>
                      )}

                      {article.status === "rejected" && article.rejectionReason && (
                        <div className="mt-4 pt-4 border-t">
                          <p className="text-sm text-destructive">
                            <strong>Raison du rejet :</strong>{" "}
                            {article.rejectionReason}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Statistiques */}
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>{filteredArticles.length} article{filteredArticles.length > 1 ? "s" : ""}</span>
        </div>
      </div>

      {/* Dialog de prévisualisation */}
      <Dialog
        open={!!previewArticle}
        onOpenChange={() => setPreviewArticle(null)}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{previewArticle?.title}</DialogTitle>
            <DialogDescription>
              Source : {previewArticle?.feedName} -{" "}
              {previewArticle &&
                new Date(previewArticle.pubDate).toLocaleDateString("fr-FR")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {previewArticle?.imageUrl && (
              <img
                src={previewArticle.imageUrl}
                alt=""
                className="w-full h-48 object-cover rounded-lg"
              />
            )}
            <p className="text-muted-foreground">{previewArticle?.excerpt}</p>
            <div className="prose prose-sm max-w-none">
              <p>{previewArticle?.content}</p>
            </div>
            {previewArticle?.link && (
              <a
                href={previewArticle.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary hover:underline"
              >
                <ExternalLink className="h-4 w-4" />
                Voir l'article original
              </a>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewArticle(null)}>
              Fermer
            </Button>
            {previewArticle?.status === "pending" && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setArticleToReject(previewArticle);
                    setRejectDialogOpen(true);
                    setPreviewArticle(null);
                  }}
                >
                  Rejeter
                </Button>
                <Button
                  onClick={() => {
                    handleApprove(previewArticle);
                    setPreviewArticle(null);
                  }}
                >
                  Approuver
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog d'édition */}
      <Dialog open={!!editArticle} onOpenChange={() => setEditArticle(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Modifier avant publication</DialogTitle>
            <DialogDescription>
              Modifiez l'article avant de l'approuver
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="editTitle">Titre</Label>
              <Input
                id="editTitle"
                value={editForm.title}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, title: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editExcerpt">Extrait</Label>
              <Textarea
                id="editExcerpt"
                value={editForm.excerpt}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, excerpt: e.target.value }))
                }
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editContent">Contenu</Label>
              <Textarea
                id="editContent"
                value={editForm.content}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, content: e.target.value }))
                }
                rows={10}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editCategory">Catégorie</Label>
              <Select
                value={editForm.category}
                onValueChange={(value) =>
                  setEditForm((prev) => ({ ...prev, category: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditArticle(null)}>
              Annuler
            </Button>
            <Button onClick={handleSaveAndApprove}>
              Enregistrer et publier
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de rejet */}
      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rejeter l'article ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cet article ne sera pas publié. Vous pouvez indiquer une raison
              pour le rejet.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Label htmlFor="rejectReason">Raison du rejet (optionnel)</Label>
            <Textarea
              id="rejectReason"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Contenu non pertinent, doublon, etc."
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Rejeter
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
