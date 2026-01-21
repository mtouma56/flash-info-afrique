// Page de gestion des articles
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
  Edit,
  Eye,
  MoreHorizontal,
  Plus,
  Search,
  Star,
  StarOff,
  Trash2,
  ExternalLink,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import type { Article, Category } from "@shared/types/admin";

export default function AdminArticles() {
  const authFetch = useAuthFetch();
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [articleToDelete, setArticleToDelete] = useState<Article | null>(null);

  useEffect(() => {
    fetchArticles();
    fetchCategories();
  }, []);

  const fetchArticles = async () => {
    try {
      const response = await authFetch("/api/admin/articles");
      if (response.ok) {
        const data = await response.json();
        setArticles(data.items || data);
      }
    } catch (error) {
      console.error("Error fetching articles:", error);
      toast.error("Erreur lors du chargement des articles");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await authFetch("/api/admin/categories");
      if (response.ok) {
        const data = await response.json();
        setCategories(data);
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const handleToggleFeatured = async (article: Article) => {
    try {
      const response = await authFetch(
        `/api/admin/articles/${article.id}/featured`,
        {
          method: "PUT",
          body: JSON.stringify({ isFeatured: !article.isFeatured }),
        }
      );

      if (response.ok) {
        setArticles((prev) =>
          prev.map((a) =>
            a.id === article.id ? { ...a, isFeatured: !a.isFeatured } : a
          )
        );
        toast.success(
          article.isFeatured
            ? "Article retiré des favoris"
            : "Article mis en vedette"
        );
      }
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const handleDelete = async () => {
    if (!articleToDelete) return;

    try {
      const response = await authFetch(
        `/api/admin/articles/${articleToDelete.id}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        setArticles((prev) => prev.filter((a) => a.id !== articleToDelete.id));
        toast.success("Article supprimé");
      }
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeleteDialogOpen(false);
      setArticleToDelete(null);
    }
  };

  const filteredArticles = articles.filter((article) => {
    const matchesSearch =
      article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      article.excerpt.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      categoryFilter === "all" || article.category === categoryFilter;

    const matchesStatus =
      statusFilter === "all" || article.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getCategoryColor = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId);
    return category?.color || "#6b7280";
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find((c) => c.id === categoryId);
    return category?.name || categoryId;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "published":
        return <Badge variant="default">Publié</Badge>;
      case "draft":
        return <Badge variant="secondary">Brouillon</Badge>;
      case "archived":
        return <Badge variant="outline">Archivé</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <AdminLayout
      title="Articles"
      description="Gérez les articles de votre site"
    >
      <div className="space-y-6">
        {/* Barre d'outils */}
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-40">
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
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
                <SelectItem value="published">Publiés</SelectItem>
                <SelectItem value="draft">Brouillons</SelectItem>
                <SelectItem value="archived">Archivés</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Link href="/admin/articles/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouvel article
            </Button>
          </Link>
        </div>

        {/* Tableau des articles */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : filteredArticles.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-center">
                <p className="text-muted-foreground mb-4">
                  {searchQuery || categoryFilter !== "all" || statusFilter !== "all"
                    ? "Aucun article ne correspond à vos critères"
                    : "Aucun article pour le moment"}
                </p>
                {!searchQuery && categoryFilter === "all" && statusFilter === "all" && (
                  <Link href="/admin/articles/new">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Créer votre premier article
                    </Button>
                  </Link>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12"></TableHead>
                    <TableHead>Titre</TableHead>
                    <TableHead className="hidden md:table-cell">
                      Catégorie
                    </TableHead>
                    <TableHead className="hidden lg:table-cell">
                      Source
                    </TableHead>
                    <TableHead className="hidden sm:table-cell">
                      Statut
                    </TableHead>
                    <TableHead className="hidden lg:table-cell">Date</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredArticles.map((article) => (
                    <TableRow key={article.id}>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleToggleFeatured(article)}
                          className={
                            article.isFeatured
                              ? "text-yellow-500"
                              : "text-muted-foreground"
                          }
                        >
                          {article.isFeatured ? (
                            <Star className="h-4 w-4 fill-current" />
                          ) : (
                            <StarOff className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="font-medium line-clamp-1">
                            {article.title}
                          </span>
                          <span className="text-xs text-muted-foreground line-clamp-1">
                            {article.excerpt}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge
                          variant="outline"
                          style={{
                            borderColor: getCategoryColor(article.category),
                            color: getCategoryColor(article.category),
                          }}
                        >
                          {getCategoryName(article.category)}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <span className="text-sm text-muted-foreground">
                          {article.source.name}
                        </span>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        {getStatusBadge(article.status)}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <span className="text-sm text-muted-foreground">
                          {new Date(article.publishedAt).toLocaleDateString(
                            "fr-FR"
                          )}
                        </span>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/article/${article.slug}`}>
                                <Eye className="h-4 w-4 mr-2" />
                                Voir
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/admin/articles/${article.id}/edit`}>
                                <Edit className="h-4 w-4 mr-2" />
                                Modifier
                              </Link>
                            </DropdownMenuItem>
                            {article.source.url && (
                              <DropdownMenuItem asChild>
                                <a
                                  href={article.source.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  <ExternalLink className="h-4 w-4 mr-2" />
                                  Source originale
                                </a>
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => {
                                setArticleToDelete(article);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* Statistiques */}
        <div className="flex gap-4 text-sm text-muted-foreground">
          <span>
            {filteredArticles.length} article
            {filteredArticles.length > 1 ? "s" : ""}
            {filteredArticles.length !== articles.length &&
              ` sur ${articles.length}`}
          </span>
          <span>
            {filteredArticles.filter((a) => a.isFeatured).length} en vedette
          </span>
        </div>
      </div>

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer l'article ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. L'article "{articleToDelete?.title}
              " sera définitivement supprimé.
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
