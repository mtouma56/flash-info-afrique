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

Dans l'éditeur SQL de Supabase, exécutez le contenu du fichier :

```bash
supabase/migrations/001_initial_schema.sql
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

## Checklist de déploiement

### Avant le déploiement

- [ ] Tests passent localement (`pnpm test:run`)
- [ ] Build réussi (`pnpm build`)
- [ ] Variables d'environnement configurées
- [ ] Migrations Supabase appliquées
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
- [ ] Vérification des erreurs Sentry
- [ ] Vérification des métriques

### En cas de problème

1. Vérifier les logs : `journalctl -u flash-info-afrique -f`
2. Vérifier Nginx : `tail -f /var/log/nginx/flashinfo.error.log`
3. Si nécessaire, effectuer un rollback
4. Contacter l'équipe si le problème persiste

## Support

Pour toute question ou problème :

- Ouvrez une issue sur le repository GitHub
- Consultez les logs et la documentation
- Vérifiez l'état des services tiers (Supabase, Sentry)
