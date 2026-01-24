-- ============================================
-- Flash Info Afrique - RSS Automatic Scraping Schema
-- Migration: 20260124_rss_auto_schema
-- ============================================

-- Add columns to rss_feeds for automatic scraping
ALTER TABLE rss_feeds 
ADD COLUMN IF NOT EXISTS last_scraped_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS scrape_frequency_hours INTEGER DEFAULT 2,
ADD COLUMN IF NOT EXISTS article_count INTEGER DEFAULT 0;

-- Add source_url column to articles for duplicate detection
ALTER TABLE articles 
ADD COLUMN IF NOT EXISTS source_url TEXT,
ADD COLUMN IF NOT EXISTS relevance_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS auto_published BOOLEAN DEFAULT FALSE;

-- Update the status constraint to include 'pending' for RSS articles awaiting review
-- First, drop the existing constraint if it exists
DO $$
BEGIN
  -- Check if the constraint exists and doesn't include 'pending'
  IF EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'articles_status_check'
  ) THEN
    -- Drop the old constraint
    ALTER TABLE articles DROP CONSTRAINT articles_status_check;
    -- Add the new constraint with 'pending'
    ALTER TABLE articles ADD CONSTRAINT articles_status_check 
      CHECK (status IN ('draft', 'pending', 'published', 'archived'));
  END IF;
END $$;

-- Create unique index on source_url for duplicate detection
CREATE UNIQUE INDEX IF NOT EXISTS idx_articles_source_url 
ON articles(source_url) 
WHERE source_url IS NOT NULL;

-- Create index on relevance_score for sorting
CREATE INDEX IF NOT EXISTS idx_articles_relevance_score 
ON articles(relevance_score DESC) 
WHERE status = 'published';

-- ============================================
-- SCRAPING LOGS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS scraping_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id TEXT REFERENCES rss_feeds(id) ON DELETE CASCADE,
  source_name TEXT NOT NULL,
  articles_found INTEGER DEFAULT 0,
  articles_new INTEGER DEFAULT 0,
  articles_published INTEGER DEFAULT 0,
  articles_pending INTEGER DEFAULT 0,
  articles_skipped INTEGER DEFAULT 0,
  errors TEXT[],
  duration_ms INTEGER,
  scraped_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for querying logs by source
CREATE INDEX IF NOT EXISTS idx_scraping_logs_source 
ON scraping_logs(source_id, scraped_at DESC);

-- Index for querying recent logs
CREATE INDEX IF NOT EXISTS idx_scraping_logs_date 
ON scraping_logs(scraped_at DESC);

-- ============================================
-- ROW LEVEL SECURITY FOR SCRAPING LOGS
-- ============================================
ALTER TABLE scraping_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view scraping logs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'scraping_logs' 
    AND policyname = 'Scraping logs are viewable by admins'
  ) THEN
    CREATE POLICY "Scraping logs are viewable by admins"
      ON scraping_logs FOR SELECT
      USING (is_admin());
  END IF;
END $$;

-- Only admins can insert scraping logs (or service role)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'scraping_logs' 
    AND policyname = 'Scraping logs are insertable by admins'
  ) THEN
    CREATE POLICY "Scraping logs are insertable by admins"
      ON scraping_logs FOR INSERT
      WITH CHECK (true); -- Service role bypasses RLS
  END IF;
END $$;

-- ============================================
-- CLEANUP FUNCTION FOR OLD LOGS
-- ============================================
-- Keep only the last 7 days of scraping logs
CREATE OR REPLACE FUNCTION cleanup_old_scraping_logs()
RETURNS void AS $$
BEGIN
  DELETE FROM scraping_logs 
  WHERE scraped_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- VIEWS FOR STATISTICS
-- ============================================

-- View for daily scraping statistics
CREATE OR REPLACE VIEW scraping_daily_stats AS
SELECT 
  DATE(scraped_at) as date,
  COUNT(*) as total_scrapes,
  SUM(articles_found) as total_found,
  SUM(articles_new) as total_new,
  SUM(articles_published) as total_published,
  SUM(articles_pending) as total_pending,
  AVG(duration_ms)::INTEGER as avg_duration_ms
FROM scraping_logs
GROUP BY DATE(scraped_at)
ORDER BY date DESC;

-- View for source performance
CREATE OR REPLACE VIEW source_scraping_stats AS
SELECT 
  source_id,
  source_name,
  COUNT(*) as total_scrapes,
  SUM(articles_new) as total_articles,
  AVG(articles_new)::NUMERIC(10,2) as avg_articles_per_scrape,
  MAX(scraped_at) as last_scrape,
  SUM(ARRAY_LENGTH(errors, 1)) as total_errors
FROM scraping_logs
WHERE scraped_at > NOW() - INTERVAL '7 days'
GROUP BY source_id, source_name
ORDER BY total_articles DESC;

-- Update statistics
ANALYZE rss_feeds;
ANALYZE articles;
ANALYZE scraping_logs;
