// Page de connexion admin
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
import { useAuth } from "@/contexts/AuthContext";
import { Eye, EyeOff, Lock, User } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";

export default function AdminLogin() {
  const { login, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Rediriger si déjà connecté
  if (isAuthenticated) {
    setLocation("/admin");
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a1d61db1-cb31-40e2-8e3d-081974469abb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Login.tsx:32',message:'handleSubmit entry',data:{username:username.trim(),hasPassword:!!password.trim()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
    // #endregion

    if (!username.trim() || !password.trim()) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }

    setIsLoading(true);

    try {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a1d61db1-cb31-40e2-8e3d-081974469abb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Login.tsx:43',message:'before login call',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      const result = await login(username, password);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a1d61db1-cb31-40e2-8e3d-081974469abb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Login.tsx:44',message:'after login call',data:{success:result.success,errorCode:result.errorCode},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      if (result.success) {
        toast.success("Connexion réussie");
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/a1d61db1-cb31-40e2-8e3d-081974469abb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Login.tsx:46',message:'before setLocation',data:{target:'/admin'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        setLocation("/admin");
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/a1d61db1-cb31-40e2-8e3d-081974469abb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Login.tsx:46',message:'after setLocation',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
      } else {
        // Afficher un message d'erreur plus spécifique selon le code
        const errorMessages: Record<string, string> = {
          USER_NOT_FOUND: "Nom d'utilisateur non reconnu",
          INVALID_PASSWORD: "Mot de passe incorrect",
          AUTH_USER_MISSING: "Compte utilisateur introuvable",
          ADMIN_PROFILE_MISSING: "Profil administrateur non configuré",
          EMAIL_MISSING: "Configuration du compte incomplète",
          SESSION_ERROR: "Erreur de session, veuillez réessayer",
          NETWORK_ERROR: "Impossible de contacter le serveur",
          UNKNOWN_ERROR: "Une erreur inattendue s'est produite"
        };
        
        const displayMessage = result.errorCode 
          ? errorMessages[result.errorCode] || result.errorMessage || "Identifiants incorrects"
          : result.errorMessage || "Identifiants incorrects";
        
        toast.error(displayMessage);
        console.error("[LOGIN] Error:", result.errorCode, result.errorMessage);
      }
    } catch (error) {
      console.error("[LOGIN] Unexpected error:", error);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a1d61db1-cb31-40e2-8e3d-081974469abb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'Login.tsx:67',message:'handleSubmit catch error',data:{error:error instanceof Error?error.message:String(error),errorName:error instanceof Error?error.name:null,stack:error instanceof Error?error.stack:null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      // #endregion
      toast.error("Une erreur est survenue");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-primary/10 rounded-full">
              <Lock className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center font-bold">
            Flash Info Afrique
          </CardTitle>
          <CardDescription className="text-center">
            Connectez-vous pour accéder au panneau d'administration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Nom d'utilisateur</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="username"
                  type="text"
                  placeholder="admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10"
                  required
                  autoFocus
                  disabled={isLoading}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                  Connexion...
                </>
              ) : (
                "Se connecter"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>Interface d'administration</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
