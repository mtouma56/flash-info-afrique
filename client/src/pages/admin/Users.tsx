// Page de gestion des utilisateurs admin
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import AdminLayout from "./AdminLayout";
import { useAuth, useAuthFetch } from "@/contexts/AuthContext";
import { Users, UserPlus, Trash2, Edit, Shield, Pencil } from "lucide-react";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface AdminUser {
  id: string;
  username: string;
  email?: string;
  role: "admin" | "editor";
  createdAt: string;
}

export default function AdminUsers() {
  const { user: currentUser } = useAuth();
  const authFetch = useAuthFetch();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [createForm, setCreateForm] = useState({
    username: "",
    email: "",
    password: "",
    role: "editor" as "admin" | "editor",
  });

  const [editForm, setEditForm] = useState({
    username: "",
    role: "editor" as "admin" | "editor",
  });

  // Fetch users
  const fetchUsers = async () => {
    try {
      const response = await authFetch("/api/admin/users");
      if (response.ok) {
        const data = await response.json();
        setUsers(data.items);
      }
    } catch (error) {
      toast.error("Erreur lors du chargement des utilisateurs");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Create user
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!createForm.username || !createForm.password) {
      toast.error("Username et mot de passe requis");
      return;
    }

    if (createForm.password.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await authFetch("/api/admin/users", {
        method: "POST",
        body: JSON.stringify(createForm),
      });

      if (response.ok) {
        toast.success("Utilisateur créé avec succès");
        setIsCreateOpen(false);
        setCreateForm({ username: "", email: "", password: "", role: "editor" });
        fetchUsers();
      } else {
        const data = await response.json();
        toast.error(data.error || "Erreur lors de la création");
      }
    } catch (error) {
      toast.error("Erreur lors de la création de l'utilisateur");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Edit user
  const openEditDialog = (user: AdminUser) => {
    setEditingUser(user);
    setEditForm({ username: user.username, role: user.role });
    setIsEditOpen(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingUser) return;

    setIsSubmitting(true);

    try {
      const response = await authFetch(`/api/admin/users/${editingUser.id}`, {
        method: "PATCH",
        body: JSON.stringify(editForm),
      });

      if (response.ok) {
        toast.success("Utilisateur mis à jour");
        setIsEditOpen(false);
        setEditingUser(null);
        fetchUsers();
      } else {
        const data = await response.json();
        toast.error(data.error || "Erreur lors de la mise à jour");
      }
    } catch (error) {
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete user
  const handleDelete = async (userId: string) => {
    try {
      const response = await authFetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Utilisateur supprimé");
        setDeleteConfirmId(null);
        fetchUsers();
      } else {
        const data = await response.json();
        toast.error(data.error || "Erreur lors de la suppression");
      }
    } catch (error) {
      toast.error("Erreur lors de la suppression");
    }
  };

  const getRoleBadge = (role: string) => {
    if (role === "admin") {
      return <Badge variant="default">Admin</Badge>;
    }
    return <Badge variant="secondary">Éditeur</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Only admins can access this page
  if (currentUser?.role !== "admin") {
    return (
      <AdminLayout
        title="Utilisateurs"
        description="Gérez les utilisateurs administrateurs"
      >
        <Card>
          <CardContent className="py-10">
            <div className="text-center text-muted-foreground">
              <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Vous n'avez pas les droits pour accéder à cette page.</p>
              <p className="text-sm">Seuls les administrateurs peuvent gérer les utilisateurs.</p>
            </div>
          </CardContent>
        </Card>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout
      title="Utilisateurs"
      description="Gérez les utilisateurs administrateurs"
    >
      <div className="space-y-6">
        {/* Header avec bouton création */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <span className="text-muted-foreground">
              {users.length} utilisateur{users.length > 1 ? "s" : ""}
            </span>
          </div>

          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Nouvel utilisateur
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer un utilisateur</DialogTitle>
                <DialogDescription>
                  Ajoutez un nouvel utilisateur administrateur ou éditeur.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate}>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="username">Nom d'utilisateur *</Label>
                    <Input
                      id="username"
                      value={createForm.username}
                      onChange={(e) =>
                        setCreateForm((prev) => ({ ...prev, username: e.target.value }))
                      }
                      placeholder="johndoe"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={createForm.email}
                      onChange={(e) =>
                        setCreateForm((prev) => ({ ...prev, email: e.target.value }))
                      }
                      placeholder="john@example.com"
                    />
                    <p className="text-xs text-muted-foreground">
                      Si non renseigné, un email sera généré automatiquement.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Mot de passe *</Label>
                    <Input
                      id="password"
                      type="password"
                      value={createForm.password}
                      onChange={(e) =>
                        setCreateForm((prev) => ({ ...prev, password: e.target.value }))
                      }
                      placeholder="••••••••"
                      required
                      minLength={6}
                    />
                    <p className="text-xs text-muted-foreground">
                      Minimum 6 caractères.
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Rôle</Label>
                    <Select
                      value={createForm.role}
                      onValueChange={(value: "admin" | "editor") =>
                        setCreateForm((prev) => ({ ...prev, role: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="editor">Éditeur</SelectItem>
                        <SelectItem value="admin">Administrateur</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Les éditeurs peuvent gérer le contenu. Les administrateurs ont tous les droits.
                    </p>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsCreateOpen(false)}
                  >
                    Annuler
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Création..." : "Créer"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Table des utilisateurs */}
        <Card>
          <CardHeader>
            <CardTitle>Liste des utilisateurs</CardTitle>
            <CardDescription>
              Tous les utilisateurs ayant accès à l'administration.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-10">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
                <p className="text-muted-foreground mt-2">Chargement...</p>
              </div>
            ) : users.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                Aucun utilisateur trouvé.
              </div>
            ) : (
              <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead className="hidden sm:table-cell">Email</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead className="hidden md:table-cell">Créé le</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{user.username}</span>
                          {user.id === currentUser?.id && (
                            <Badge variant="outline" className="w-fit mt-1">
                              Vous
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground sm:hidden">
                            {user.email || "-"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground hidden sm:table-cell">
                        {user.email || "-"}
                      </TableCell>
                      <TableCell>{getRoleBadge(user.role)}</TableCell>
                      <TableCell className="text-muted-foreground hidden md:table-cell">
                        {formatDate(user.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1 sm:gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(user)}
                            disabled={user.id === currentUser?.id}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>

                          {deleteConfirmId === user.id ? (
                            <div className="flex gap-1">
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDelete(user.id)}
                              >
                                Confirmer
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setDeleteConfirmId(null)}
                              >
                                Annuler
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteConfirmId(user.id)}
                              disabled={user.id === currentUser?.id}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialogue d'édition */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Modifier l'utilisateur</DialogTitle>
              <DialogDescription>
                Modifiez les informations de {editingUser?.username}.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEdit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-username">Nom d'utilisateur</Label>
                  <Input
                    id="edit-username"
                    value={editForm.username}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, username: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-role">Rôle</Label>
                  <Select
                    value={editForm.role}
                    onValueChange={(value: "admin" | "editor") =>
                      setEditForm((prev) => ({ ...prev, role: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="editor">Éditeur</SelectItem>
                      <SelectItem value="admin">Administrateur</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditOpen(false)}
                >
                  Annuler
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Enregistrement..." : "Enregistrer"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Information sur les rôles */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Rôles et permissions</CardTitle>
                <CardDescription>
                  Comprendre les différents niveaux d'accès.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Badge variant="default">Admin</Badge>
                  Administrateur
                </h4>
                <p className="text-sm text-muted-foreground">
                  Accès complet à toutes les fonctionnalités : gestion des articles, dossiers,
                  catégories, flux RSS, et gestion des utilisateurs.
                </p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Badge variant="secondary">Éditeur</Badge>
                  Éditeur
                </h4>
                <p className="text-sm text-muted-foreground">
                  Peut créer, modifier et publier des articles et dossiers. N'a pas accès
                  à la gestion des utilisateurs ni aux paramètres avancés.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
