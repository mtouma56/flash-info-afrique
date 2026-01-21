import { useEffect, useState } from "react";
import type { Article, Category } from "../../../shared/types/admin";

// Re-export types for convenience
export type { Article, Category };

export function useArticles() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [articlesRes, categoriesRes] = await Promise.all([
          fetch("/api/articles"),
          fetch("/api/categories"),
        ]);

        if (!articlesRes.ok || !categoriesRes.ok) {
          throw new Error("Erreur lors de la récupération des données");
        }

        const articlesData = await articlesRes.json();
        const categoriesData = await categoriesRes.json();

        setArticles(articlesData);
        setCategories(categoriesData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Une erreur est survenue");
        console.error("Error fetching articles:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return { articles, categories, isLoading, error };
}

export function useArticle(slug: string) {
  const [article, setArticle] = useState<Article | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArticle = async () => {
      if (!slug) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await fetch(`/api/articles/${slug}`);

        if (!response.ok) {
          if (response.status === 404) {
            setError("Article non trouvé");
          } else {
            throw new Error("Erreur lors de la récupération de l'article");
          }
          setArticle(null);
          return;
        }

        const articleData = await response.json();
        setArticle(articleData);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Une erreur est survenue");
        setArticle(null);
        console.error("Error fetching article:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchArticle();
  }, [slug]);

  return { article, isLoading, error };
}
