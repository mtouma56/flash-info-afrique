// Contexte d'authentification pour l'admin - utilisant Supabase Auth
import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "../lib/supabase";
import type { Session, User as SupabaseUser } from "@supabase/supabase-js";

interface User {
  id: string;
  username: string;
  role: "admin" | "editor";
  email: string;
}

// Types d'erreurs d'authentification (miroir du serveur)
type AuthErrorCode = 
  | "USER_NOT_FOUND"
  | "INVALID_PASSWORD"
  | "AUTH_USER_MISSING"
  | "ADMIN_PROFILE_MISSING"
  | "EMAIL_MISSING"
  | "SESSION_ERROR"
  | "NETWORK_ERROR"
  | "UNKNOWN_ERROR";

interface LoginResult {
  success: boolean;
  errorCode?: AuthErrorCode;
  errorMessage?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
  isLoading: boolean;
  getToken: () => string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch admin profile from our API
  const fetchAdminProfile = async (supabaseUser: SupabaseUser, accessToken: string): Promise<User | null> => {
    try {
      const response = await fetch("/api/admin/me", {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        return {
          id: supabaseUser.id,
          username: data.username,
          role: data.role,
          email: supabaseUser.email || "",
        };
      }
      return null;
    } catch (error) {
      console.error("Error fetching admin profile:", error);
      return null;
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session: initialSession } }) => {
      setSession(initialSession);

      if (initialSession?.user && initialSession.access_token) {
        const adminUser = await fetchAdminProfile(initialSession.user, initialSession.access_token);
        setUser(adminUser);
      }

      setIsLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession);

      if (event === "SIGNED_IN" && newSession?.user && newSession.access_token) {
        const adminUser = await fetchAdminProfile(newSession.user, newSession.access_token);
        setUser(adminUser);
      } else if (event === "SIGNED_OUT") {
        setUser(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (username: string, password: string): Promise<LoginResult> => {
    try {
      console.log("[AUTH] Attempting login for:", username);
      
      // Use our backend API to authenticate by username
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        console.log("[AUTH] Login successful for:", username);

        // If the backend returns a session, set it in Supabase client
        if (data.session) {
          await supabase.auth.setSession({
            access_token: data.session.access_token,
            refresh_token: data.session.refresh_token,
          });
        }

        setUser({
          id: data.user.id,
          username: data.user.username,
          role: data.user.role,
          email: data.user.email || "",
        });

        return { success: true };
      }

      // Handle error response
      console.error("[AUTH] Login failed:", data.error, "Code:", data.code);
      return {
        success: false,
        errorCode: data.code as AuthErrorCode || "UNKNOWN_ERROR",
        errorMessage: data.error || "Identifiants incorrects"
      };
    } catch (error) {
      console.error("[AUTH] Network or unexpected error:", error);
      return {
        success: false,
        errorCode: "NETWORK_ERROR",
        errorMessage: "Erreur de connexion au serveur"
      };
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      setSession(null);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const getToken = (): string | null => {
    return session?.access_token || null;
  };

  const isAuthenticated = !!user;

  return (
    <AuthContext.Provider
      value={{ user, isAuthenticated, login, logout, isLoading, getToken }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Hook pour faire des requêtes authentifiées
export function useAuthFetch() {
  const { getToken, logout } = useAuth();

  const authFetch = async (url: string, options: RequestInit = {}) => {
    const token = getToken();
    const headers = {
      ...options.headers,
      Authorization: token ? `Bearer ${token}` : "",
      "Content-Type": "application/json",
    };

    const response = await fetch(url, { ...options, headers });

    // Si le token est invalide, déconnecter l'utilisateur
    if (response.status === 401) {
      await logout();
      throw new Error("Session expirée");
    }

    return response;
  };

  return authFetch;
}
