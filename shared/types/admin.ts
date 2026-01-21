// Types partagés pour l'administration

// Article
export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  source: {
    name: string;
    url: string;
    logo?: string;
  };
  publishedAt: string;
  isFeatured: boolean;
  imageUrl: string;
  status: "draft" | "published" | "archived";
  createdAt: string;
  updatedAt: string;
  order?: number;
}

// Catégorie
export interface Category {
  id: string;
  name: string;
  slug: string;
  color: string;
  description: string;
}

// Dossier
export interface Dossier {
  id: string;
  title: string;
  slug: string;
  description: string;
  articleIds: string[];
  timelineEvents: TimelineEvent[];
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

export interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  description: string;
}

// RSS Feed
export interface RSSFeed {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
  autoPublish: boolean; // Si false, nécessite modération
  lastFetch?: string;
  lastError?: string;
  filters: RSSFilters;
  defaultCategory?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RSSFilters {
  keywords?: string[]; // Mots-clés à inclure
  excludeKeywords?: string[]; // Mots-clés à exclure
  categories?: string[]; // Catégories à assigner automatiquement
  minLength?: number; // Longueur minimum du contenu
}

// Article RSS en attente de modération
export interface RSSArticle {
  id: string;
  feedId: string;
  feedName: string;
  title: string;
  excerpt: string;
  content: string;
  link: string;
  pubDate: string;
  imageUrl?: string;
  status: "pending" | "approved" | "rejected" | "published";
  suggestedCategory?: string;
  suggestedTags?: string[];
  reviewedBy?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  createdAt: string;
}

// Utilisateur admin
export interface AdminUser {
  id: string;
  username: string;
  role: "admin";
  createdAt: string;
}

// Statistiques pour le dashboard
export interface DashboardStats {
  totalArticles: number;
  publishedArticles: number;
  draftArticles: number;
  featuredArticles: number;
  totalDossiers: number;
  activeDossiers: number;
  totalCategories: number;
  totalRSSFeeds: number;
  enabledRSSFeeds: number;
  pendingRSSArticles: number;
}

// Réponse API générique
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Pagination
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Filtres de recherche pour les articles
export interface ArticleFilters {
  search?: string;
  category?: string;
  status?: string;
  isFeatured?: boolean;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

// Filtres de recherche pour les articles RSS
export interface RSSArticleFilters {
  feedId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}
