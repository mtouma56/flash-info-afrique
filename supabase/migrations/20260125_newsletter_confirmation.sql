-- ============================================
-- Newsletter Confirmation System
-- Adds email confirmation flow for newsletter subscribers
-- ============================================

-- Add confirmation columns to newsletter_subscribers
ALTER TABLE newsletter_subscribers
ADD COLUMN IF NOT EXISTS confirmation_token TEXT,
ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS confirmation_token_expires_at TIMESTAMPTZ;

-- Index for faster token lookups
CREATE INDEX IF NOT EXISTS idx_newsletter_confirmation_token 
ON newsletter_subscribers(confirmation_token) 
WHERE confirmation_token IS NOT NULL;

-- Index for confirmed subscribers (used for sending newsletters)
CREATE INDEX IF NOT EXISTS idx_newsletter_confirmed 
ON newsletter_subscribers(confirmed_at) 
WHERE confirmed_at IS NOT NULL AND unsubscribed_at IS NULL;

-- Update existing subscribers to be confirmed (they already subscribed before confirmation was required)
UPDATE newsletter_subscribers 
SET confirmed_at = subscribed_at 
WHERE confirmed_at IS NULL;

-- Comment explaining the columns
COMMENT ON COLUMN newsletter_subscribers.confirmation_token IS 'Unique token sent to user email for confirming subscription';
COMMENT ON COLUMN newsletter_subscribers.confirmed_at IS 'Timestamp when user confirmed their email subscription';
COMMENT ON COLUMN newsletter_subscribers.confirmation_token_expires_at IS 'Token expiration time (48h after creation)';
