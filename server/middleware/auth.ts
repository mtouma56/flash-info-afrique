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
): Promise<{ user: DecodedUser; token: string; refreshToken: string } | null> {
  try {
    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password,
    });

    if (error || !data.user || !data.session) {
      logger.warn(`Supabase auth failed for email: ${email}`, { error: error?.message });
      return null;
    }

    // Get admin profile
    const adminUser = await storage.getAdminUserById(data.user.id);

    if (!adminUser) {
      // User exists in auth but not an admin
      logger.warn(`User exists in auth but no admin profile found for ID: ${data.user.id}`);
      return null;
    }

    return {
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
    logger.error("Error in authenticateUser", undefined, error);
    return null;
  }
}

// Authentifier par username (trouve l'email correspondant)
export async function authenticateByUsername(
  username: string,
  password: string
): Promise<{ user: DecodedUser; token: string; refreshToken: string } | null> {
  try {
    // Find admin profile by username to get the user ID
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("admin_profiles")
      .select("id, username, role")
      .eq("username", username)
      .single();

    if (profileError || !profile) {
      logger.warn(`Admin profile not found for username: ${username}`, { error: profileError?.message });
      return null;
    }

    // Get the auth user to find their email
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.getUserById(profile.id);

    if (authError || !authData?.user?.email) {
      logger.warn(`Auth user not found for profile ID: ${profile.id}`, { error: authError?.message });
      return null;
    }

    // Now authenticate with email and password
    const result = await authenticateUser(authData.user.email, password);
    
    if (!result) {
      logger.warn(`Authentication failed for user: ${username} (email: ${authData.user.email})`);
    }
    
    return result;
  } catch (error) {
    logger.error("Error in authenticateByUsername", undefined, error);
    return null;
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
