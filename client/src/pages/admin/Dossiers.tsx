// Page de gestion des dossiers
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  EyeOff,
  FileText,
  MoreHorizontal,
  Plus,
  Trash2,
  Calendar,
  FolderOpen,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import type { Dossier } from "@shared/types/admin";

export default function AdminDossiers() {
  const authFetch = useAuthFetch();
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [dossierToDelete, setDossierToDelete] = useState<Dossier | null>(null);

  useEffect(() => {
    fetchDossiers();
  }, []);

  const fetchDossiers = async () => {
    try {
      const response = await authFetch("/api/admin/dossiers");
      if (response.ok) {
        const data = await response.json();
        setDossiers(data);
      }
    } catch (error) {
      console.error("Error fetching dossiers:", error);
      toast.error("Erreur lors du chargement des dossiers");
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (dossier: Dossier) => {
    try {
      const response = await authFetch(`/api/admin/dossiers/${dossier.id}`, {
        method: "PUT",
        body: JSON.stringify({ ...dossier, isActive: !dossier.isActive }),
      });

      if (response.ok) {
        setDossiers((prev) =>
          prev.map((d) =>
            d.id === dossier.id ? { ...d, isActive: !d.isActive } : d
          )
        );
        toast.success(
          dossier.isActive ? "Dossier masqué du site" : "Dossier affiché sur le site"
        );
      }
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const handleDelete = async () => {
    if (!dossierToDelete) return;

    try {
      const response = await authFetch(
        `/api/admin/dossiers/${dossierToDelete.id}`,
        {
          method: "DELETE",
        }
      );

      if (response.ok) {
        setDossiers((prev) => prev.filter((d) => d.id !== dossierToDelete.id));
        toast.success("Dossier supprimé");
      }
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    } finally {
      setDeleteDialogOpen(false);
      setDossierToDelete(null);
    }
  };

  return (
    <AdminLayout
      title="Dossiers"
      description="Gérez les dossiers thématiques de votre site"
    >
      <div className="space-y-6">
        {/* Barre d'outils */}
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground">
            {dossiers.length} dossier{dossiers.length > 1 ? "s" : ""}
          </p>
          <Link href="/admin/dossiers/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau dossier
            </Button>
          </Link>
        </div>

        {/* Liste des dossiers */}
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          </div>
        ) : dossiers.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center h-64 text-center">
              <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                Aucun dossier pour le moment
              </p>
              <Link href="/admin/dossiers/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer votre premier dossier
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {dossiers.map((dossier) => (
              <Card
                key={dossier.id}
                className={`hover:shadow-md transition-shadow ${
                  !dossier.isActive ? "opacity-60" : ""
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <CardTitle className="text-lg truncate">
                          {dossier.title}
                        </CardTitle>
                        {!dossier.isActive && (
                          <Badge variant="outline" className="text-orange-600 border-orange-300 bg-orange-50 dark:bg-orange-950/30 dark:border-orange-800 dark:text-orange-400">
                            <EyeOff className="h-3 w-3 mr-1" />
                            Masqué
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="line-clamp-2">
                        {dossier.description}
                      </CardDescription>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="shrink-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/dossier-${dossier.slug}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            Voir
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/dossiers/${dossier.id}/edit`}>
                            <Edit className="h-4 w-4 mr-2" />
                            Modifier
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleToggleActive(dossier)}
                        >
                          {dossier.isActive ? (
                            <>
                              <EyeOff className="h-4 w-4 mr-2" />
                              Masquer du site
                            </>
                          ) : (
                            <>
                              <Eye className="h-4 w-4 mr-2" />
                              Afficher sur le site
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => {
                            setDossierToDelete(dossier);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Supprimer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      {dossier.articleIds.length} article
                      {dossier.articleIds.length > 1 ? "s" : ""}
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {dossier.timelineEvents.length} événement
                      {dossier.timelineEvents.length > 1 ? "s" : ""}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="text-xs text-muted-foreground">
                      Mis à jour le{" "}
                      {new Date(dossier.updatedAt).toLocaleDateString("fr-FR")}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-7 px-2 text-xs ${
                        dossier.isActive 
                          ? "text-green-600 hover:text-green-700 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-950/30" 
                          : "text-orange-600 hover:text-orange-700 hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-950/30"
                      }`}
                      onClick={() => handleToggleActive(dossier)}
                      title={dossier.isActive ? "Masquer du site" : "Afficher sur le site"}
                    >
                      {dossier.isActive ? (
                        <>
                          <Eye className="h-3.5 w-3.5 mr-1" />
                          Visible
                        </>
                      ) : (
                        <>
                          <EyeOff className="h-3.5 w-3.5 mr-1" />
                          Masqué
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Dialog de confirmation de suppression */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le dossier ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action est irréversible. Le dossier "
              {dossierToDelete?.title}" sera définitivement supprimé.
              Les articles associés ne seront pas supprimés.
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
