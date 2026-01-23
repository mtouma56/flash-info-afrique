// Page de gestion des catégories
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AdminLayout from "./AdminLayout";
import { useAuthFetch } from "@/contexts/AuthContext";
import { Edit, FileText, Plus, Save } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { Category } from "@shared/types/admin";

// Couleurs prédéfinies
const PRESET_COLORS = [
  "#1E3A8A", // Bleu marine
  "#DC2626", // Rouge
  "#10B981", // Vert émeraude
  "#F97316", // Orange
  "#8B5CF6", // Violet
  "#EC4899", // Rose
  "#14B8A6", // Teal
  "#F59E0B", // Ambre
  "#6366F1", // Indigo
  "#84CC16", // Lime
];

// Générer un slug à partir du nom
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Enlever les accents
    .replace(/[^a-z0-9]+/g, "-") // Remplacer les caractères non alphanumériques par des tirets
    .replace(/^-+|-+$/g, "") // Enlever les tirets au début et à la fin
    .substring(0, 100); // Limiter la longueur
}

export default function AdminCategories() {
  const authFetch = useAuthFetch();
  const [categories, setCategories] = useState<Category[]>([]);
  const [articleCounts, setArticleCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [autoSlug, setAutoSlug] = useState(true);

  const isCreating = editingCategory === null;

  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    description: "",
    color: "#1E3A8A",
  });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await authFetch("/api/admin/categories");
      if (response.ok) {
        const data = await response.json();
        setCategories(data);

        // Récupérer le nombre d'articles par catégorie
        const articlesResponse = await authFetch("/api/admin/articles");
        if (articlesResponse.ok) {
          const articlesData = await articlesResponse.json();
          const articles = articlesData.items || articlesData;
          const counts: Record<string, number> = {};
          articles.forEach((article: { category: string }) => {
            counts[article.category] = (counts[article.category] || 0) + 1;
          });
          setArticleCounts(counts);
        }
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast.error("Erreur lors du chargement des catégories");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingCategory(null);
    setFormData({
      name: "",
      slug: "",
      description: "",
      color: "#1E3A8A",
    });
    setAutoSlug(true);
    setDialogOpen(true);
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description,
      color: category.color,
    });
    setAutoSlug(false); // Don't auto-generate slug when editing
    setDialogOpen(true);
  };

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      slug: autoSlug ? generateSlug(name) : prev.slug,
    }));
  };

  const handleSlugChange = (slug: string) => {
    setAutoSlug(false);
    setFormData((prev) => ({ ...prev, slug }));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast.error("Le nom est requis");
      return;
    }

    const slug = formData.slug.trim() || generateSlug(formData.name);
    if (!slug) {
      toast.error("Le slug est requis");
      return;
    }

    setIsSaving(true);

    try {
      if (isCreating) {
        // Create new category
        const response = await authFetch("/api/admin/categories", {
          method: "POST",
          body: JSON.stringify({
            name: formData.name,
            slug,
            description: formData.description,
            color: formData.color,
          }),
        });

        if (response.ok) {
          const newCategory = await response.json();
          setCategories((prev) => [...prev, newCategory]);
          toast.success("Catégorie créée");
          setDialogOpen(false);
        } else {
          const error = await response.json();
          toast.error(error.error || "Erreur lors de la création");
        }
      } else {
        // Update existing category
        const response = await authFetch(
          `/api/admin/categories/${editingCategory.id}`,
          {
            method: "PUT",
            body: JSON.stringify({
              ...editingCategory,
              name: formData.name,
              slug: formData.slug,
              description: formData.description,
              color: formData.color,
            }),
          }
        );

        if (response.ok) {
          setCategories((prev) =>
            prev.map((cat) =>
              cat.id === editingCategory.id
                ? {
                    ...cat,
                    name: formData.name,
                    slug: formData.slug,
                    description: formData.description,
                    color: formData.color,
                  }
                : cat
            )
          );
          toast.success("Catégorie mise à jour");
          setDialogOpen(false);
        } else {
          const error = await response.json();
          toast.error(error.error || "Erreur lors de la mise à jour");
        }
      }
    } catch (error) {
      toast.error(isCreating ? "Erreur lors de la création" : "Erreur lors de la mise à jour");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AdminLayout
      title="Catégories"
      description="Gérez les catégories d'articles de votre site"
    >
      <div className="space-y-6">
        {/* Header avec bouton de création */}
        <div className="flex items-center justify-between">
          <Card className="bg-muted/50 flex-1 mr-4">
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">
                Les catégories permettent d'organiser vos articles par thème.
                Vous pouvez créer, modifier le nom, la description et la couleur de
                chaque catégorie.
              </p>
            </CardContent>
          </Card>
          <Button onClick={handleCreate}>
            <Plus className="h-4 w-4 mr-2" />
            Créer une catégorie
          </Button>
        </div>

        {/* Liste des catégories */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {categories.map((category) => (
              <Card key={category.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-4 h-4 rounded-full shrink-0"
                        style={{ backgroundColor: category.color }}
                      />
                      <div>
                        <CardTitle className="text-lg">{category.name}</CardTitle>
                        <CardDescription className="mt-1">
                          {category.description}
                        </CardDescription>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEdit(category)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <FileText className="h-4 w-4" />
                      {articleCounts[category.id] || 0} article
                      {(articleCounts[category.id] || 0) > 1 ? "s" : ""}
                    </div>
                    <Badge
                      variant="outline"
                      style={{
                        borderColor: category.color,
                        color: category.color,
                      }}
                    >
                      {category.slug}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Dialog de création/édition */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isCreating ? "Créer une catégorie" : "Modifier la catégorie"}
            </DialogTitle>
            <DialogDescription>
              {isCreating
                ? "Remplissez les informations pour créer une nouvelle catégorie"
                : "Modifiez les informations de la catégorie"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Nom de la catégorie"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => handleSlugChange(e.target.value)}
                placeholder="slug-de-la-categorie"
                disabled={!isCreating}
              />
              <p className="text-xs text-muted-foreground">
                {isCreating
                  ? "Identifiant unique utilisé dans les URLs. Généré automatiquement depuis le nom."
                  : "Le slug ne peut pas être modifié après la création."}
              </p>
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
                placeholder="Description de la catégorie..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Couleur</Label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-full transition-transform ${
                      formData.color === color
                        ? "ring-2 ring-offset-2 ring-primary scale-110"
                        : "hover:scale-110"
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() =>
                      setFormData((prev) => ({ ...prev, color }))
                    }
                  />
                ))}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <Label htmlFor="customColor" className="text-sm font-normal">
                  Personnalisée:
                </Label>
                <Input
                  id="customColor"
                  type="color"
                  value={formData.color}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, color: e.target.value }))
                  }
                  className="w-12 h-8 p-0 border-0"
                />
                <Input
                  value={formData.color}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, color: e.target.value }))
                  }
                  placeholder="#000000"
                  className="w-24"
                />
              </div>
            </div>

            {/* Aperçu */}
            <div className="space-y-2">
              <Label>Aperçu</Label>
              <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: formData.color }}
                />
                <span className="font-medium">{formData.name || "Catégorie"}</span>
                <Badge
                  variant="outline"
                  style={{
                    borderColor: formData.color,
                    color: formData.color,
                  }}
                >
                  {formData.slug || "slug"}
                </Badge>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={isSaving}
            >
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Enregistrement..." : isCreating ? "Créer" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
