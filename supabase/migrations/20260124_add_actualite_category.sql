-- ============================================
-- Flash Info Afrique - Add Actualité Category
-- Migration: 20260124_add_actualite_category
-- ============================================

-- Add the "actualite" category if it doesn't exist
-- This category is used for general news articles from RSS feeds

INSERT INTO categories (id, name, slug, color, description) VALUES
  ('actualite', 'Actualité', 'actualite', '#6366F1', 'Actualités générales de la zone UEMOA')
ON CONFLICT (id) DO NOTHING;

-- Verify the category was added
SELECT id, name, slug, color FROM categories ORDER BY id;
