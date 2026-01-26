// Middleware d'authentification pour les routes admin - utilisant Supabase Auth
import { Request, Response, NextFunction } from "express";
import { supabaseAdmin } from "../lib/supabase";
import storage from "../data/supabaseStorage";
import logger from "../lib/logger";

// Interface pour le token décodé
interface DecodedUser {
  userId: string;
  username: string;
  role: string;
  email: string;
}

// Types d'erreurs d'authentification
export type AuthErrorCode = 
  | "USER_NOT_FOUND"
  | "INVALID_PASSWORD"
  | "AUTH_USER_MISSING"
  | "ADMIN_PROFILE_MISSING"
  | "EMAIL_MISSING"
  | "SESSION_ERROR"
  | "UNKNOWN_ERROR";

// Résultat d'authentification avec erreur détaillée
export interface AuthResult {
  success: boolean;
  user?: DecodedUser;
  token?: string;
  refreshToken?: string;
  errorCode?: AuthErrorCode;
  errorMessage?: string;
}

// Étendre le type Request pour inclure l'utilisateur
declare global {
  namespace Express {
    interface Request {
      user?: DecodedUser;
    }
  }
}

// Vérifier un token Supabase et récupérer l'utilisateur
export async function verifyToken(token: string): Promise<DecodedUser | null> {
  try {
    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !data.user) {
      return null;
    }

    // Get admin profile
    const adminUser = await storage.getAdminUserById(data.user.id);

    if (!adminUser) {
      return null;
    }

    return {
      userId: data.user.id,
      username: adminUser.username,
      role: adminUser.role,
      email: data.user.email || "",
    };
  } catch {
    return null;
  }
}

// Authentifier un utilisateur avec email/password
export async function authenticateUser(
  email: string,
  password: string
): Promise<AuthResult> {
  logger.info(`[AUTH] Attempting authentication for email: ${email}`);
  
  try {
    logger.debug(`[AUTH] Calling Supabase signInWithPassword for: ${email}`);
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      logger.warn(`[AUTH] Supabase signInWithPassword failed for email: ${email}`, { 
        error: error.message,
        errorCode: error.status,
        errorName: error.name 
      });
      return {
        success: false,
        errorCode: "INVALID_PASSWORD",
        errorMessage: "Mot de passe incorrect"
      };
    }

    if (!data.user) {
      logger.warn(`[AUTH] No user returned from Supabase for email: ${email}`);
      return {
        success: false,
        errorCode: "AUTH_USER_MISSING",
        errorMessage: "Utilisateur non trouvé dans le système d'authentification"
      };
    }

    if (!data.session) {
      logger.warn(`[AUTH] No session returned from Supabase for email: ${email}`, {
        userId: data.user.id
      });
      return {
        success: false,
        errorCode: "SESSION_ERROR",
        errorMessage: "Erreur lors de la création de la session"
      };
    }

    logger.info(`[AUTH] Supabase auth successful for user ID: ${data.user.id}`);

    // Get admin profile
    logger.debug(`[AUTH] Fetching admin profile for user ID: ${data.user.id}`);
    const adminUser = await storage.getAdminUserById(data.user.id);

    if (!adminUser) {
      // User exists in auth but not an admin
      logger.warn(`[AUTH] User exists in Supabase Auth but no admin_profiles entry found`, {
        userId: data.user.id,
        email: data.user.email
      });
      return {
        success: false,
        errorCode: "ADMIN_PROFILE_MISSING",
        errorMessage: "Profil administrateur non trouvé"
      };
    }

    logger.info(`[AUTH] Authentication successful for admin: ${adminUser.username} (role: ${adminUser.role})`);

    return {
      success: true,
      user: {
        userId: data.user.id,
        username: adminUser.username,
        role: adminUser.role,
        email: data.user.email || "",
      },
      token: data.session.access_token,
      refreshToken: data.session.refresh_token,
    };
  } catch (error) {
    logger.error("[AUTH] Unexpected error in authenticateUser", { email }, error);
    return {
      success: false,
      errorCode: "UNKNOWN_ERROR",
      errorMessage: "Erreur inattendue lors de l'authentification"
    };
  }
}

// Authentifier par username (trouve l'email correspondant)
export async function authenticateByUsername(
  username: string,
  password: string
): Promise<AuthResult> {
  logger.info(`[AUTH] Starting authentication by username: ${username}`);
  
  try {
    // Step 1: Find admin profile by username to get the user ID
    logger.debug(`[AUTH] Step 1: Looking up admin_profiles for username: ${username}`);
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("admin_profiles")
      .select("id, username, role")
      .eq("username", username)
      .single();

    if (profileError) {
      logger.warn(`[AUTH] Step 1 FAILED: Error querying admin_profiles for username: ${username}`, { 
        error: profileError.message,
        code: profileError.code,
        details: profileError.details,
        hint: profileError.hint
      });
      return {
        success: false,
        errorCode: "USER_NOT_FOUND",
        errorMessage: "Nom d'utilisateur non trouvé"
      };
    }

    if (!profile) {
      logger.warn(`[AUTH] Step 1 FAILED: No admin profile found for username: ${username}`);
      return {
        success: false,
        errorCode: "USER_NOT_FOUND",
        errorMessage: "Nom d'utilisateur non trouvé"
      };
    }

    logger.info(`[AUTH] Step 1 SUCCESS: Found admin profile`, { 
      profileId: profile.id, 
      username: profile.username, 
      role: profile.role 
    });

    // Step 2: Get the auth user to find their email
    logger.debug(`[AUTH] Step 2: Looking up auth.users for profile ID: ${profile.id}`);
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.getUserById(profile.id);

    if (authError) {
      logger.warn(`[AUTH] Step 2 FAILED: Error fetching auth user for profile ID: ${profile.id}`, { 
        error: authError.message,
        code: authError.code,
        status: authError.status
      });
      return {
        success: false,
        errorCode: "AUTH_USER_MISSING",
        errorMessage: "Compte utilisateur non trouvé dans le système d'authentification"
      };
    }

    if (!authData?.user) {
      logger.warn(`[AUTH] Step 2 FAILED: No auth user found for profile ID: ${profile.id}`);
      return {
        success: false,
        errorCode: "AUTH_USER_MISSING",
        errorMessage: "Compte utilisateur non trouvé dans le système d'authentification"
      };
    }

    if (!authData.user.email) {
      logger.warn(`[AUTH] Step 2 FAILED: Auth user has no email for profile ID: ${profile.id}`, {
        userId: authData.user.id
      });
      return {
        success: false,
        errorCode: "EMAIL_MISSING",
        errorMessage: "Email non configuré pour ce compte"
      };
    }

    logger.info(`[AUTH] Step 2 SUCCESS: Found auth user with email: ${authData.user.email}`);

    // Step 3: Authenticate with email and password
    logger.debug(`[AUTH] Step 3: Authenticating with email/password for: ${authData.user.email}`);
    const result = await authenticateUser(authData.user.email, password);
    
    if (!result.success) {
      logger.warn(`[AUTH] Step 3 FAILED: Password authentication failed for user: ${username} (email: ${authData.user.email})`);
      return result;
    }
    
    logger.info(`[AUTH] Step 3 SUCCESS: Full authentication completed for user: ${username}`);
    return result;
  } catch (error) {
    logger.error("[AUTH] Unexpected error in authenticateByUsername", { username }, error);
    return {
      success: false,
      errorCode: "UNKNOWN_ERROR",
      errorMessage: "Erreur inattendue lors de l'authentification"
    };
  }
}

// Middleware d'authentification
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token d'authentification requis" });
  }

  const token = authHeader.substring(7);

  verifyToken(token).then((decoded) => {
    if (!decoded) {
      return res.status(401).json({ error: "Token invalide ou expiré" });
    }

    req.user = decoded;
    next();
  }).catch(() => {
    return res.status(401).json({ error: "Erreur de vérification du token" });
  });
}

// Middleware pour vérifier le rôle admin
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Accès non autorisé" });
  }
  next();
}

// Déconnecter un utilisateur (invalider la session côté serveur)
export async function signOut(token: string): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin.auth.admin.signOut(token);
    return !error;
  } catch {
    return false;
  }
}

export default {
  verifyToken,
  authenticateUser,
  authenticateByUsername,
  requireAuth,
  requireAdmin,
  signOut,
};

export type { AuthResult, AuthErrorCode };
