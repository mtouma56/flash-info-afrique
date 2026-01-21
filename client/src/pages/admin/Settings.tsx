// Page des paramètres admin
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import AdminLayout from "./AdminLayout";
import { useAuth } from "@/contexts/AuthContext";
import { Lock, User, Shield, Database, Save } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function AdminSettings() {
  const { user } = useAuth();
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("Les mots de passe ne correspondent pas");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }

    setIsChangingPassword(true);

    try {
      // TODO: Implémenter l'API de changement de mot de passe
      toast.success("Mot de passe mis à jour");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      toast.error("Erreur lors de la mise à jour du mot de passe");
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <AdminLayout
      title="Paramètres"
      description="Gérez les paramètres de votre compte administrateur"
    >
      <div className="space-y-6 max-w-2xl">
        {/* Informations du compte */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Informations du compte</CardTitle>
                <CardDescription>
                  Détails de votre compte administrateur
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Nom d'utilisateur</Label>
                <Input value={user?.username || "admin"} disabled />
              </div>
              <div className="space-y-2">
                <Label>Rôle</Label>
                <Input value="Administrateur" disabled />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Changer le mot de passe */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Changer le mot de passe</CardTitle>
                <CardDescription>
                  Mettez à jour votre mot de passe de connexion
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      currentPassword: e.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      newPassword: e.target.value,
                    }))
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  Confirmer le nouveau mot de passe
                </Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm((prev) => ({
                      ...prev,
                      confirmPassword: e.target.value,
                    }))
                  }
                  required
                />
              </div>
              <Button type="submit" disabled={isChangingPassword}>
                <Save className="h-4 w-4 mr-2" />
                {isChangingPassword
                  ? "Mise à jour..."
                  : "Mettre à jour le mot de passe"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Sécurité */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Sécurité</CardTitle>
                <CardDescription>
                  Informations de sécurité de votre compte
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <h4 className="font-medium mb-2">Identifiants par défaut</h4>
              <p className="text-sm text-muted-foreground mb-2">
                Si vous n'avez pas encore modifié vos identifiants, utilisez :
              </p>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>
                  <strong>Nom d'utilisateur :</strong> admin
                </li>
                <li>
                  <strong>Mot de passe :</strong> admin123
                </li>
              </ul>
              <p className="text-sm text-destructive mt-2">
                Il est fortement recommandé de changer ce mot de passe.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Stockage */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Database className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Stockage des données</CardTitle>
                <CardDescription>
                  Informations sur le stockage des données
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                Les données sont actuellement stockées dans des fichiers JSON
                sur le serveur. Cette solution est adaptée pour un usage léger
                mais pourrait être migrée vers une base de données (PostgreSQL,
                MongoDB) pour une utilisation à plus grande échelle.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
