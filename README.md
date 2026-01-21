# Flash Info Afrique

Plateforme média professionnelle d'information économique et financière pour la zone UEMOA (Union Économique et Monétaire Ouest-Africaine).

## 📋 Description

Flash Info Afrique est une application web moderne qui permet de publier et gérer du contenu éditorial spécialisé dans l'économie et la finance africaine. La plateforme comprend :

- **Site public** : Affichage d'articles, dossiers thématiques et catégories
- **Panel d'administration** : Gestion complète du contenu avec authentification sécurisée
- **Système RSS** : Import automatique d'articles depuis des flux RSS externes
- **Newsletter** : Système d'inscription pour les lecteurs
- **Thème clair/sombre** : Support du mode sombre avec détection automatique

## 🚀 Technologies

### Frontend
- **React 19** avec TypeScript
- **Vite** pour le build et le développement
- **Wouter** pour le routing
- **Tailwind CSS 4** pour le styling
- **Radix UI** pour les composants accessibles
- **Framer Motion** pour les animations
- **React Hook Form** + **Zod** pour la validation

### Backend
- **Express.js** avec TypeScript
- **JWT** pour l'authentification
- **bcrypt** pour le hachage des mots de passe
- **Helmet** pour la sécurité
- **express-rate-limit** pour la protection contre les abus

### Stockage
- Fichiers JSON pour la persistance des données (articles, dossiers, catégories, utilisateurs)

### Outils de développement
- **Vitest** pour les tests
- **Prettier** pour le formatage
- **TypeScript** pour la sécurité des types
- **pnpm** comme gestionnaire de paquets

## 📁 Structure du projet

```
flash-info-afrique/
├── client/                 # Application React frontend
│   ├── src/
│   │   ├── components/    # Composants réutilisables
│   │   ├── pages/         # Pages de l'application
│   │   │   ├── admin/     # Pages d'administration
│   │   │   └── ...        # Pages publiques
│   │   ├── contexts/      # Contextes React (Auth, Theme)
│   │   ├── hooks/         # Hooks personnalisés
│   │   ├── lib/           # Utilitaires
│   │   └── data/          # Données statiques
│   └── public/            # Assets statiques
├── server/                # API Express backend
│   ├── index.ts          # Point d'entrée du serveur
│   ├── middleware/       # Middlewares (auth, etc.)
│   ├── services/         # Services métier (RSS, etc.)
│   └── data/             # Stockage JSON
├── shared/               # Code partagé entre client et serveur
│   ├── types/           # Types TypeScript partagés
│   └── const.ts         # Constantes partagées
├── dist/                # Build de production
└── patches/             # Patches pour dépendances
```

## 🛠️ Installation

### Prérequis
- **Node.js** 18+ 
- **pnpm** 10.4.1+ (recommandé) ou npm/yarn

### Étapes

1. **Cloner le dépôt**
   ```bash
   git clone https://github.com/VOTRE_USERNAME/flash-info-afrique.git
   cd flash-info-afrique
   ```

2. **Installer les dépendances**
   ```bash
   pnpm install
   ```

3. **Configurer les variables d'environnement** (optionnel)
   
   Créer un fichier `.env` à la racine :
   ```env
   JWT_SECRET=votre-secret-jwt-super-securise
   PORT=3001
   NODE_ENV=development
   ```

4. **Lancer le serveur de développement**
   ```bash
   pnpm dev
   ```
   
   Cela démarre :
   - Le client Vite sur `http://localhost:3000`
   - Le serveur Express sur `http://localhost:3001`

## 📜 Scripts disponibles

| Commande | Description |
|----------|-------------|
| `pnpm dev` | Démarre le client et le serveur en mode développement |
| `pnpm dev:client` | Démarre uniquement le client Vite |
| `pnpm dev:server` | Démarre uniquement le serveur Express |
| `pnpm build` | Build de production (client + serveur) |
| `pnpm start` | Démarre l'application en mode production |
| `pnpm preview` | Prévisualise le build de production |
| `pnpm test` | Lance les tests en mode watch |
| `pnpm test:run` | Lance les tests une fois |
| `pnpm test:coverage` | Génère un rapport de couverture |
| `pnpm check` | Vérifie les types TypeScript |
| `pnpm format` | Formate le code avec Prettier |
| `pnpm lint` | Vérifie les erreurs TypeScript |

## 🔐 Authentification Admin

Par défaut, un utilisateur admin est créé automatiquement au premier login :

- **Username** : `admin`
- **Password** : `admin123`

⚠️ **Important** : Changez ces identifiants immédiatement en production !

L'authentification utilise JWT avec un token valide 24h.

## 📝 Fonctionnalités

### Site Public
- ✅ Affichage des articles publiés
- ✅ Navigation par catégories
- ✅ Dossiers thématiques avec timeline interactive
- ✅ Articles mis en avant (featured)
- ✅ Recherche et filtrage
- ✅ Partage social
- ✅ SEO optimisé (meta tags, structured data)
- ✅ Mode sombre/clair
- ✅ Responsive design

### Panel Admin
- ✅ Dashboard avec statistiques
- ✅ Gestion des articles (CRUD complet)
- ✅ Gestion des dossiers
- ✅ Gestion des catégories
- ✅ Import RSS avec validation
- ✅ Modération des articles RSS (approuver/rejeter/éditer)
- ✅ Gestion des utilisateurs admin
- ✅ Paramètres de l'application

### API Endpoints

#### Public
- `GET /api/articles` - Liste des articles publiés
- `GET /api/articles/:slug` - Détails d'un article
- `GET /api/categories` - Liste des catégories
- `GET /api/dossiers` - Liste des dossiers actifs
- `GET /api/dossiers/:slug` - Détails d'un dossier
- `POST /api/newsletter/subscribe` - Inscription newsletter

#### Admin (authentification requise)
- `POST /api/admin/login` - Connexion
- `GET /api/admin/stats` - Statistiques du dashboard
- `GET /api/admin/articles` - Liste tous les articles
- `POST /api/admin/articles` - Créer un article
- `PUT /api/admin/articles/:id` - Modifier un article
- `DELETE /api/admin/articles/:id` - Supprimer un article
- `GET /api/admin/rss/feeds` - Liste des flux RSS
- `POST /api/admin/rss/feeds/:id/fetch` - Récupérer les articles d'un flux
- `POST /api/admin/rss/articles/:id/approve` - Approuver un article RSS
- ... et plus

## 🧪 Tests

Les tests sont configurés avec Vitest et React Testing Library :

```bash
# Lancer les tests
pnpm test

# Tests avec couverture
pnpm test:coverage
```

Les tests sont situés dans `client/src/**/*.test.{ts,tsx}`.

## 🏗️ Build de production

```bash
# Build complet
pnpm build

# Démarrer en production
pnpm start
```

Le build génère :
- `dist/public/` : Assets statiques du client
- `dist/index.js` : Serveur Express bundle

## 🔒 Sécurité

- ✅ Authentification JWT sécurisée
- ✅ Mots de passe hashés avec bcrypt
- ✅ Headers de sécurité avec Helmet
- ✅ Rate limiting sur les API
- ✅ Validation des entrées avec Zod
- ✅ Protection CSRF (via Helmet)
- ✅ Variables d'environnement pour les secrets

## 📦 Déploiement

### Variables d'environnement requises

```env
JWT_SECRET=secret-super-securise-en-production
PORT=3000
NODE_ENV=production
```

### Étapes de déploiement

1. Build de production : `pnpm build`
2. Démarrez le serveur : `pnpm start`
3. Configurez un reverse proxy (nginx, etc.) si nécessaire
4. Configurez SSL/HTTPS

## 🤝 Contribution

Les contributions sont les bienvenues ! Pour contribuer :

1. Fork le projet
2. Créez une branche pour votre feature (`git checkout -b feature/AmazingFeature`)
3. Committez vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 👤 Auteur

Votre nom / Organisation

## 🙏 Remerciements

- [Radix UI](https://www.radix-ui.com/) pour les composants accessibles
- [Tailwind CSS](https://tailwindcss.com/) pour le framework CSS
- [Vite](https://vitejs.dev/) pour l'outil de build
- [Wouter](https://github.com/molefrog/wouter) pour le routing léger
