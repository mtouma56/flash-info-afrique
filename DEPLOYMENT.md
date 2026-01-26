# Guide de Déploiement - Flash Info Afrique

Ce guide détaille les étapes pour déployer Flash Info Afrique en production.

## Table des matières

1. [Prérequis](#prérequis)
2. [Configuration Supabase](#configuration-supabase)
3. [Variables d'environnement](#variables-denvironnement)
4. [Build de production](#build-de-production)
5. [Déploiement](#déploiement)
6. [Configuration Nginx](#configuration-nginx)
7. [SSL/HTTPS avec Let's Encrypt](#sslhttps-avec-lets-encrypt)
8. [Monitoring et Logs](#monitoring-et-logs)
9. [Sauvegardes](#sauvegardes)
10. [Rollback](#rollback)
11. [Checklist de déploiement](#checklist-de-déploiement)

## Prérequis

- **Serveur** : Ubuntu 22.04 LTS ou similaire
- **Node.js** : 18.x ou supérieur
- **pnpm** : 10.4.1 ou supérieur
- **Nginx** : Pour le reverse proxy
- **Certbot** : Pour les certificats SSL
- **Compte Supabase** : Pour la base de données et l'authentification

## Configuration Supabase

### 1. Créer un projet Supabase

1. Allez sur [supabase.com](https://supabase.com) et créez un compte
2. Créez un nouveau projet
3. Notez l'URL du projet et les clés API (Settings > API)

### 2. Exécuter les migrations

Dans l'éditeur SQL de Supabase, exécutez les migrations **dans l'ordre** :

#### Migration 1 : Schéma initial (obligatoire)

```bash
supabase/migrations/001_initial_schema.sql
```

#### Migration 2 : RSS Auto-Scraping (obligatoire pour le scraping RSS)

Cette migration ajoute les colonnes nécessaires pour le scraping RSS automatique :
- `source_url`, `relevance_score`, `auto_published` dans la table `articles`
- `last_scraped_at`, `scrape_frequency_hours`, `article_count` dans la table `rss_feeds`
- Table `scraping_logs` pour le suivi des scrapings
- Mise à jour de la contrainte de statut pour inclure `pending`

```bash
supabase/migrations/20260124_rss_auto_schema.sql
```

#### Migration 3 : Index de performance (recommandée)

```bash
supabase/migrations/20260124_add_performance_indexes.sql
```

#### Migration 4 : Sources RSS (optionnelle)

```bash
supabase/migrations/20260124_insert_rss_sources.sql
```

#### Vérification du schéma

Après avoir exécuté les migrations, vérifiez que tout est correct :

```bash
# Vérifier les colonnes manquantes
npx tsx scripts/verify-schema.ts

# Tester l'insertion d'articles RSS
npx tsx scripts/test-rss-insert.ts
```

### 3. Configurer l'authentification

1. Dans Authentication > Providers, activez Email
2. Configurez les paramètres de mot de passe (longueur min, etc.)
3. Optionnel : Configurez les templates d'emails

## Variables d'environnement

Créez un fichier `.env` basé sur `.env.example` :

```bash
cp .env.example .env
nano .env
```

### Variables requises

| Variable | Description | Exemple |
|----------|-------------|---------|
| `SUPABASE_URL` | URL du projet Supabase | `https://xxx.supabase.co` |
| `SUPABASE_ANON_KEY` | Clé anonyme Supabase | `eyJ...` |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service role (secrète) | `eyJ...` |
| `VITE_SUPABASE_URL` | URL Supabase (client) | Même que SUPABASE_URL |
| `VITE_SUPABASE_ANON_KEY` | Clé anonyme (client) | Même que SUPABASE_ANON_KEY |
| `PORT` | Port du serveur | `3000` |
| `NODE_ENV` | Environnement | `production` |
| `SITE_URL` | URL publique du site | `https://flashinfoafrique.com` |

### Variables optionnelles

| Variable | Description |
|----------|-------------|
| `CRON_SECRET` | **OBLIGATOIRE pour Vercel** - Secret pour sécuriser les endpoints cron (générer avec `openssl rand -base64 32`) |
| `RESEND_API_KEY` | Clé API Resend pour l'envoi d'emails (newsletter) |
| `RESEND_FROM_EMAIL` | Email expéditeur (format: "Nom <email@domaine.com>") |
| `VITE_SENTRY_DSN` | DSN Sentry pour error tracking |
| `VITE_ANALYTICS_ENDPOINT` | URL Umami Analytics |
| `VITE_ANALYTICS_WEBSITE_ID` | ID site Umami |
| `LOG_LEVEL` | Niveau de logs (error, warn, info, debug) |
| `JWT_SECRET` | Secret pour JWT (générer avec `openssl rand -base64 32`) |

## Build de production

```bash
# Installation des dépendances
pnpm install

# Build
pnpm build

# Le build génère :
# - dist/public/  : Assets statiques du client
# - dist/index.js : Serveur Express bundle
```

## Déploiement

### Option 1 : Déploiement manuel

```bash
# Sur le serveur
cd /var/www/flash-info-afrique

# Pull des changements
git pull origin main

# Installation et build
pnpm install --frozen-lockfile
pnpm build

# Redémarrer le service
sudo systemctl restart flash-info-afrique
```

### Option 2 : Avec PM2

```bash
# Installation de PM2
npm install -g pm2

# Démarrer l'application
pm2 start dist/index.js --name flash-info-afrique

# Sauvegarder la configuration PM2
pm2 save

# Activer le démarrage automatique
pm2 startup
```

### Service systemd (recommandé)

Créez `/etc/systemd/system/flash-info-afrique.service` :

```ini
[Unit]
Description=Flash Info Afrique
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/flash-info-afrique
ExecStart=/usr/bin/node dist/index.js
Restart=on-failure
RestartSec=10
StandardOutput=journal
StandardError=journal
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

```bash
# Activer et démarrer le service
sudo systemctl daemon-reload
sudo systemctl enable flash-info-afrique
sudo systemctl start flash-info-afrique

# Vérifier le statut
sudo systemctl status flash-info-afrique
```

## Configuration Nginx

Créez `/etc/nginx/sites-available/flash-info-afrique` :

```nginx
upstream flashinfo_backend {
    server 127.0.0.1:3000;
    keepalive 64;
}

server {
    listen 80;
    server_name flashinfoafrique.com www.flashinfoafrique.com;
    
    # Redirection vers HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name flashinfoafrique.com www.flashinfoafrique.com;

    # SSL (sera configuré par Certbot)
    ssl_certificate /etc/letsencrypt/live/flashinfoafrique.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/flashinfoafrique.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # Sécurité
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript application/rss+xml application/atom+xml image/svg+xml;

    # Logs
    access_log /var/log/nginx/flashinfo.access.log;
    error_log /var/log/nginx/flashinfo.error.log;

    # Assets statiques avec cache long
    location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$ {
        proxy_pass http://flashinfo_backend;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Sitemap et robots
    location ~ ^/(sitemap\.xml|robots\.txt)$ {
        proxy_pass http://flashinfo_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_cache_valid 200 1h;
    }

    # API
    location /api {
        proxy_pass http://flashinfo_backend;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Rate limiting
        limit_req zone=api burst=20 nodelay;
    }

    # Tout le reste
    location / {
        proxy_pass http://flashinfo_backend;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Ajoutez le rate limiting dans `/etc/nginx/nginx.conf` (dans le bloc http) :

```nginx
# Rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
```

Activez la configuration :

```bash
sudo ln -s /etc/nginx/sites-available/flash-info-afrique /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## SSL/HTTPS avec Let's Encrypt

```bash
# Installation de Certbot
sudo apt install certbot python3-certbot-nginx

# Obtenir le certificat
sudo certbot --nginx -d flashinfoafrique.com -d www.flashinfoafrique.com

# Le renouvellement automatique est configuré par défaut
# Vérifier avec :
sudo certbot renew --dry-run
```

## Monitoring et Logs

### Logs de l'application

```bash
# Avec systemd
sudo journalctl -u flash-info-afrique -f

# Logs Nginx
tail -f /var/log/nginx/flashinfo.access.log
tail -f /var/log/nginx/flashinfo.error.log
```

### Health Check

L'endpoint `/api/health` fournit des informations sur l'état du serveur :

```bash
curl https://flashinfoafrique.com/api/health
```

### Sentry (Error Tracking)

1. Créez un projet sur [sentry.io](https://sentry.io)
2. Ajoutez le DSN dans `.env` :
   ```
   VITE_SENTRY_DSN=https://xxx@sentry.io/xxx
   ```
3. Reconstruisez l'application

### Umami Analytics (optionnel)

1. Déployez Umami sur votre serveur ou utilisez un service hébergé
2. Configurez les variables :
   ```
   VITE_ANALYTICS_ENDPOINT=https://analytics.votre-domaine.com
   VITE_ANALYTICS_WEBSITE_ID=votre-website-id
   ```

## Sauvegardes

### Sauvegarde Supabase

Supabase effectue des sauvegardes automatiques. Pour les sauvegardes manuelles :

1. Allez dans Database > Backups
2. Cliquez sur "Create backup"

Ou via CLI :

```bash
# Installer Supabase CLI
npm install -g supabase

# Login
supabase login

# Dump de la base
supabase db dump --project-ref votre-project-ref > backup.sql
```

### Script de sauvegarde automatique

Créez `/opt/scripts/backup-flashinfo.sh` :

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=/var/backups/flashinfo

# Créer le répertoire si nécessaire
mkdir -p $BACKUP_DIR

# Sauvegarde du code
tar -czf $BACKUP_DIR/code_$DATE.tar.gz -C /var/www flash-info-afrique --exclude=node_modules --exclude=dist

# Sauvegarde des variables d'environnement
cp /var/www/flash-info-afrique/.env $BACKUP_DIR/env_$DATE

# Nettoyer les vieilles sauvegardes (garder 7 jours)
find $BACKUP_DIR -type f -mtime +7 -delete

echo "Backup completed: $DATE"
```

Ajoutez au cron :

```bash
# Éditer le crontab
sudo crontab -e

# Ajouter (sauvegarde quotidienne à 2h)
0 2 * * * /opt/scripts/backup-flashinfo.sh >> /var/log/flashinfo-backup.log 2>&1
```

## Rollback

### Rollback rapide avec Git

```bash
cd /var/www/flash-info-afrique

# Voir l'historique
git log --oneline -10

# Rollback vers un commit spécifique
git checkout <commit-hash>

# Rebuild et restart
pnpm install --frozen-lockfile
pnpm build
sudo systemctl restart flash-info-afrique
```

### Rollback avec tags de version

```bash
# Lister les tags
git tag -l

# Checkout un tag spécifique
git checkout v1.0.0

# Rebuild
pnpm install --frozen-lockfile
pnpm build
sudo systemctl restart flash-info-afrique
```

## Configuration des Cron Jobs (Vercel)

### Vue d'ensemble

Le projet utilise des cron jobs Vercel pour automatiser deux tâches :

1. **Scraping RSS automatique** : `/api/scrape-rss`
   - Schedule : `0 */2 * * *` (toutes les 2 heures)
   - Fonction : Scrape toutes les sources RSS configurées et importe les nouveaux articles

2. **Newsletter hebdomadaire** : `/api/newsletter/send-weekly`
   - Schedule : `0 8 * * 5` (vendredi à 8h00 UTC)
   - Fonction : Envoie la newsletter hebdomadaire à tous les abonnés

### Fuseau horaire

**⚠️ Important** : Les schedules cron Vercel utilisent le fuseau horaire **UTC**.

| Schedule | UTC | Paris (CET/CEST) | Dakar (GMT) |
|----------|-----|------------------|-------------|
| `0 */2 * * *` (RSS) | Toutes les 2h | Toutes les 2h | Toutes les 2h |
| `0 8 * * 5` (Newsletter) | Vendredi 8h00 | Vendredi 9h00 (hiver) / 10h00 (été) | Vendredi 8h00 |

**Pourquoi UTC ?**
- Vercel utilise UTC pour tous les cron jobs
- Évite les problèmes liés aux changements d'heure (heure d'été/hiver)
- Standard de l'industrie pour les tâches planifiées

**Ajuster le schedule si nécessaire** :
- Pour envoyer la newsletter à 9h00 heure de Paris en hiver : `0 8 * * 5`
- Pour envoyer la newsletter à 9h00 heure de Paris en été : `0 7 * * 5`
- Pour envoyer à 9h00 heure de Dakar : `0 9 * * 5`

Le schedule actuel (`0 8 * * 5`) est optimisé pour une audience en Afrique de l'Ouest (GMT), où 8h00 UTC correspond à 8h00 heure locale.

### Configuration dans Vercel

#### 1. Configurer CRON_SECRET

**⚠️ CRITIQUE** : Sans cette variable, les cron jobs échoueront avec une erreur 401.

1. Générez un secret sécurisé :
   ```bash
   openssl rand -base64 32
   ```

2. Ajoutez `CRON_SECRET` dans les variables d'environnement Vercel :
   - Allez dans votre projet Vercel > Settings > Environment Variables
   - Ajoutez `CRON_SECRET` avec la valeur générée
   - **Important** : Configurez-la pour **Production**, **Preview**, et **Development**

3. Redéployez votre application pour que la variable soit prise en compte

#### 2. Vérifier la configuration dans vercel.json

Les cron jobs sont configurés dans `vercel.json` :

```json
{
  "crons": [
    {
      "path": "/api/scrape-rss",
      "schedule": "0 */2 * * *"
    },
    {
      "path": "/api/newsletter/send-weekly",
      "schedule": "0 8 * * 5"
    }
  ]
}
```

#### 3. Tester les cron jobs

**Test manuel** (avec authentification) :

```bash
# Test scraping RSS
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://votre-domaine.vercel.app/api/scrape-rss

# Test newsletter
curl -H "Authorization: Bearer YOUR_CRON_SECRET" \
  https://votre-domaine.vercel.app/api/newsletter/send-weekly
```

**Via Vercel Dashboard** :
- Allez dans votre projet > Settings > Cron Jobs
- Vous pouvez déclencher manuellement les cron jobs depuis l'interface

### Dépannage des Cron Jobs

#### Erreur 401 "Unauthorized"

**Cause** : `CRON_SECRET` n'est pas configuré ou ne correspond pas.

**Solution** :
1. Vérifiez que `CRON_SECRET` est bien configuré dans Vercel (Settings > Environment Variables)
2. Vérifiez que la valeur correspond à celle dans votre `.env` local
3. Redéployez l'application après avoir ajouté/modifié la variable
4. Vérifiez les logs Vercel pour voir les erreurs d'authentification

#### Les cron jobs ne s'exécutent pas

**Vérifications** :
1. Vérifiez que `vercel.json` contient bien la section `crons`
2. Vérifiez que les paths correspondent aux endpoints (`/api/scrape-rss`, `/api/newsletter/send-weekly`)
3. Vérifiez les logs Vercel (Deployments > Logs) pour voir si les cron jobs sont déclenchés
4. Vérifiez que les schedules sont corrects (format cron)

#### Logs d'avertissement en production

Si vous voyez ce message dans les logs :
```
⚠️  CRITICAL: CRON_SECRET is using default value in production!
```

**Action immédiate** : Configurez `CRON_SECRET` dans Vercel et redéployez.

### Sécurité

- ✅ Les endpoints cron sont protégés par authentification Bearer token
- ✅ Seul Vercel (avec le bon `CRON_SECRET`) peut déclencher les cron jobs
- ✅ Les requêtes non authentifiées reçoivent une erreur 401
- ✅ Le secret est stocké de manière sécurisée dans les variables d'environnement Vercel

### Monitoring

Pour surveiller l'exécution des cron jobs :

1. **Logs Vercel** : Allez dans Deployments > Sélectionnez un déploiement > Logs
2. **Métriques** : Vérifiez les métriques de performance dans Vercel Analytics
3. **Logs applicatifs** : Les endpoints loggent automatiquement :
   - Début et fin d'exécution
   - Nombre d'articles trouvés/importés
   - Erreurs éventuelles
   - Durée d'exécution

## Checklist de déploiement

### Avant le déploiement

- [ ] Tests passent localement (`pnpm test:run`)
- [ ] Build réussi (`pnpm build`)
- [ ] Variables d'environnement configurées
- [ ] **CRON_SECRET configuré dans Vercel** (Production, Preview, Development)
- [ ] Migrations Supabase appliquées :
  - [ ] `001_initial_schema.sql`
  - [ ] `20260124_rss_auto_schema.sql` (pour RSS)
  - [ ] `20260124_add_performance_indexes.sql`
- [ ] Vérification du schéma (`npx tsx scripts/verify-schema.ts`)
- [ ] Sauvegarde de la version actuelle

### Pendant le déploiement

- [ ] Pull des changements
- [ ] Installation des dépendances
- [ ] Build de production
- [ ] Redémarrage du service
- [ ] Vérification des logs

### Après le déploiement

- [ ] Health check (`/api/health`)
- [ ] Test des fonctionnalités critiques
- [ ] **Test des cron jobs manuellement** (vérifier l'authentification)
- [ ] Vérification des erreurs Sentry
- [ ] Vérification des métriques
- [ ] Vérification des logs Vercel pour confirmer l'exécution des cron jobs

### En cas de problème

1. Vérifier les logs : `journalctl -u flash-info-afrique -f`
2. Vérifier Nginx : `tail -f /var/log/nginx/flashinfo.error.log`
3. Si nécessaire, effectuer un rollback
4. Contacter l'équipe si le problème persiste

## Dépannage

### Erreur RSS : "Could not find the 'auto_published' column"

Cette erreur indique que la migration RSS n'a pas été exécutée. Solution :

1. Exécutez la migration dans Supabase SQL Editor :
   ```bash
   supabase/migrations/20260124_rss_auto_schema.sql
   ```

2. Vérifiez avec le script de vérification :
   ```bash
   npx tsx scripts/verify-schema.ts
   ```

3. Testez l'insertion :
   ```bash
   npx tsx scripts/test-rss-insert.ts
   ```

### Erreur RSS : "violates check constraint articles_status_check"

Le statut `pending` n'est pas dans la contrainte. La migration `20260124_rss_auto_schema.sql` corrige cela automatiquement.

### Le scraping fonctionne mais 0 articles insérés

Vérifiez :
1. Que toutes les migrations ont été appliquées
2. Que les colonnes `source_url`, `relevance_score`, `auto_published` existent
3. Les logs d'erreur dans la réponse de l'endpoint `/api/admin/rss/scrape`

### Les cron jobs ne fonctionnent pas

**Symptômes** : Les cron jobs retournent 401 ou ne s'exécutent pas automatiquement.

**Solutions** :
1. Vérifiez que `CRON_SECRET` est configuré dans Vercel (Settings > Environment Variables)
2. Vérifiez que `CRON_SECRET` est identique dans tous les environnements (Production, Preview, Development)
3. Redéployez l'application après avoir configuré `CRON_SECRET`
4. Testez manuellement avec curl pour vérifier l'authentification
5. Vérifiez les logs Vercel pour voir les erreurs exactes
6. Vérifiez que `vercel.json` contient bien la section `crons` avec les bons paths

## Support

Pour toute question ou problème :

- Ouvrez une issue sur le repository GitHub
- Consultez les logs et la documentation
- Vérifiez l'état des services tiers (Supabase, Sentry)
