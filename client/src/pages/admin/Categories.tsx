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
import { Edit, FileText, Save } from "lucide-react";
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

export default function AdminCategories() {
  const authFetch = useAuthFetch();
  const [categories, setCategories] = useState<Category[]>([]);
  const [articleCounts, setArticleCounts] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "",
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

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description,
      color: category.color,
    });
    setEditDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingCategory) return;

    if (!formData.name.trim()) {
      toast.error("Le nom est requis");
      return;
    }

    setIsSaving(true);

    try {
      const response = await authFetch(
        `/api/admin/categories/${editingCategory.id}`,
        {
          method: "PUT",
          body: JSON.stringify({
            ...editingCategory,
            name: formData.name,
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
                  description: formData.description,
                  color: formData.color,
                }
              : cat
          )
        );
        toast.success("Catégorie mise à jour");
        setEditDialogOpen(false);
      } else {
        const error = await response.json();
        toast.error(error.message || "Erreur lors de la mise à jour");
      }
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
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
        {/* Info */}
        <Card className="bg-muted/50">
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              Les catégories permettent d'organiser vos articles par thème.
              Vous pouvez modifier le nom, la description et la couleur de
              chaque catégorie.
            </p>
          </CardContent>
        </Card>

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

      {/* Dialog d'édition */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier la catégorie</DialogTitle>
            <DialogDescription>
              Modifiez les informations de la catégorie
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nom *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Nom de la catégorie"
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
                  badge
                </Badge>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              disabled={isSaving}
            >
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={isSaving}>
              <Save className="h-4 w-4 mr-2" />
              {isSaving ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
