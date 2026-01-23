// Page de création/édition de dossier
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import AdminLayout from "./AdminLayout";
import { useAuthFetch } from "@/contexts/AuthContext";
import {
  ArrowLeft,
  Save,
  Eye,
  EyeOff,
  Plus,
  Trash2,
  GripVertical,
  Calendar,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useRoute, useLocation } from "wouter";
import { toast } from "sonner";
import type { Dossier, Article, TimelineEvent } from "@shared/types/admin";
import { nanoid } from "nanoid";

// Générer un slug à partir du titre
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 100);
}

export default function DossierEdit() {
  const authFetch = useAuthFetch();
  const [, params] = useRoute("/admin/dossiers/:id/edit");
  const [, setLocation] = useLocation();
  const isNew = !params?.id || params.id === "new";

  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState<{
    title: string;
    slug: string;
    description: string;
    articleIds: string[];
    timelineEvents: TimelineEvent[];
    isActive: boolean;
  }>({
    title: "",
    slug: "",
    description: "",
    articleIds: [],
    timelineEvents: [],
    isActive: true,
  });

  const [autoSlug, setAutoSlug] = useState(true);

  useEffect(() => {
    fetchArticles();
    if (!isNew && params?.id) {
      fetchDossier(params.id);
    }
  }, [isNew, params?.id]);

  const fetchArticles = async () => {
    try {
      const response = await authFetch("/api/admin/articles");
      if (response.ok) {
        const data = await response.json();
        setArticles(data.items || data);
      }
    } catch (error) {
      console.error("Error fetching articles:", error);
    }
  };

  const fetchDossier = async (id: string) => {
    try {
      const response = await authFetch(`/api/admin/dossiers/${id}`);
      if (response.ok) {
        const dossier: Dossier = await response.json();
        setFormData({
          title: dossier.title,
          slug: dossier.slug,
          description: dossier.description,
          articleIds: dossier.articleIds,
          timelineEvents: dossier.timelineEvents,
          isActive: dossier.isActive,
        });
        setAutoSlug(false);
      }
    } catch (error) {
      console.error("Error fetching dossier:", error);
      toast.error("Erreur lors du chargement du dossier");
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

  const handleArticleToggle = (articleId: string) => {
    setFormData((prev) => ({
      ...prev,
      articleIds: prev.articleIds.includes(articleId)
        ? prev.articleIds.filter((id) => id !== articleId)
        : [...prev.articleIds, articleId],
    }));
  };

  const handleAddTimelineEvent = () => {
    const newEvent: TimelineEvent = {
      id: nanoid(),
      date: new Date().toISOString().split("T")[0],
      title: "",
      description: "",
    };
    setFormData((prev) => ({
      ...prev,
      timelineEvents: [...prev.timelineEvents, newEvent],
    }));
  };

  const handleUpdateTimelineEvent = (
    id: string,
    field: keyof TimelineEvent,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      timelineEvents: prev.timelineEvents.map((event) =>
        event.id === id ? { ...event, [field]: value } : event
      ),
    }));
  };

  const handleRemoveTimelineEvent = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      timelineEvents: prev.timelineEvents.filter((event) => event.id !== id),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      toast.error("Le titre est requis");
      return;
    }

    setIsSaving(true);

    try {
      const dossierData = {
        ...formData,
        slug: formData.slug || generateSlug(formData.title),
      };

      const url = isNew
        ? "/api/admin/dossiers"
        : `/api/admin/dossiers/${params?.id}`;
      const method = isNew ? "POST" : "PUT";

      const response = await authFetch(url, {
        method,
        body: JSON.stringify(dossierData),
      });

      if (response.ok) {
        toast.success(isNew ? "Dossier créé" : "Dossier mis à jour");
        setLocation("/admin/dossiers");
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
      title={isNew ? "Nouveau dossier" : "Modifier le dossier"}
      description={
        isNew
          ? "Créez un nouveau dossier thématique"
          : "Modifiez les informations du dossier"
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Barre d'outils */}
        <div className="flex items-center justify-between">
          <Link href="/admin/dossiers">
            <Button variant="ghost" type="button">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </Link>
          <div className="flex gap-2">
            {!isNew && formData.slug && (
              <Link href={`/dossier-${formData.slug}`}>
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
                    placeholder="Titre du dossier"
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
                    placeholder="slug-du-dossier"
                    disabled={autoSlug}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Description du dossier..."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Chronologie */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Chronologie</CardTitle>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleAddTimelineEvent}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {formData.timelineEvents.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-4">
                    Aucun événement dans la chronologie
                  </p>
                ) : (
                  <div className="space-y-4">
                    {formData.timelineEvents.map((event, index) => (
                      <div key={event.id}>
                        {index > 0 && <Separator className="my-4" />}
                        <div className="flex gap-4">
                          <GripVertical className="h-5 w-5 text-muted-foreground mt-2 cursor-move" />
                          <div className="flex-1 space-y-3">
                            <div className="grid gap-3 sm:grid-cols-2">
                              <div className="space-y-2">
                                <Label>Date</Label>
                                <Input
                                  type="date"
                                  value={event.date}
                                  onChange={(e) =>
                                    handleUpdateTimelineEvent(
                                      event.id,
                                      "date",
                                      e.target.value
                                    )
                                  }
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Titre</Label>
                                <Input
                                  value={event.title}
                                  onChange={(e) =>
                                    handleUpdateTimelineEvent(
                                      event.id,
                                      "title",
                                      e.target.value
                                    )
                                  }
                                  placeholder="Titre de l'événement"
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label>Description</Label>
                              <Textarea
                                value={event.description}
                                onChange={(e) =>
                                  handleUpdateTimelineEvent(
                                    event.id,
                                    "description",
                                    e.target.value
                                  )
                                }
                                placeholder="Description de l'événement..."
                                rows={2}
                              />
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive shrink-0"
                            onClick={() => handleRemoveTimelineEvent(event.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Colonne latérale */}
          <div className="space-y-6">
            {/* Visibilité */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {formData.isActive ? (
                    <Eye className="h-4 w-4 text-green-600" />
                  ) : (
                    <EyeOff className="h-4 w-4 text-orange-600" />
                  )}
                  Visibilité
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Label htmlFor="isActive" className="flex items-center gap-2">
                    Afficher sur le site
                  </Label>
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, isActive: checked }))
                    }
                  />
                </div>
                <div className={`mt-3 p-2 rounded-md text-xs ${
                  formData.isActive 
                    ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400" 
                    : "bg-orange-50 text-orange-700 dark:bg-orange-950/30 dark:text-orange-400"
                }`}>
                  {formData.isActive ? (
                    <>Ce dossier est visible sur le site public.</>
                  ) : (
                    <>Ce dossier est masqué du site public mais reste accessible dans l'administration.</>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Articles associés */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Articles associés</CardTitle>
                  <Badge variant="secondary">
                    {formData.articleIds.length} sélectionné
                    {formData.articleIds.length > 1 ? "s" : ""}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {articles.length === 0 ? (
                  <p className="text-muted-foreground text-sm text-center py-4">
                    Aucun article disponible
                  </p>
                ) : (
                  <ScrollArea className="h-80">
                    <div className="space-y-2 pr-4">
                      {articles.map((article) => (
                        <div
                          key={article.id}
                          className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50"
                        >
                          <Checkbox
                            id={`article-${article.id}`}
                            checked={formData.articleIds.includes(article.id)}
                            onCheckedChange={() =>
                              handleArticleToggle(article.id)
                            }
                          />
                          <label
                            htmlFor={`article-${article.id}`}
                            className="flex-1 cursor-pointer"
                          >
                            <p className="text-sm font-medium line-clamp-2">
                              {article.title}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(article.publishedAt).toLocaleDateString(
                                "fr-FR"
                              )}
                            </p>
                          </label>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </AdminLayout>
  );
}
