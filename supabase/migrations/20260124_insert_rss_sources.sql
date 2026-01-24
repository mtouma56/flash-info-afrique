-- ============================================
-- Flash Info Afrique - Insert Priority RSS Sources
-- Migration: 20260124_insert_rss_sources
-- ============================================

-- Insert priority RSS sources for automatic scraping
-- These are the main sources for African financial news

INSERT INTO rss_feeds (id, name, url, enabled, auto_publish, default_category, filters, created_at, updated_at) VALUES
  -- Financial Afrik - Main Feed
  (
    'rss-financial-afrik-main',
    'Financial Afrik',
    'https://www.financialafrik.com/feed/',
    TRUE,
    TRUE,
    'banque-finance',
    '{"keywords": ["banque", "finance", "UEMOA", "BRVM", "BCEAO"], "excludeKeywords": [], "categories": [], "minLength": 100}',
    NOW(),
    NOW()
  ),
  
  -- Financial Afrik - Finance Section
  (
    'rss-financial-afrik-finance',
    'Financial Afrik - Finance',
    'https://www.financialafrik.com/category/finance/feed/',
    TRUE,
    TRUE,
    'banque-finance',
    '{"keywords": [], "excludeKeywords": [], "categories": [], "minLength": 100}',
    NOW(),
    NOW()
  ),
  
  -- Agence Ecofin - Finance
  (
    'rss-ecofin-finance',
    'Agence Ecofin - Finance',
    'https://www.agenceecofin.com/finance/rss',
    TRUE,
    TRUE,
    'banque-finance',
    '{"keywords": ["Afrique", "UEMOA", "BRVM", "banque"], "excludeKeywords": [], "categories": [], "minLength": 100}',
    NOW(),
    NOW()
  ),
  
  -- Agence Ecofin - Gestion Publique
  (
    'rss-ecofin-gestion-publique',
    'Agence Ecofin - Gestion Publique',
    'https://www.agenceecofin.com/gestion-publique/rss',
    TRUE,
    FALSE,
    'regulation-conformite',
    '{"keywords": ["budget", "dette", "gouvernement", "finances publiques"], "excludeKeywords": [], "categories": [], "minLength": 100}',
    NOW(),
    NOW()
  ),
  
  -- Jeune Afrique - Économie
  (
    'rss-jeune-afrique-economie',
    'Jeune Afrique - Économie',
    'https://www.jeuneafrique.com/economie-entreprises/feed/',
    TRUE,
    FALSE,
    'analyses-decryptages',
    '{"keywords": ["UEMOA", "Afrique de l''Ouest", "banque", "finance", "investissement"], "excludeKeywords": [], "categories": [], "minLength": 150}',
    NOW(),
    NOW()
  ),
  
  -- APA News
  (
    'rss-apa-news',
    'APA News',
    'https://apanews.net/fr/feed/',
    TRUE,
    FALSE,
    'analyses-decryptages',
    '{"keywords": ["économie", "finance", "banque", "UEMOA", "BCEAO"], "excludeKeywords": ["sport", "football"], "categories": [], "minLength": 100}',
    NOW(),
    NOW()
  )
  
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  url = EXCLUDED.url,
  enabled = EXCLUDED.enabled,
  auto_publish = EXCLUDED.auto_publish,
  default_category = EXCLUDED.default_category,
  filters = EXCLUDED.filters,
  updated_at = NOW();

-- Update statistics
ANALYZE rss_feeds;

-- Display inserted sources
SELECT id, name, enabled, auto_publish, default_category FROM rss_feeds ORDER BY name;
