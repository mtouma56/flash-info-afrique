import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { lazy, Suspense } from "react";
import { HelmetProvider } from "react-helmet-async";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import ScrollToTop from "./components/ScrollToTop";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import { ArticlesProvider } from "./contexts/ArticlesContext";
import ProtectedRoute from "./pages/admin/ProtectedRoute";

// Lazy load public pages for code splitting
const Home = lazy(() => import("./pages/Home"));
const Articles = lazy(() => import("./pages/Articles"));
const Dossiers = lazy(() => import("./pages/Dossiers"));
const Dossier = lazy(() => import("./pages/Dossier"));
const Article = lazy(() => import("./pages/Article"));
const Category = lazy(() => import("./pages/Category"));
const MentionsLegales = lazy(() => import("./pages/MentionsLegales"));
const Confidentialite = lazy(() => import("./pages/Confidentialite"));
const ConditionsUtilisation = lazy(() => import("./pages/ConditionsUtilisation"));

// Lazy load admin pages
const AdminLogin = lazy(() => import("./pages/admin/Login"));
const AdminDashboard = lazy(() => import("./pages/admin/Dashboard"));
const AdminArticles = lazy(() => import("./pages/admin/Articles"));
const AdminArticleEdit = lazy(() => import("./pages/admin/ArticleEdit"));
const AdminDossiers = lazy(() => import("./pages/admin/Dossiers"));
const AdminDossierEdit = lazy(() => import("./pages/admin/DossierEdit"));
const AdminCategories = lazy(() => import("./pages/admin/Categories"));
const AdminRSS = lazy(() => import("./pages/admin/RSS"));
const AdminRSSFeedEdit = lazy(() => import("./pages/admin/RSSFeedEdit"));
const AdminRSSPending = lazy(() => import("./pages/admin/RSSPending"));
const AdminSettings = lazy(() => import("./pages/admin/Settings"));
const AdminUsers = lazy(() => import("./pages/admin/Users"));

// Loading fallback component
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-muted-foreground text-sm">Chargement...</p>
      </div>
    </div>
  );
}

function Router() {
  return (
    <Suspense fallback={<PageLoader />}>
      <ScrollToTop />
      <Switch>
        {/* Public routes */}
        <Route path="/" component={Home} />
        <Route path="/articles" component={Articles} />
        <Route path="/dossiers" component={Dossiers} />
        <Route path="/dossier/:slug" component={Dossier} />
        <Route path="/article/:slug" component={Article} />
        <Route path="/categorie/:slug" component={Category} />
        <Route path="/mentions-legales" component={MentionsLegales} />
        <Route path="/confidentialite" component={Confidentialite} />
        <Route path="/conditions-utilisation" component={ConditionsUtilisation} />

        {/* Admin login (public) */}
        <Route path="/admin/login" component={AdminLogin} />

        {/* Admin protected routes */}
        <Route path="/admin">
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        </Route>

        <Route path="/admin/articles">
          <ProtectedRoute>
            <AdminArticles />
          </ProtectedRoute>
        </Route>

        <Route path="/admin/articles/new">
          <ProtectedRoute>
            <AdminArticleEdit />
          </ProtectedRoute>
        </Route>

        <Route path="/admin/articles/:id/edit">
          <ProtectedRoute>
            <AdminArticleEdit />
          </ProtectedRoute>
        </Route>

        <Route path="/admin/dossiers">
          <ProtectedRoute>
            <AdminDossiers />
          </ProtectedRoute>
        </Route>

        <Route path="/admin/dossiers/new">
          <ProtectedRoute>
            <AdminDossierEdit />
          </ProtectedRoute>
        </Route>

        <Route path="/admin/dossiers/:id/edit">
          <ProtectedRoute>
            <AdminDossierEdit />
          </ProtectedRoute>
        </Route>

        <Route path="/admin/categories">
          <ProtectedRoute>
            <AdminCategories />
          </ProtectedRoute>
        </Route>

        <Route path="/admin/rss">
          <ProtectedRoute>
            <AdminRSS />
          </ProtectedRoute>
        </Route>

        <Route path="/admin/rss/feeds/new">
          <ProtectedRoute>
            <AdminRSSFeedEdit />
          </ProtectedRoute>
        </Route>

        <Route path="/admin/rss/feeds/:id/edit">
          <ProtectedRoute>
            <AdminRSSFeedEdit />
          </ProtectedRoute>
        </Route>

        <Route path="/admin/rss/pending">
          <ProtectedRoute>
            <AdminRSSPending />
          </ProtectedRoute>
        </Route>

        <Route path="/admin/settings">
          <ProtectedRoute>
            <AdminSettings />
          </ProtectedRoute>
        </Route>

        <Route path="/admin/users">
          <ProtectedRoute>
            <AdminUsers />
          </ProtectedRoute>
        </Route>

        {/* 404 and fallback */}
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <ThemeProvider defaultTheme="system" switchable>
          <AuthProvider>
            <ArticlesProvider>
              <TooltipProvider>
                <Toaster />
                <Router />
              </TooltipProvider>
            </ArticlesProvider>
          </AuthProvider>
        </ThemeProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;
