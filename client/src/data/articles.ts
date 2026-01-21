// Articles FIDELIS Finance - Données extraites de l'audit de contenu

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: 'banque-finance' | 'regulation-conformite' | 'marches-investissements' | 'analyses-decryptages';
  tags: string[];
  source: {
    name: string;
    url: string;
    logo?: string;
  };
  publishedAt: string;
  isFeatured: boolean;
  imageUrl: string;
}

export const articles: Article[] = [
  {
    id: '1',
    title: 'UEMOA, Abidjan: Sogetra files a complaint against Fidelis Finance in an unprecedented dispute over banking secrecy',
    slug: 'sogetra-fidelis-finance-secret-bancaire-uemoa',
    excerpt: 'A legal proceeding opposes Fidelis Finance Burkina Faso to the Ivorian company SOGETRA. The case, now in the hands of justice, could lead to the first criminal precedent regarding the violation of banking secrecy in the UEMOA.',
    content: `Une procédure judiciaire oppose FIDELIS Finance Burkina Faso à la société ivoirienne SOGETRA. L'affaire, désormais entre les mains de la justice, pourrait aboutir au premier précédent pénal concernant la violation du secret bancaire dans l'Union Économique et Monétaire Ouest-Africaine (UEMOA).

Quatre cadres dirigeants, ainsi que l'établissement financier lui-même en qualité de personne morale, ont été mis en examen. Les faits visés concernent la divulgation présumée d'informations confidentielles, des accusations que FIDELIS Finance réfute intégralement.

Trois chefs de mise en examen sont notifiés : violation du secret bancaire, destruction de preuves et subornation de témoin. Le 17 octobre 2025, quatre cadres dirigeants de FIDELIS Finance Côte d'Ivoire sont placés sous contrôle judiciaire.`,
    category: 'regulation-conformite',
    tags: ['FIDELIS Finance', 'Secret bancaire', 'SOGETRA', 'UEMOA', 'Commission Bancaire'],
    source: {
      name: 'Financial Afrik',
      url: 'https://www.financialafrik.com/en/2025/12/03/uemoa-abidjan-sogetra-files-a-complaint-against-fidelis-finance-in-an-unprecedented-dispute-over-banking-secrecy/',
    },
    publishedAt: '2025-12-03',
    isFeatured: true,
    imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&h=675&fit=crop',
  },
  {
    id: '2',
    title: 'Exclusif : Une banque burkinabè inculpée en Côte d\'Ivoire est accusée de violation du secret bancaire',
    slug: 'fidelis-finance-inculpee-cote-ivoire-enquete',
    excerpt: 'Basée au Burkina Faso et ayant une succursale à Abidjan, FIDELIS Finance fait l\'objet d\'une mise en examen auprès de la justice ivoirienne. Placée désormais sous contrôle judiciaire, la société bancaire de droit burkinabè est poursuivie pour faute dans sa gouvernance clientèle.',
    content: `En septembre 2025, la justice ivoirienne a ouvert une information judiciaire contre la société de microfinance FIDELIS Finance et quatre de ses dirigeants pour violation présumée du secret bancaire, destruction de preuves et subornation de témoin.

Les faits portent sur la divulgation d'informations confidentielles concernant la société cliente SOGETRA SARL à un tiers, ce qui a entraîné l'annulation d'une transaction immobilière évaluée à 7,7 milliards FCFA.

Cette mésaventure présage non seulement les responsabilités individuelles des dirigeants d'un établissement financier, mais également les enjeux institutionnels et réglementaires auxquels le système bancaire ouest-africain est confronté.

Pour la première fois, une banque agréée par la BCEAO est mise en examen en tant que personne morale dans une affaire de violation des consignes réglementaires.`,
    category: 'regulation-conformite',
    tags: ['FIDELIS Finance', 'Instruction pénale', 'Mise en examen', 'Burkina Faso', 'Côte d\'Ivoire'],
    source: {
      name: 'L\'Infodrome',
      url: 'https://www.linfodrome.com/enquete-exclusive/115146-exclusif-une-banque-burkinabe-inculpee-en-cote-d-ivoire-est-accusee-de-violation-du-secret-bancaire-enquete',
    },
    publishedAt: '2025-11-03',
    isFeatured: true,
    imageUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=1200&h=675&fit=crop',
  },
  {
    id: '3',
    title: 'Violation du secret bancaire dans l\'UEMOA : opposition entre FIDELIS Finance Burkina Faso et la société ivoirienne SOGETRA',
    slug: 'violation-secret-bancaire-uemoa-fidelis-sogetra',
    excerpt: 'SOGETRA porte plainte contre FIDELIS Finance dans un litige inédit. Ce dossier pourrait aboutir à la première jurisprudence pénale en matière de violation du secret bancaire dans l\'UEMOA.',
    content: `SOGETRA porte plainte contre FIDELIS Finance dans un litige inédit. Ce dossier pourrait aboutir à la première jurisprudence pénale en matière de violation du secret bancaire dans l'Union économique et monétaire ouest-africaine (UEMOA). Il est actuellement entre les mains de la justice.

Quatre cadres dirigeants, ainsi que l'établissement financier lui-même en qualité de personne morale, ont été mis en examen. Les faits visés concernent la divulgation présumée d'informations confidentielles, des accusations que FIDELIS Finance réfute intégralement.

Trois chefs de mise en examen sont notifiés : violation du secret bancaire, destruction de preuves et subornation de témoin. Le 17 octobre 2025, quatre cadres dirigeants de FIDELIS Finance Côte d'Ivoire sont placés sous contrôle judiciaire.

FIDELIS Finance Burkina Faso est également mise en examen en tant que personne morale. Les personnes mises en cause restent, à ce stade, présumées innocentes.`,
    category: 'regulation-conformite',
    tags: ['FIDELIS Finance', 'SOGETRA', 'Secret bancaire', 'UEMOA', 'Jurisprudence'],
    source: {
      name: 'Orishas Finance',
      url: 'https://www.orishas-finance.com/actualite/violation-du-secret-bancaire-dans-l-uemoa-opposition-entre-fidelis-finance-burkina-faso-et-la-societe-ivoirienne-sogetra',
    },
    publishedAt: '2026-01-02',
    isFeatured: false,
    imageUrl: 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?w=1200&h=675&fit=crop',
  },
  {
    id: '4',
    title: 'SOGETRA–Fidelis Finance : une fuite bancaire, 72 licenciements…',
    slug: 'sogetra-fidelis-finance-fuite-bancaire-licenciements',
    excerpt: 'Une PME ivoirienne accuse une banque burkinabè d\'avoir violé le secret bancaire. L\'affaire a entraîné l\'annulation d\'une transaction de 7,7 milliards FCFA et le licenciement de 72 employés.',
    content: `Une PME ivoirienne accuse une banque burkinabè d'avoir violé le secret bancaire. L'affaire SOGETRA–FIDELIS Finance prend une tournure sociale dramatique avec le licenciement de 72 employés suite à l'annulation d'une transaction immobilière de 7,7 milliards FCFA.

La divulgation présumée d'informations confidentielles par FIDELIS Finance à un tiers aurait entraîné le retrait de SORIMPEX, l'acquéreur potentiel, privant ainsi SOGETRA des fonds nécessaires pour honorer ses engagements financiers.

Cette situation a contraint l'entreprise à procéder à des licenciements massifs, illustrant l'impact économique et social d'une potentielle violation du secret bancaire.

Le dossier soulève des questions cruciales sur la responsabilité des établissements financiers et la protection des informations confidentielles des clients dans la zone UEMOA.`,
    category: 'banque-finance',
    tags: ['FIDELIS Finance', 'SOGETRA', 'Licenciements', 'Impact social', 'PME'],
    source: {
      name: 'Enquête Media',
      url: 'https://enquetemedia.info/sogetra-fidelis-finance-une-fuite-bancaire-72-licenciements/',
    },
    publishedAt: '2025-12-30',
    isFeatured: false,
    imageUrl: 'https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=1200&h=675&fit=crop',
  },
  {
    id: '5',
    title: 'FIDELIS Et SOGETRA Opposés Dans Un Litige économique',
    slug: 'fidelis-sogetra-litige-economique',
    excerpt: 'La société SOGETRA accuse FIDELIS de violation du secret bancaire, un dossier désormais porté devant les juridictions ivoiriennes en raison de l\'ampleur des enjeux financiers.',
    content: `La société SOGETRA accuse en effet FIDELIS de violation du secret bancaire, un dossier désormais porté devant les juridictions ivoiriennes en raison de l'ampleur des enjeux financiers.

Le litige oppose deux acteurs économiques majeurs de la sous-région et pourrait créer un précédent important en matière de régulation bancaire dans l'UEMOA.

Les autorités de régulation, notamment la Commission Bancaire de l'UMOA et la BCEAO, suivent de près l'évolution de ce dossier qui teste les limites du secret bancaire et les obligations de confidentialité des établissements financiers.

L'issue de cette affaire pourrait avoir des répercussions significatives sur les pratiques bancaires dans toute la zone UEMOA.`,
    category: 'banque-finance',
    tags: ['FIDELIS Finance', 'SOGETRA', 'Litige', 'UEMOA', 'Régulation'],
    source: {
      name: 'Abidjan Économie',
      url: 'https://www.abidjaneconomie.net/2025/10/02/fidelis-sogetra-litige/',
    },
    publishedAt: '2025-10-02',
    isFeatured: false,
    imageUrl: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=1200&h=675&fit=crop',
  },
  {
    id: '6',
    title: 'Secteur financier ivoirien – Allégations de violation du secret bancaire : FIDELIS Finance au cœur d\'un litige à forts enjeux',
    slug: 'secteur-financier-ivoirien-fidelis-finance-litige',
    excerpt: 'Le différend oppose SOGETRA à FIDELIS Finance autour d\'une transaction de 7,7 milliards FCFA, annulée après la divulgation supposée d\'informations confidentielles.',
    content: `Le différend oppose SOGETRA à FIDELIS Finance autour d'une transaction de 7,7 milliards FCFA, annulée après la divulgation supposée d'informations confidentielles.

Cette affaire met en lumière les défis auxquels le secteur financier ivoirien et, plus largement, celui de l'UEMOA, est confronté en matière de protection des données clients et de respect du secret bancaire.

Les enjeux dépassent le cadre du litige entre les deux parties pour toucher à la crédibilité du système bancaire régional et à la confiance des investisseurs dans les institutions financières de la zone.

La Commission Bancaire de l'UMOA a été saisie et pourrait prendre des sanctions disciplinaires indépendamment de l'issue de la procédure pénale en cours.`,
    category: 'regulation-conformite',
    tags: ['FIDELIS Finance', 'Secteur financier', 'Côte d\'Ivoire', 'Enjeux réglementaires'],
    source: {
      name: 'PAfrica TV Info',
      url: 'https://pafricatvinfo.com/2025/10/09/secteur-financier-ivoirien-allegations-de-violation-du-secret-bancaire-fidelis-finance-au-coeur-dun-litige-a-forts-enjeux/',
    },
    publishedAt: '2025-10-09',
    isFeatured: false,
    imageUrl: 'https://images.unsplash.com/photo-1560472355-536de3962603?w=1200&h=675&fit=crop',
  },
  {
    id: '7',
    title: 'Rating: Bloomfield Investment maintains Fidelis Finance Burkina Faso\'s long and short term ratings unchanged',
    slug: 'bloomfield-investment-fidelis-finance-notation',
    excerpt: 'Bloomfield Investment has maintained Fidelis Finance Burkina Faso\'s long and short term ratings unchanged, a financial institution specializing in leasing.',
    content: `Bloomfield Investment has maintained Fidelis Finance Burkina Faso's long and short term ratings unchanged, a financial institution specializing in leasing.

Cette décision de notation intervient dans un contexte particulier pour FIDELIS Finance, alors que l'établissement fait face à des procédures judiciaires et réglementaires liées aux allégations de violation du secret bancaire.

La notation A en long terme et A1 en court terme avec perspective stable avait été attribuée sur la base de plusieurs facteurs positifs, notamment la surveillance accrue du portefeuille de crédit, l'amélioration de la gouvernance et la conformité aux normes prudentielles.

Cependant, les développements récents, notamment la mise en examen de quatre dirigeants et de l'établissement lui-même en tant que personne morale, pourraient remettre en question certains de ces critères lors des prochaines évaluations.`,
    category: 'marches-investissements',
    tags: ['FIDELIS Finance', 'Bloomfield Investment', 'Notation financière', 'Crédit'],
    source: {
      name: 'Financial Afrik',
      url: 'https://www.financialafrik.com/en/2025/07/03/rating-bloomfield-investment-maintains-fidelis-finance-burkina-fasos-long-and-short-term-ratings-unchanged/',
    },
    publishedAt: '2025-07-03',
    isFeatured: false,
    imageUrl: 'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&h=675&fit=crop',
  },
  {
    id: '8',
    title: 'Pourquoi le burkinabè Fidelis Finance songe à devenir une banque',
    slug: 'fidelis-finance-projet-banque-universelle',
    excerpt: 'FIDELIS Finance affichait l\'an dernier un bilan de plus de 70 milliards de FCFA, dont 50 milliards au profit de la clientèle. L\'établissement envisage une transformation en banque universelle.',
    content: `FIDELIS Finance affichait l'an dernier un bilan de plus de 70 milliards de FCFA, dont 50 milliards au profit de la clientèle. L'établissement envisage une transformation en banque universelle dans le cadre de son projet stratégique CAP25.

Ce projet ambitieux prévoit une augmentation de capital de 9,5 millions d'euros à 32,8 millions d'euros et l'obtention d'un agrément de banque universelle auprès de la Commission Bancaire de l'UMOA et de la BCEAO.

Cependant, les développements judiciaires récents, notamment la mise en examen de quatre des cinq principaux dirigeants de l'établissement (80% de la direction exécutive), pourraient compromettre ce projet stratégique.

Les autorités de régulation bancaire en zone UEMOA sont particulièrement vigilantes concernant la qualité de la gouvernance et l'intégrité des dirigeants pour l'octroi ou le maintien d'agréments bancaires.`,
    category: 'banque-finance',
    tags: ['FIDELIS Finance', 'Banque universelle', 'CAP25', 'Stratégie', 'Burkina Faso'],
    source: {
      name: 'Jeune Afrique',
      url: 'https://www.jeuneafrique.com/1508063/economie-entreprises/pourquoi-le-burkinabe-fidelis-finance-songe-a-devenir-une-banque/',
    },
    publishedAt: '2023-11-27',
    isFeatured: false,
    imageUrl: 'https://images.unsplash.com/photo-1541354329998-f4d9a9f9297f?w=1200&h=675&fit=crop',
  },
];

export const categories = [
  {
    id: 'banque-finance',
    name: 'Banque & Finance',
    slug: 'banque-finance',
    color: '#1E3A8A', // Bleu marine
    description: 'Actualités du secteur bancaire et financier de la zone UEMOA',
  },
  {
    id: 'regulation-conformite',
    name: 'Régulation & Conformité',
    slug: 'regulation-conformite',
    color: '#DC2626', // Rouge (sérieux)
    description: 'Régulation bancaire, Commission Bancaire UMOA, BCEAO, conformité',
  },
  {
    id: 'marches-investissements',
    name: 'Marchés & Investissements',
    slug: 'marches-investissements',
    color: '#10B981', // Vert émeraude
    description: 'BRVM, marchés financiers, investissements, notations',
  },
  {
    id: 'analyses-decryptages',
    name: 'Analyses & Décryptages',
    slug: 'analyses-decryptages',
    color: '#F97316', // Orange
    description: 'Analyses approfondies et décryptages des enjeux économiques',
  },
];

export const timelineEvents = [
  {
    date: '2024-10-15',
    title: 'Signature du protocole tripartite',
    description: 'Protocole d\'accord entre ADAM TP, SOGETRA et SORIMPEX pour une cession d\'actifs immobiliers de 7,7 milliards FCFA.',
  },
  {
    date: '2024-11-24',
    title: 'Demande de financement SORIMPEX',
    description: 'SORIMPEX soumet à FIDELIS une demande de financement de 883,872 millions FCFA pour un projet de construction.',
  },
  {
    date: '2025-02-12',
    title: 'Réunion FIDELIS-SORIMPEX',
    description: 'Réunion dans les locaux de FIDELIS à Abidjan. Divulgation présumée d\'informations confidentielles sur SOGETRA.',
  },
  {
    date: '2025-02-17',
    title: 'Annulation de la transaction',
    description: 'SORIMPEX annonce le désistement et l\'annulation de la transaction de 7,7 milliards FCFA, cinq jours après la réunion.',
  },
  {
    date: '2025-08-14',
    title: 'Plainte auprès de la Commission Bancaire',
    description: 'SOGETRA et ADAM TP déposent une plainte officielle auprès de la Commission Bancaire de l\'UMOA.',
  },
  {
    date: '2025-09-23',
    title: 'Plainte pénale avec constitution de partie civile',
    description: 'Dépôt d\'une plainte pénale auprès du Doyen des Juges d\'Instruction du TPI d\'Abidjan-Plateau. Dommages-intérêts réclamés : 7,7 milliards FCFA.',
  },
  {
    date: '2025-09-29',
    title: 'Ouverture de l\'instruction pénale',
    description: 'Ouverture d\'une information judiciaire par le Juge d\'Instruction. FIDELIS Finance et quatre dirigeants mis en examen.',
  },
  {
    date: '2025-10-17',
    title: 'Inculpations officielles',
    description: 'Les quatre dirigeants de FIDELIS Finance sont convoqués et officiellement inculpés. Contrôle judiciaire.',
  },
];
