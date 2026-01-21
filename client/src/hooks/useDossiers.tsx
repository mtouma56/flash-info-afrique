import { useEffect, useState } from "react";
import type { Dossier } from "../../../shared/types/admin";

// Re-export type for convenience
export type { Dossier };

export function useDossiers() {
  const [dossiers, setDossiers] = useState<Dossier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDossiers = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/dossiers");

        if (!response.ok) {
          throw new Error("Erreur lors de la récupération des dossiers");
        }

        const data = await response.json();
        setDossiers(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Une erreur est survenue");
        console.error("Error fetching dossiers:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDossiers();
  }, []);

  return { dossiers, isLoading, error };
}

export function useDossier(slug: string) {
  const [dossier, setDossier] = useState<Dossier | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDossier = async () => {
      if (!slug) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const response = await fetch(`/api/dossiers/${slug}`);

        if (!response.ok) {
          if (response.status === 404) {
            setError("Dossier non trouvé");
          } else {
            throw new Error("Erreur lors de la récupération du dossier");
          }
          setDossier(null);
          return;
        }

        const data = await response.json();
        setDossier(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Une erreur est survenue");
        setDossier(null);
        console.error("Error fetching dossier:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDossier();
  }, [slug]);

  return { dossier, isLoading, error };
}
