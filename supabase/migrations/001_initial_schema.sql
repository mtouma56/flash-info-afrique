-- ============================================
-- Flash Info Afrique - Initial Database Schema
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- CATEGORIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  color TEXT NOT NULL DEFAULT '#1E3A8A',
  description TEXT
);

-- Insert default categories
INSERT INTO categories (id, name, slug, color, description) VALUES
  ('banque-finance', 'Banque & Finance', 'banque-finance', '#1E3A8A', 'Actualités du secteur bancaire et financier de la zone UEMOA'),
  ('regulation-conformite', 'Régulation & Conformité', 'regulation-conformite', '#DC2626', 'Régulation bancaire, Commission Bancaire UMOA, BCEAO, conformité'),
  ('marches-investissements', 'Marchés & Investissements', 'marches-investissements', '#10B981', 'BRVM, marchés financiers, investissements, notations'),
  ('analyses-decryptages', 'Analyses & Décryptages', 'analyses-decryptages', '#F97316', 'Analyses approfondies et décryptages des enjeux économiques')
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- ARTICLES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS articles (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT,
  category TEXT REFERENCES categories(slug) ON DELETE SET NULL,
  tags TEXT[] DEFAULT '{}',
  source JSONB DEFAULT '{"name": "", "url": ""}',
  published_at DATE,
  is_featured BOOLEAN DEFAULT FALSE,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  "order" INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_articles_status ON articles(status);
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_published_at ON articles(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);

-- ============================================
-- DOSSIERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS dossiers (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  article_ids TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dossiers_slug ON dossiers(slug);
CREATE INDEX IF NOT EXISTS idx_dossiers_is_active ON dossiers(is_active);

-- ============================================
-- DOSSIER TIMELINE EVENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS dossier_timeline_events (
  id TEXT PRIMARY KEY,
  dossier_id TEXT NOT NULL REFERENCES dossiers(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  title TEXT NOT NULL,
  description TEXT
);

CREATE INDEX IF NOT EXISTS idx_timeline_events_dossier ON dossier_timeline_events(dossier_id);
CREATE INDEX IF NOT EXISTS idx_timeline_events_date ON dossier_timeline_events(date);

-- ============================================
-- RSS FEEDS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS rss_feeds (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  enabled BOOLEAN DEFAULT TRUE,
  auto_publish BOOLEAN DEFAULT FALSE,
  last_fetch TIMESTAMPTZ,
  last_error TEXT,
  filters JSONB DEFAULT '{"keywords": [], "excludeKeywords": [], "categories": [], "minLength": 0}',
  default_category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rss_feeds_enabled ON rss_feeds(enabled);

-- ============================================
-- RSS ARTICLES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS rss_articles (
  id TEXT PRIMARY KEY,
  feed_id TEXT NOT NULL REFERENCES rss_feeds(id) ON DELETE CASCADE,
  feed_name TEXT NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT,
  link TEXT NOT NULL,
  pub_date TIMESTAMPTZ,
  image_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'published')),
  suggested_category TEXT,
  suggested_tags TEXT[] DEFAULT '{}',
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rss_articles_feed ON rss_articles(feed_id);
CREATE INDEX IF NOT EXISTS idx_rss_articles_status ON rss_articles(status);
CREATE INDEX IF NOT EXISTS idx_rss_articles_pub_date ON rss_articles(pub_date DESC);

-- ============================================
-- NEWSLETTER SUBSCRIBERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_newsletter_email ON newsletter_subscribers(email);

-- ============================================
-- ADMIN PROFILES TABLE (extends auth.users)
-- ============================================
CREATE TABLE IF NOT EXISTS admin_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin', 'editor')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- FUNCTIONS FOR UPDATED_AT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_articles_updated_at
  BEFORE UPDATE ON articles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dossiers_updated_at
  BEFORE UPDATE ON dossiers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rss_feeds_updated_at
  BEFORE UPDATE ON rss_feeds
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE dossiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE dossier_timeline_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE rss_feeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE rss_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_profiles ENABLE ROW LEVEL SECURITY;

-- Helper function to check if user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- CATEGORIES POLICIES
-- ============================================
-- Public read access
CREATE POLICY "Categories are viewable by everyone"
  ON categories FOR SELECT
  USING (true);

-- Admin write access
CREATE POLICY "Categories are editable by admins"
  ON categories FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================
-- ARTICLES POLICIES
-- ============================================
-- Public read access for published articles only
CREATE POLICY "Published articles are viewable by everyone"
  ON articles FOR SELECT
  USING (status = 'published' OR is_admin());

-- Admin write access
CREATE POLICY "Articles are editable by admins"
  ON articles FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Articles are updatable by admins"
  ON articles FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Articles are deletable by admins"
  ON articles FOR DELETE
  USING (is_admin());

-- ============================================
-- DOSSIERS POLICIES
-- ============================================
-- Public read access for active dossiers only
CREATE POLICY "Active dossiers are viewable by everyone"
  ON dossiers FOR SELECT
  USING (is_active = true OR is_admin());

-- Admin write access
CREATE POLICY "Dossiers are editable by admins"
  ON dossiers FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Dossiers are updatable by admins"
  ON dossiers FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Dossiers are deletable by admins"
  ON dossiers FOR DELETE
  USING (is_admin());

-- ============================================
-- DOSSIER TIMELINE EVENTS POLICIES
-- ============================================
-- Public read access (follows dossier visibility)
CREATE POLICY "Timeline events are viewable with dossier"
  ON dossier_timeline_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM dossiers
      WHERE dossiers.id = dossier_timeline_events.dossier_id
      AND (dossiers.is_active = true OR is_admin())
    )
  );

-- Admin write access
CREATE POLICY "Timeline events are editable by admins"
  ON dossier_timeline_events FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Timeline events are updatable by admins"
  ON dossier_timeline_events FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE POLICY "Timeline events are deletable by admins"
  ON dossier_timeline_events FOR DELETE
  USING (is_admin());

-- ============================================
-- RSS FEEDS POLICIES (Admin only)
-- ============================================
CREATE POLICY "RSS feeds are viewable by admins"
  ON rss_feeds FOR SELECT
  USING (is_admin());

CREATE POLICY "RSS feeds are editable by admins"
  ON rss_feeds FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================
-- RSS ARTICLES POLICIES (Admin only)
-- ============================================
CREATE POLICY "RSS articles are viewable by admins"
  ON rss_articles FOR SELECT
  USING (is_admin());

CREATE POLICY "RSS articles are editable by admins"
  ON rss_articles FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ============================================
-- NEWSLETTER SUBSCRIBERS POLICIES
-- ============================================
-- Public insert access (anyone can subscribe)
CREATE POLICY "Anyone can subscribe to newsletter"
  ON newsletter_subscribers FOR INSERT
  WITH CHECK (true);

-- Admin read access only
CREATE POLICY "Newsletter subscribers are viewable by admins"
  ON newsletter_subscribers FOR SELECT
  USING (is_admin());

-- Admin delete access
CREATE POLICY "Newsletter subscribers are deletable by admins"
  ON newsletter_subscribers FOR DELETE
  USING (is_admin());

-- ============================================
-- ADMIN PROFILES POLICIES
-- ============================================
CREATE POLICY "Admin profiles are viewable by admins"
  ON admin_profiles FOR SELECT
  USING (is_admin() OR id = auth.uid());

CREATE POLICY "Admin profiles are editable by admins"
  ON admin_profiles FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());
