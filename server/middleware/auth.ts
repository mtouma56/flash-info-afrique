// Middleware d'authentification pour les routes admin
import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

// Secret JWT (en production, utiliser une variable d'environnement)
const JWT_SECRET = process.env.JWT_SECRET || "flash-info-afrique-admin-secret-2024";
const JWT_EXPIRATION = "24h";

// Salt rounds pour bcrypt
const SALT_ROUNDS = 10;

// Interface pour le token décodé
interface DecodedToken {
  userId: string;
  username: string;
  role: string;
  iat: number;
  exp: number;
}

// Étendre le type Request pour inclure l'utilisateur
declare global {
  namespace Express {
    interface Request {
      user?: DecodedToken;
    }
  }
}

// Générer un token JWT
export function generateToken(user: {
  id: string;
  username: string;
  role: string;
}): string {
  return jwt.sign(
    {
      userId: user.id,
      username: user.username,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRATION }
  );
}

// Vérifier un token JWT
export function verifyToken(token: string): DecodedToken | null {
  try {
    return jwt.verify(token, JWT_SECRET) as DecodedToken;
  } catch {
    return null;
  }
}

// Hash un mot de passe
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

// Vérifier un mot de passe
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Middleware d'authentification
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Token d'authentification requis" });
  }

  const token = authHeader.substring(7);
  const decoded = verifyToken(token);

  if (!decoded) {
    return res.status(401).json({ error: "Token invalide ou expiré" });
  }

  req.user = decoded;
  next();
}

// Middleware pour vérifier le rôle admin
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user || req.user.role !== "admin") {
    return res.status(403).json({ error: "Accès non autorisé" });
  }
  next();
}

export default {
  generateToken,
  verifyToken,
  hashPassword,
  verifyPassword,
  requireAuth,
  requireAdmin,
};
