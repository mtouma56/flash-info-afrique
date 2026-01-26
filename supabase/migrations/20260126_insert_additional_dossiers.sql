-- ============================================
-- Insert additional dossiers for content diversification
-- ============================================

-- Dossier 1: Crise bancaire CEMAC
INSERT INTO dossiers (id, title, slug, description, article_ids, is_active, is_featured, "order", created_at, updated_at)
VALUES (
  'dossier-crise-bancaire-cemac',
  'Crise bancaire CEMAC',
  'crise-bancaire-cemac',
  'Faillites bancaires et régulation défaillante dans la zone CEMAC. Analyse des mécanismes de supervision et des conséquences économiques pour les pays membres.',
  '{}',
  TRUE,
  FALSE,
  NULL,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Timeline events for Crise bancaire CEMAC
INSERT INTO dossier_timeline_events (id, dossier_id, date, title, description)
VALUES
  ('evt-cemac-1', 'dossier-crise-bancaire-cemac', '2023-06-15', 'Première faillite bancaire majeure', 'Une banque de la zone CEMAC annonce sa faillite, révélant des failles dans le système de supervision.'),
  ('evt-cemac-2', 'dossier-crise-bancaire-cemac', '2023-09-20', 'Réaction des autorités de régulation', 'La COBAC annonce un renforcement des contrôles et des mesures de prévention.'),
  ('evt-cemac-3', 'dossier-crise-bancaire-cemac', '2024-01-10', 'Audit du système bancaire', 'Lancement d''un audit complet du système bancaire de la zone CEMAC.'),
  ('evt-cemac-4', 'dossier-crise-bancaire-cemac', '2024-05-30', 'Nouvelles mesures de régulation', 'Adoption de nouvelles normes prudentielles et de mécanismes de surveillance renforcés.')
ON CONFLICT (id) DO NOTHING;

-- Dossier 2: Affaire Sonatel-Orange Sénégal
INSERT INTO dossiers (id, title, slug, description, article_ids, is_active, is_featured, "order", created_at, updated_at)
VALUES (
  'dossier-sonatel-orange-senegal',
  'Affaire Sonatel-Orange Sénégal',
  'sonatel-orange-senegal',
  'Contentieux fiscal et allégations d''évasion fiscale impliquant Sonatel-Orange au Sénégal. Enjeux de gouvernance et régulation des télécoms dans l''UEMOA.',
  '{}',
  TRUE,
  FALSE,
  NULL,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Timeline events for Sonatel-Orange Sénégal
INSERT INTO dossier_timeline_events (id, dossier_id, date, title, description)
VALUES
  ('evt-sonatel-1', 'dossier-sonatel-orange-senegal', '2023-11-05', 'Ouverture d''une enquête fiscale', 'Les autorités fiscales sénégalaises ouvrent une enquête sur les pratiques fiscales de Sonatel-Orange.'),
  ('evt-sonatel-2', 'dossier-sonatel-orange-senegal', '2024-02-18', 'Allégations d''évasion fiscale', 'Des documents révèlent des allégations d''évasion fiscale et d''optimisation agressive.'),
  ('evt-sonatel-3', 'dossier-sonatel-orange-senegal', '2024-07-12', 'Réaction de l''entreprise', 'Sonatel-Orange conteste les allégations et annonce sa coopération avec les autorités.'),
  ('evt-sonatel-4', 'dossier-sonatel-orange-senegal', '2024-10-25', 'Audit réglementaire', 'Lancement d''un audit réglementaire sur la gouvernance des opérateurs télécoms dans l''UEMOA.')
ON CONFLICT (id) DO NOTHING;

-- Dossier 3: Scandale BOAD
INSERT INTO dossiers (id, title, slug, description, article_ids, is_active, is_featured, "order", created_at, updated_at)
VALUES (
  'dossier-scandale-boad',
  'Scandale BOAD',
  'scandale-boad',
  'Allégations de détournements et problèmes de gouvernance à la Banque Ouest-Africaine de Développement (BOAD). Impact sur la crédibilité des institutions financières régionales.',
  '{}',
  TRUE,
  FALSE,
  NULL,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO NOTHING;

-- Timeline events for Scandale BOAD
INSERT INTO dossier_timeline_events (id, dossier_id, date, title, description)
VALUES
  ('evt-boad-1', 'dossier-scandale-boad', '2023-08-22', 'Révélations sur des irrégularités', 'Des documents internes révèlent des irrégularités dans la gestion de certains projets financés par la BOAD.'),
  ('evt-boad-2', 'dossier-scandale-boad', '2024-01-15', 'Ouverture d''une enquête interne', 'Le conseil d''administration de la BOAD annonce l''ouverture d''une enquête interne sur les allégations.'),
  ('evt-boad-3', 'dossier-scandale-boad', '2024-06-08', 'Audit externe commandé', 'La BOAD commande un audit externe indépendant pour faire la lumière sur les allégations.'),
  ('evt-boad-4', 'dossier-scandale-boad', '2024-11-20', 'Mesures de réforme', 'Annonce de mesures de réforme de la gouvernance et renforcement des contrôles internes.')
ON CONFLICT (id) DO NOTHING;
