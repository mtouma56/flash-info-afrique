-- ============================================
-- Add featured and order fields to dossiers table
-- ============================================

-- Add is_featured and order columns
ALTER TABLE dossiers 
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS "order" INTEGER;

-- Create index for featured dossiers queries
CREATE INDEX IF NOT EXISTS idx_dossiers_featured 
ON dossiers(is_featured, "order" NULLS LAST, updated_at DESC) 
WHERE is_featured = TRUE AND is_active = TRUE;

COMMENT ON COLUMN dossiers.is_featured IS 'Indique si le dossier doit être mis en vedette sur la page d''accueil';
COMMENT ON COLUMN dossiers."order" IS 'Ordre d''affichage pour les dossiers en vedette (1 = priorité haute)';
