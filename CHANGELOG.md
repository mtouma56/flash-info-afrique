# Changelog

## [Unreleased] - 2026-01-23

### Audit et Corrections Pré-lancement

#### Corrections Critiques

1. **Correction des hooks de récupération de données** (`client/src/hooks/useArticles.tsx`, `client/src/hooks/useDossiers.tsx`)
   - Ajout de la réinitialisation des états (error, article/dossier) lors du changement de slug
   - Implémentation d'un système de retry automatique (jusqu'à 2 tentatives) pour les erreurs réseau
   - Meilleure gestion des erreurs avec distinction entre erreurs 404 et erreurs réseau

2. **Correction du routage serveur** (`server/index.ts`)
   - Le catch-all pour le routage SPA n'intercepte plus les routes API non définies
   - Les endpoints API non trouvés retournent maintenant un JSON `{"error": "Endpoint non trouvé"}` au lieu de l'HTML
   - Ajout de la validation des paramètres slug pour les endpoints d'article et de dossier

3. **Optimisation des endpoints publics** (`server/index.ts`)
   - Utilisation de `getArticleBySlug` et `getDossierBySlug` au lieu de charger tous les éléments
   - Amélioration des performances en réduisant la charge sur la base de données
   - Ajout de logs contextuels pour faciliter le débogage

4. **Correction du proxy Vite** (`vite.config.ts`)
   - Ajout des routes `/sitemap.xml` et `/news-sitemap.xml` au proxy de développement
   - Le sitemap est maintenant accessible en mode développement via le proxy Vite

5. **Correction des exports du module de stockage** (`server/data/supabaseStorage.ts`)
   - Ajout des fonctions `updateAdminUser` et `deleteAdminUser` aux exports par défaut
   - Correction d'une erreur TypeScript qui empêchait la compilation

6. **Correction de l'ordre des hooks React** (`client/src/pages/Article.tsx`, `client/src/pages/Dossier.tsx`)
   - Déplacement de tous les hooks `useMemo` et `useCallback` AVANT les early returns
   - Respect strict des règles des hooks React (les hooks doivent être appelés dans le même ordre à chaque rendu)
   - Correction de l'erreur "updateWorkInProgressHook" qui causait un crash sur les pages Article et Dossier

#### Améliorations de l'Expérience Utilisateur

5. **Amélioration de la gestion des erreurs dans les pages** (`client/src/pages/Article.tsx`, `client/src/pages/Dossier.tsx`, `client/src/pages/Category.tsx`)
   - Distinction entre erreurs 404 (page non trouvée) et erreurs réseau
   - Affichage d'un bouton "Réessayer" pour les erreurs réseau
   - Messages d'erreur plus clairs et informatifs

#### Vérifications Effectuées

- **Build de production** : Génère correctement les fichiers dans `dist/public/` et `dist/index.js`
- **Routes API** : Tous les endpoints fonctionnent correctement
  - `/api/health` - Health check
  - `/api/articles` - Liste des articles publiés
  - `/api/articles/:slug` - Article par slug
  - `/api/categories` - Liste des catégories
  - `/api/dossiers` - Liste des dossiers actifs
  - `/api/dossiers/:slug` - Dossier par slug
- **Sitemap** : Généré dynamiquement avec images et news sitemap
- **SEO** : Meta tags, Open Graph, Twitter Cards, et données structurées correctement implémentés
- **Lazy Loading** : Toutes les pages sont chargées dynamiquement pour optimiser les performances
- **Code Splitting** : Les bundles sont correctement séparés (vendor-react, vendor-radix, etc.)

#### Fichiers Modifiés

| Fichier | Type de modification |
|---------|---------------------|
| `client/src/hooks/useArticles.tsx` | Correction + Amélioration |
| `client/src/hooks/useDossiers.tsx` | Correction + Amélioration |
| `client/src/pages/Article.tsx` | Amélioration UX |
| `client/src/pages/Dossier.tsx` | Amélioration UX |
| `client/src/pages/Category.tsx` | Amélioration UX |
| `server/index.ts` | Correction + Optimisation |
| `server/data/supabaseStorage.ts` | Correction exports |
| `vite.config.ts` | Correction proxy |

#### Tests Effectués

- [x] Health check endpoint (`/api/health`)
- [x] Liste des articles (`/api/articles`)
- [x] Article par slug (`/api/articles/:slug`)
- [x] Article inexistant retourne 404 JSON
- [x] Liste des catégories (`/api/categories`)
- [x] Liste des dossiers (`/api/dossiers`)
- [x] Dossier par slug (`/api/dossiers/:slug`)
- [x] Endpoint API inexistant retourne 404 JSON
- [x] Routes SPA retournent index.html
- [x] Sitemap XML généré correctement
- [x] Build de production réussi

---

## Prochaines Étapes Recommandées

1. **Tests E2E** : Ajouter des tests end-to-end avec Playwright ou Cypress
2. **Monitoring** : Configurer Sentry pour le suivi des erreurs en production
3. **Analytics** : Configurer Umami pour le suivi des visites
4. **CDN** : Considérer l'utilisation d'un CDN pour les assets statiques
5. **Cache** : Implémenter un cache Redis pour les requêtes fréquentes
