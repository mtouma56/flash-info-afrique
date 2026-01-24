-- ============================================
-- Flash Info Afrique - Performance Indexes
-- Migration: 20260124_add_performance_indexes
-- ============================================

-- Index pour optimiser les requêtes sur les articles publiés
-- Améliore les requêtes: SELECT * FROM articles WHERE status = 'published' ORDER BY published_at DESC
CREATE INDEX IF NOT EXISTS idx_articles_published_status 
ON articles(published_at DESC) 
WHERE status = 'published';

-- Index pour les articles featured (articles à la une)
-- Améliore les requêtes: SELECT * FROM articles WHERE is_featured = TRUE
CREATE INDEX IF NOT EXISTS idx_articles_featured 
ON articles(is_featured, published_at DESC) 
WHERE is_featured = TRUE;

-- Index GIN pour la recherche dans les tags (ex: FIDELIS)
-- Améliore les requêtes: SELECT * FROM articles WHERE tags @> ARRAY['FIDELIS']
CREATE INDEX IF NOT EXISTS idx_articles_tags_gin 
ON articles USING GIN(tags);

-- Index pour les recherches par slug (déjà créé mais s'assurer qu'il existe)
CREATE INDEX IF NOT EXISTS idx_articles_slug 
ON articles(slug);

-- Index composite pour le tri par date et statut
CREATE INDEX IF NOT EXISTS idx_articles_status_date 
ON articles(status, published_at DESC);

-- Index pour les flux RSS actifs
CREATE INDEX IF NOT EXISTS idx_rss_feeds_enabled 
ON rss_feeds(enabled, last_fetch DESC) 
WHERE enabled = TRUE;

-- Index pour les articles RSS en attente de modération
CREATE INDEX IF NOT EXISTS idx_rss_articles_pending 
ON rss_articles(status, pub_date DESC) 
WHERE status = 'pending';

-- Index pour les dossiers actifs
CREATE INDEX IF NOT EXISTS idx_dossiers_active_slug 
ON dossiers(slug) 
WHERE is_active = TRUE;

-- Index pour les catégories (recherche par slug)
CREATE INDEX IF NOT EXISTS idx_categories_slug 
ON categories(slug);

-- Index pour la newsletter (recherche par email)
CREATE INDEX IF NOT EXISTS idx_newsletter_active 
ON newsletter_subscribers(email) 
WHERE unsubscribed_at IS NULL;

-- Mettre à jour les statistiques de l'optimiseur de requêtes
ANALYZE articles;
ANALYZE categories;
ANALYZE dossiers;
ANALYZE rss_feeds;
ANALYZE rss_articles;
ANALYZE newsletter_subscribers;

-- Commentaire pour la documentation
COMMENT ON INDEX idx_articles_published_status IS 'Optimise les requêtes sur les articles publiés triés par date';
COMMENT ON INDEX idx_articles_featured IS 'Optimise les requêtes sur les articles à la une';
COMMENT ON INDEX idx_articles_tags_gin IS 'Optimise les recherches par tags (FIDELIS, UEMOA, etc.)';
