// Page de création/édition d'article
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import AdminLayout from "./AdminLayout";
import { useAuthFetch } from "@/contexts/AuthContext";
import { ArrowLeft, Save, Eye, X, Plus, FolderOpen } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useRoute, useLocation } from "wouter";
import { toast } from "sonner";
import type { Article, Category, Dossier } from "@shared/types/admin";
import { Checkbox } from "@/components/ui/checkbox";

// Générer un slug à partir du titre
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Enlever les accents
    .replace(/[^a-z0-9]+/g, "-") // Remplacer les caractères non alphanumériques par des tirets
    .replace(/^-+|-+$/g, "") // Enlever les tirets au début et à la fin
    .substring(0, 100); // Limiter la longueur
}

export default function ArticleEdit() {
  const authFetch = useAuthFetch();
  const [, params] = useRoute("/admin/articles/:id/edit");
  const [, setLocation] = useLocation();
  const isNew = !params?.id || params.id === "new";

  const [categories, setCategories] = useState<Category[]>([]);
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [selectedDossierIds, setSelectedDossierIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    excerpt: "",
    content: "",
    category: "",
    tags: [] as string[],
    sourceName: "",
    sourceUrl: "",
    imageUrl: "",
    publishedAt: new Date().toISOString().split("T")[0],
    isFeatured: false,
    status: "draft" as "draft" | "published" | "archived",
  });

  const [newTag, setNewTag] = useState("");
  const [autoSlug, setAutoSlug] = useState(true);

  useEffect(() => {
    fetchCategories();
    fetchDossiers();
    if (!isNew && params?.id) {
      fetchArticle(params.id);
    }
  }, [isNew, params?.id]);

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

  const fetchDossiers = async () => {
    try {
      const response = await authFetch("/api/admin/dossiers");
      if (response.ok) {
        const data = await response.json();
        setDossiers(data);
        // If editing, find which dossiers contain this article
        if (!isNew && params?.id) {
          const articleDossiers = data.filter((d: Dossier) => 
            d.articleIds.includes(params.id!)
          );
          setSelectedDossierIds(articleDossiers.map((d: Dossier) => d.id));
        }
      }
    } catch (error) {
      console.error("Error fetching dossiers:", error);
    }
  };

  const fetchArticle = async (id: string) => {
    try {
      const response = await authFetch(`/api/admin/articles/${id}`);
      if (response.ok) {
        const article: Article = await response.json();
        setFormData({
          title: article.title,
          slug: article.slug,
          excerpt: article.excerpt,
          content: article.content,
          category: article.category,
          tags: article.tags,
          sourceName: article.source.name,
          sourceUrl: article.source.url,
          imageUrl: article.imageUrl,
          publishedAt: article.publishedAt.split("T")[0],
          isFeatured: article.isFeatured,
          status: article.status,
        });
        setAutoSlug(false); // Désactiver l'auto-slug pour l'édition
      }
    } catch (error) {
      console.error("Error fetching article:", error);
      toast.error("Erreur lors du chargement de l'article");
    } finally {
      setIsLoading(false);
    }
  };

  const handleTitleChange = (title: string) => {
    setFormData((prev) => ({
      ...prev,
      title,
      slug: autoSlug ? generateSlug(title) : prev.slug,
    }));
  };

  const handleAddTag = () => {
    const tag = newTag.trim();
    if (tag && !formData.tags.includes(tag)) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, tag],
      }));
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleDossierToggle = (dossierId: string) => {
    setSelectedDossierIds((prev) =>
      prev.includes(dossierId)
        ? prev.filter((id) => id !== dossierId)
        : [...prev, dossierId]
    );
  };

  const updateDossierArticleIds = async (articleId: string) => {
    // Update each dossier to add/remove this article from their articleIds
    for (const dossier of dossiers) {
      const shouldInclude = selectedDossierIds.includes(dossier.id);
      const currentlyIncludes = dossier.articleIds.includes(articleId);

      if (shouldInclude && !currentlyIncludes) {
        // Add article to dossier
        await authFetch(`/api/admin/dossiers/${dossier.id}`, {
          method: "PUT",
          body: JSON.stringify({
            ...dossier,
            articleIds: [...dossier.articleIds, articleId],
          }),
        });
      } else if (!shouldInclude && currentlyIncludes) {
        // Remove article from dossier
        await authFetch(`/api/admin/dossiers/${dossier.id}`, {
          method: "PUT",
          body: JSON.stringify({
            ...dossier,
            articleIds: dossier.articleIds.filter((id) => id !== articleId),
          }),
        });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Le titre est requis");
      return;
    }
    if (!formData.category) {
      toast.error("La catégorie est requise");
      return;
    }

    setIsSaving(true);

    try {
      const articleData = {
        title: formData.title,
        slug: formData.slug || generateSlug(formData.title),
        excerpt: formData.excerpt,
        content: formData.content,
        category: formData.category,
        tags: formData.tags,
        source: {
          name: formData.sourceName,
          url: formData.sourceUrl,
        },
        imageUrl: formData.imageUrl,
        publishedAt: formData.publishedAt,
        isFeatured: formData.isFeatured,
        status: formData.status,
      };

      const url = isNew
        ? "/api/admin/articles"
        : `/api/admin/articles/${params?.id}`;
      const method = isNew ? "POST" : "PUT";

      const response = await authFetch(url, {
        method,
        body: JSON.stringify(articleData),
      });

      if (response.ok) {
        const savedArticle = await response.json();
        // Update dossier associations
        await updateDossierArticleIds(savedArticle.id || params?.id);
        toast.success(isNew ? "Article créé" : "Article mis à jour");
        setLocation("/admin/articles");
      } else {
        const error = await response.json();
        toast.error(error.message || "Erreur lors de l'enregistrement");
      }
    } catch (error) {
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title={isNew ? "Nouvel article" : "Modifier l'article"}
      description={
        isNew
          ? "Créez un nouvel article"
          : "Modifiez les informations de l'article"
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Barre d'outils */}
        <div className="flex items-center justify-between">
          <Link href="/admin/articles">
            <Button variant="ghost" type="button">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </Link>
          <div className="flex gap-2">
            {!isNew && formData.slug && (
              <Link href={`/article/${formData.slug}`}>
                <Button variant="outline" type="button">
                  <Eye className="h-4 w-4 mr-2" />
                  Prévisualiser
                </Button>
              </Link>
            )}
            <Button type="submit" disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-6">
            {/* Informations principales */}
            <Card>
              <CardHeader>
                <CardTitle>Informations principales</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Titre *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="Titre de l'article"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="slug">Slug</Label>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="autoSlug" className="text-sm font-normal">
                        Auto
                      </Label>
                      <Switch
                        id="autoSlug"
                        checked={autoSlug}
                        onCheckedChange={setAutoSlug}
                      />
                    </div>
                  </div>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, slug: e.target.value }))
                    }
                    placeholder="slug-de-larticle"
                    disabled={autoSlug}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="excerpt">Extrait</Label>
                  <Textarea
                    id="excerpt"
                    value={formData.excerpt}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        excerpt: e.target.value,
                      }))
                    }
                    placeholder="Résumé de l'article..."
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Contenu</Label>
                  <Textarea
                    id="content"
                    value={formData.content}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        content: e.target.value,
                      }))
                    }
                    placeholder="Contenu de l'article..."
                    rows={15}
                    className="font-mono text-sm"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Source */}
            <Card>
              <CardHeader>
                <CardTitle>Source</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="sourceName">Nom de la source</Label>
                    <Input
                      id="sourceName"
                      value={formData.sourceName}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          sourceName: e.target.value,
                        }))
                      }
                      placeholder="Financial Afrik"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sourceUrl">URL de la source</Label>
                    <Input
                      id="sourceUrl"
                      type="url"
                      value={formData.sourceUrl}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          sourceUrl: e.target.value,
                        }))
                      }
                      placeholder="https://..."
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Colonne latérale */}
          <div className="space-y-6">
            {/* Publication */}
            <Card>
              <CardHeader>
                <CardTitle>Publication</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="status">Statut</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        status: value as "draft" | "published" | "archived",
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Brouillon</SelectItem>
                      <SelectItem value="published">Publié</SelectItem>
                      <SelectItem value="archived">Archivé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="publishedAt">Date de publication</Label>
                  <Input
                    id="publishedAt"
                    type="date"
                    value={formData.publishedAt}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        publishedAt: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="featured">Article en vedette</Label>
                  <Switch
                    id="featured"
                    checked={formData.isFeatured}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, isFeatured: checked }))
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Catégorie */}
            <Card>
              <CardHeader>
                <CardTitle>Catégorie *</CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={formData.category}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, category: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: cat.color }}
                          />
                          {cat.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            {/* Tags */}
            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Ajouter un tag..."
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                  />
                  <Button type="button" size="icon" onClick={handleAddTag}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                  {formData.tags.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      Aucun tag ajouté
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Dossiers */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FolderOpen className="h-4 w-4" />
                  Dossiers associés
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {dossiers.length > 0 ? (
                  dossiers.map((dossier) => (
                    <div key={dossier.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`dossier-${dossier.id}`}
                        checked={selectedDossierIds.includes(dossier.id)}
                        onCheckedChange={() => handleDossierToggle(dossier.id)}
                      />
                      <label
                        htmlFor={`dossier-${dossier.id}`}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {dossier.title}
                      </label>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Aucun dossier disponible.{" "}
                    <Link href="/admin/dossiers/new" className="text-primary hover:underline">
                      Créer un dossier
                    </Link>
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Image */}
            <Card>
              <CardHeader>
                <CardTitle>Image</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="imageUrl">URL de l'image</Label>
                  <Input
                    id="imageUrl"
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        imageUrl: e.target.value,
                      }))
                    }
                    placeholder="https://..."
                  />
                </div>
                {formData.imageUrl && (
                  <div className="aspect-video rounded-lg overflow-hidden bg-muted">
                    <img
                      src={formData.imageUrl}
                      alt="Aperçu"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </AdminLayout>
  );
}
