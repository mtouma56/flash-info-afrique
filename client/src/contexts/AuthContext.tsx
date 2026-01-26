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
    // #region agent log
    console.log("[AUTH] Login function called", { username });
    fetch('http://127.0.0.1:7242/ingest/a1d61db1-cb31-40e2-8e3d-081974469abb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.tsx:103',message:'login function entry',data:{username},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    try {
      console.log("[AUTH] Attempting login for:", username);
      
      // Use our backend API to authenticate by username
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a1d61db1-cb31-40e2-8e3d-081974469abb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.tsx:108',message:'before fetch',data:{url:'/api/admin/login'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a1d61db1-cb31-40e2-8e3d-081974469abb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.tsx:114',message:'after fetch before json',data:{status:response.status,statusText:response.statusText,ok:response.ok,contentType:response.headers.get('content-type')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a1d61db1-cb31-40e2-8e3d-081974469abb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.tsx:114',message:'before response.json',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      const data = await response.json();

      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a1d61db1-cb31-40e2-8e3d-081974469abb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.tsx:114',message:'after response.json',data:{hasData:!!data,hasSession:!!data.session,hasUser:!!data.user,userKeys:data.user?Object.keys(data.user):null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion

      if (response.ok) {
        console.log("[AUTH] Login successful for:", username);
        console.log("[AUTH] Response data:", { hasSession: !!data.session, hasUser: !!data.user });

        // If the backend returns a session, set it in Supabase client
        if (data.session) {
          // #region agent log
          console.log("[AUTH] Setting Supabase session", { hasAccessToken: !!data.session.access_token, hasRefreshToken: !!data.session.refresh_token });
          fetch('http://127.0.0.1:7242/ingest/a1d61db1-cb31-40e2-8e3d-081974469abb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.tsx:121',message:'before setSession',data:{hasAccessToken:!!data.session.access_token,hasRefreshToken:!!data.session.refresh_token},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
          // #endregion
          try {
            const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
              access_token: data.session.access_token,
              refresh_token: data.session.refresh_token,
            });
            
            if (sessionError) {
              console.error("[AUTH] setSession error from Supabase:", sessionError);
              // #region agent log
              fetch('http://127.0.0.1:7242/ingest/a1d61db1-cb31-40e2-8e3d-081974469abb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.tsx:142',message:'setSession error from Supabase',data:{error:sessionError.message},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
              // #endregion
              throw sessionError;
            }
            
            // Update local session state immediately to avoid race condition
            if (sessionData?.session) {
              console.log("[AUTH] Session state updated from Supabase response");
              setSession(sessionData.session);
              // #region agent log
              fetch('http://127.0.0.1:7242/ingest/a1d61db1-cb31-40e2-8e3d-081974469abb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.tsx:147',message:'session state updated immediately',data:{hasSession:!!sessionData.session,hasAccessToken:!!sessionData.session.access_token},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
              // #endregion
            } else {
              console.log("[AUTH] Creating fallback session object");
              // Fallback: create session object from response data
              const fallbackSession = {
                access_token: data.session.access_token,
                refresh_token: data.session.refresh_token,
                expires_at: Date.now() + 3600000, // 1 hour default
                expires_in: 3600,
                token_type: 'bearer',
                user: {
                  id: data.user.id,
                  email: data.user.email || '',
                  aud: 'authenticated',
                  role: 'authenticated',
                },
              } as Session;
              setSession(fallbackSession);
              // #region agent log
              fetch('http://127.0.0.1:7242/ingest/a1d61db1-cb31-40e2-8e3d-081974469abb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.tsx:162',message:'fallback session created',data:{hasAccessToken:!!fallbackSession.access_token},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
              // #endregion
            }
            console.log("[AUTH] Session set successfully");
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/a1d61db1-cb31-40e2-8e3d-081974469abb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.tsx:165',message:'after setSession success',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
            // #endregion
          } catch (sessionError) {
            console.error("[AUTH] setSession catch error:", sessionError);
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/a1d61db1-cb31-40e2-8e3d-081974469abb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.tsx:167',message:'setSession catch error',data:{error:sessionError instanceof Error?sessionError.message:String(sessionError)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
            // #endregion
            throw sessionError;
          }
        }

        // #region agent log
        console.log("[AUTH] Setting user state", { userId: data.user?.id, username: data.user?.username, role: data.user?.role });
        fetch('http://127.0.0.1:7242/ingest/a1d61db1-cb31-40e2-8e3d-081974469abb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.tsx:127',message:'before setUser',data:{userId:data.user?.id,username:data.user?.username,role:data.user?.role,email:data.user?.email},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        setUser({
          id: data.user.id,
          username: data.user.username,
          role: data.user.role,
          email: data.user.email || "",
        });
        console.log("[AUTH] User state set successfully");
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/a1d61db1-cb31-40e2-8e3d-081974469abb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.tsx:133',message:'after setUser',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion

        console.log("[AUTH] Login completed successfully");
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/a1d61db1-cb31-40e2-8e3d-081974469abb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.tsx:135',message:'login function exit success',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
        // #endregion
        return { success: true };
      }

      // Handle error response
      console.error("[AUTH] Login failed:", data.error, "Code:", data.code);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a1d61db1-cb31-40e2-8e3d-081974469abb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.tsx:139',message:'login function exit error response',data:{error:data.error,code:data.code},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      return {
        success: false,
        errorCode: data.code as AuthErrorCode || "UNKNOWN_ERROR",
        errorMessage: data.error || "Identifiants incorrects"
      };
    } catch (error) {
      console.error("[AUTH] Network or unexpected error:", error);
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a1d61db1-cb31-40e2-8e3d-081974469abb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.tsx:145',message:'login function catch error',data:{error:error instanceof Error?error.message:String(error),errorName:error instanceof Error?error.name:null},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
      // #endregion
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
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a1d61db1-cb31-40e2-8e3d-081974469abb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.tsx:191',message:'authFetch entry',data:{url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'})}).catch(()=>{});
    // #endregion
    const token = getToken();
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a1d61db1-cb31-40e2-8e3d-081974469abb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.tsx:193',message:'authFetch token check',data:{hasToken:!!token,tokenLength:token?.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'})}).catch(()=>{});
    // #endregion
    const headers = {
      ...options.headers,
      Authorization: token ? `Bearer ${token}` : "",
      "Content-Type": "application/json",
    };

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a1d61db1-cb31-40e2-8e3d-081974469abb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.tsx:199',message:'authFetch before fetch',data:{url,hasAuthHeader:!!headers.Authorization},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'})}).catch(()=>{});
    // #endregion
    const response = await fetch(url, { ...options, headers });
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/a1d61db1-cb31-40e2-8e3d-081974469abb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.tsx:200',message:'authFetch after fetch',data:{status:response.status,ok:response.ok},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'})}).catch(()=>{});
    // #endregion

    // Si le token est invalide, déconnecter l'utilisateur
    if (response.status === 401) {
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/a1d61db1-cb31-40e2-8e3d-081974469abb',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'AuthContext.tsx:203',message:'authFetch 401 error',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'I'})}).catch(()=>{});
      // #endregion
      await logout();
      throw new Error("Session expirée");
    }

    return response;
  };

  return authFetch;
}
