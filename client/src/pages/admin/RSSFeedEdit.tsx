// Page de création/édition de flux RSS
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { ArrowLeft, Save, Plus, X, RefreshCw, AlertCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useRoute, useLocation } from "wouter";
import { toast } from "sonner";
import type { RSSFeed, Category } from "@shared/types/admin";

export default function RSSFeedEdit() {
  const authFetch = useAuthFetch();
  const [, params] = useRoute("/admin/rss/feeds/:id/edit");
  const [, setLocation] = useLocation();
  const isNew = !params?.id || params.id === "new";

  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(!isNew);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    articleCount?: number;
  } | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    url: "",
    enabled: true,
    autoPublish: false,
    defaultCategory: "__none__",
    keywords: [] as string[],
    excludeKeywords: [] as string[],
    minLength: 0,
  });

  const [newKeyword, setNewKeyword] = useState("");
  const [newExcludeKeyword, setNewExcludeKeyword] = useState("");

  useEffect(() => {
    fetchCategories();
    if (!isNew && params?.id) {
      fetchFeed(params.id);
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

  const fetchFeed = async (id: string) => {
    try {
      const response = await authFetch(`/api/admin/rss/feeds/${id}`);
      if (response.ok) {
        const feed: RSSFeed = await response.json();
        setFormData({
          name: feed.name,
          url: feed.url,
          enabled: feed.enabled,
          autoPublish: feed.autoPublish,
          defaultCategory: feed.defaultCategory || "__none__",
          keywords: feed.filters.keywords || [],
          excludeKeywords: feed.filters.excludeKeywords || [],
          minLength: feed.filters.minLength || 0,
        });
      }
    } catch (error) {
      console.error("Error fetching feed:", error);
      toast.error("Erreur lors du chargement du flux");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddKeyword = (type: "include" | "exclude") => {
    const keyword =
      type === "include" ? newKeyword.trim() : newExcludeKeyword.trim();
    if (!keyword) return;

    if (type === "include") {
      if (!formData.keywords.includes(keyword)) {
        setFormData((prev) => ({
          ...prev,
          keywords: [...prev.keywords, keyword],
        }));
      }
      setNewKeyword("");
    } else {
      if (!formData.excludeKeywords.includes(keyword)) {
        setFormData((prev) => ({
          ...prev,
          excludeKeywords: [...prev.excludeKeywords, keyword],
        }));
      }
      setNewExcludeKeyword("");
    }
  };

  const handleRemoveKeyword = (keyword: string, type: "include" | "exclude") => {
    if (type === "include") {
      setFormData((prev) => ({
        ...prev,
        keywords: prev.keywords.filter((k) => k !== keyword),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        excludeKeywords: prev.excludeKeywords.filter((k) => k !== keyword),
      }));
    }
  };

  const handleTestFeed = async () => {
    if (!formData.url) {
      toast.error("Veuillez entrer l'URL du flux");
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const response = await authFetch("/api/admin/rss/test", {
        method: "POST",
        body: JSON.stringify({ url: formData.url }),
      });

      const data = await response.json();

      if (response.ok) {
        setTestResult({
          success: true,
          message: "Flux valide",
          articleCount: data.articleCount,
        });
        toast.success("Flux RSS valide");
      } else {
        setTestResult({
          success: false,
          message: data.error || "Flux invalide",
        });
        toast.error(data.error || "Flux RSS invalide");
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: "Erreur lors du test",
      });
      toast.error("Erreur lors du test du flux");
    } finally {
      setIsTesting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast.error("Le nom est requis");
      return;
    }
    if (!formData.url.trim()) {
      toast.error("L'URL est requise");
      return;
    }

    setIsSaving(true);

    try {
      // Build clean filters object without undefined values
      const filters: Record<string, unknown> = {};
      if (formData.keywords.length > 0) {
        filters.keywords = formData.keywords;
      }
      if (formData.excludeKeywords.length > 0) {
        filters.excludeKeywords = formData.excludeKeywords;
      }
      if (formData.minLength > 0) {
        filters.minLength = formData.minLength;
      }

      const feedData: Record<string, unknown> = {
        name: formData.name,
        url: formData.url,
        enabled: formData.enabled,
        autoPublish: formData.autoPublish,
        filters,
      };

      // Only include defaultCategory if it has a valid value (not "__none__")
      if (formData.defaultCategory && formData.defaultCategory !== "__none__") {
        feedData.defaultCategory = formData.defaultCategory;
      }

      const url = isNew
        ? "/api/admin/rss/feeds"
        : `/api/admin/rss/feeds/${params?.id}`;
      const method = isNew ? "POST" : "PUT";

      const response = await authFetch(url, {
        method,
        body: JSON.stringify(feedData),
      });

      if (response.ok) {
        toast.success(isNew ? "Flux créé" : "Flux mis à jour");
        setLocation("/admin/rss");
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.error || errorData.message || "Erreur lors de l'enregistrement";
        // Log details for debugging
        if (errorData.details) {
          console.error("RSS Feed Error Details:", errorData.details);
        }
        toast.error(errorMessage);
      }
    } catch (error) {
      console.error("RSS Feed Save Error:", error);
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
      title={isNew ? "Nouveau flux RSS" : "Modifier le flux RSS"}
      description={
        isNew
          ? "Ajoutez une nouvelle source RSS"
          : "Modifiez la configuration du flux RSS"
      }
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Barre d'outils */}
        <div className="flex items-center justify-between">
          <Link href="/admin/rss">
            <Button variant="ghost" type="button">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </Link>
          <Button type="submit" disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Colonne principale */}
          <div className="lg:col-span-2 space-y-6">
            {/* Informations principales */}
            <Card>
              <CardHeader>
                <CardTitle>Informations du flux</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom du flux *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Financial Afrik"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="url">URL du flux RSS *</Label>
                  <div className="flex gap-2">
                    <Input
                      id="url"
                      type="url"
                      value={formData.url}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, url: e.target.value }))
                      }
                      placeholder="https://example.com/rss"
                      required
                      className="flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleTestFeed}
                      disabled={isTesting || !formData.url}
                    >
                      <RefreshCw
                        className={`h-4 w-4 mr-2 ${isTesting ? "animate-spin" : ""}`}
                      />
                      Tester
                    </Button>
                  </div>
                  {testResult && (
                    <div
                      className={`flex items-center gap-2 text-sm ${
                        testResult.success ? "text-green-600" : "text-destructive"
                      }`}
                    >
                      {testResult.success ? (
                        <>
                          <span className="h-4 w-4 rounded-full bg-green-600 flex items-center justify-center">
                            <span className="text-white text-xs">✓</span>
                          </span>
                          {testResult.message}
                          {testResult.articleCount !== undefined && (
                            <span className="text-muted-foreground">
                              ({testResult.articleCount} articles trouvés)
                            </span>
                          )}
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-4 w-4" />
                          {testResult.message}
                        </>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Filtres */}
            <Card>
              <CardHeader>
                <CardTitle>Filtres</CardTitle>
                <CardDescription>
                  Configurez les filtres pour contrôler quels articles sont
                  importés
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Mots-clés à inclure */}
                <div className="space-y-2">
                  <Label>Mots-clés à inclure</Label>
                  <p className="text-xs text-muted-foreground">
                    Seuls les articles contenant au moins un de ces mots-clés
                    seront importés
                  </p>
                  <div className="flex gap-2">
                    <Input
                      value={newKeyword}
                      onChange={(e) => setNewKeyword(e.target.value)}
                      placeholder="Ajouter un mot-clé..."
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddKeyword("include");
                        }
                      }}
                    />
                    <Button
                      type="button"
                      size="icon"
                      onClick={() => handleAddKeyword("include")}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.keywords.map((keyword) => (
                      <Badge
                        key={keyword}
                        variant="secondary"
                        className="gap-1"
                      >
                        {keyword}
                        <button
                          type="button"
                          onClick={() => handleRemoveKeyword(keyword, "include")}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                    {formData.keywords.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        Aucun filtre (tous les articles seront importés)
                      </p>
                    )}
                  </div>
                </div>

                {/* Mots-clés à exclure */}
                <div className="space-y-2">
                  <Label>Mots-clés à exclure</Label>
                  <p className="text-xs text-muted-foreground">
                    Les articles contenant ces mots-clés seront ignorés
                  </p>
                  <div className="flex gap-2">
                    <Input
                      value={newExcludeKeyword}
                      onChange={(e) => setNewExcludeKeyword(e.target.value)}
                      placeholder="Ajouter un mot-clé à exclure..."
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddKeyword("exclude");
                        }
                      }}
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="outline"
                      onClick={() => handleAddKeyword("exclude")}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {formData.excludeKeywords.map((keyword) => (
                      <Badge
                        key={keyword}
                        variant="outline"
                        className="gap-1 text-destructive border-destructive"
                      >
                        {keyword}
                        <button
                          type="button"
                          onClick={() => handleRemoveKeyword(keyword, "exclude")}
                          className="ml-1 hover:text-destructive"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                    {formData.excludeKeywords.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        Aucune exclusion
                      </p>
                    )}
                  </div>
                </div>

                {/* Longueur minimum */}
                <div className="space-y-2">
                  <Label htmlFor="minLength">Longueur minimum du contenu</Label>
                  <Input
                    id="minLength"
                    type="number"
                    min="0"
                    value={formData.minLength}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        minLength: parseInt(e.target.value) || 0,
                      }))
                    }
                    placeholder="0"
                  />
                  <p className="text-xs text-muted-foreground">
                    Nombre minimum de caractères (0 = pas de limite)
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Colonne latérale */}
          <div className="space-y-6">
            {/* Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="enabled">Flux actif</Label>
                    <p className="text-xs text-muted-foreground">
                      Importer les articles de ce flux
                    </p>
                  </div>
                  <Switch
                    id="enabled"
                    checked={formData.enabled}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, enabled: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="autoPublish">Pré-approuver les articles</Label>
                    <p className="text-xs text-muted-foreground">
                      Marquer comme approuvés automatiquement
                    </p>
                  </div>
                  <Switch
                    id="autoPublish"
                    checked={formData.autoPublish}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, autoPublish: checked }))
                    }
                  />
                </div>

                <div className="p-3 bg-muted rounded-lg text-sm">
                  <p className="text-muted-foreground">
                    {formData.autoPublish
                      ? "Les articles seront pré-approuvés mais nécessitent toujours une validation finale par un régulateur avant publication."
                      : "Les articles importés seront placés en attente de modération avant publication."}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Catégorie par défaut */}
            <Card>
              <CardHeader>
                <CardTitle>Catégorie par défaut</CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={formData.defaultCategory}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, defaultCategory: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Aucune</SelectItem>
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
                <p className="text-xs text-muted-foreground mt-2">
                  Catégorie assignée par défaut aux articles importés
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </AdminLayout>
  );
}
