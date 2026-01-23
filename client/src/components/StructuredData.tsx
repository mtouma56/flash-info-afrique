import type { Article } from "@/hooks/useArticles";
import type { Dossier } from "@shared/types/admin";
import { Helmet } from "react-helmet-async";

interface StructuredDataProps {
  article?: Article;
  dossier?: Dossier;
  faqItems?: Array<{ question: string; answer: string }>;
}

// Geographic data for countries in the UEMOA region
const geoData = {
  "côte d'ivoire": {
    name: "Côte d'Ivoire",
    isoCode: "CI",
    coordinates: { latitude: 6.8523, longitude: -5.2893 },
    capital: "Abidjan",
  },
  "cote d'ivoire": {
    name: "Côte d'Ivoire",
    isoCode: "CI",
    coordinates: { latitude: 6.8523, longitude: -5.2893 },
    capital: "Abidjan",
  },
  abidjan: {
    name: "Abidjan",
    isoCode: "CI",
    coordinates: { latitude: 5.3599, longitude: -4.0083 },
    country: "Côte d'Ivoire",
  },
  "burkina faso": {
    name: "Burkina Faso",
    isoCode: "BF",
    coordinates: { latitude: 12.3714, longitude: -1.5197 },
    capital: "Ouagadougou",
  },
  burkina: {
    name: "Burkina Faso",
    isoCode: "BF",
    coordinates: { latitude: 12.3714, longitude: -1.5197 },
    capital: "Ouagadougou",
  },
  ouagadougou: {
    name: "Ouagadougou",
    isoCode: "BF",
    coordinates: { latitude: 12.3714, longitude: -1.5197 },
    country: "Burkina Faso",
  },
  sénégal: {
    name: "Sénégal",
    isoCode: "SN",
    coordinates: { latitude: 14.6928, longitude: -17.4467 },
    capital: "Dakar",
  },
  senegal: {
    name: "Sénégal",
    isoCode: "SN",
    coordinates: { latitude: 14.6928, longitude: -17.4467 },
    capital: "Dakar",
  },
  dakar: {
    name: "Dakar",
    isoCode: "SN",
    coordinates: { latitude: 14.6928, longitude: -17.4467 },
    country: "Sénégal",
  },
  mali: {
    name: "Mali",
    isoCode: "ML",
    coordinates: { latitude: 12.6392, longitude: -8.0029 },
    capital: "Bamako",
  },
  bamako: {
    name: "Bamako",
    isoCode: "ML",
    coordinates: { latitude: 12.6392, longitude: -8.0029 },
    country: "Mali",
  },
  niger: {
    name: "Niger",
    isoCode: "NE",
    coordinates: { latitude: 13.5137, longitude: 2.1098 },
    capital: "Niamey",
  },
  niamey: {
    name: "Niamey",
    isoCode: "NE",
    coordinates: { latitude: 13.5137, longitude: 2.1098 },
    country: "Niger",
  },
  togo: {
    name: "Togo",
    isoCode: "TG",
    coordinates: { latitude: 6.1375, longitude: 1.2123 },
    capital: "Lomé",
  },
  lomé: {
    name: "Lomé",
    isoCode: "TG",
    coordinates: { latitude: 6.1375, longitude: 1.2123 },
    country: "Togo",
  },
  bénin: {
    name: "Bénin",
    isoCode: "BJ",
    coordinates: { latitude: 6.4969, longitude: 2.6283 },
    capital: "Cotonou",
  },
  benin: {
    name: "Bénin",
    isoCode: "BJ",
    coordinates: { latitude: 6.4969, longitude: 2.6283 },
    capital: "Cotonou",
  },
  cotonou: {
    name: "Cotonou",
    isoCode: "BJ",
    coordinates: { latitude: 6.4969, longitude: 2.6283 },
    country: "Bénin",
  },
};

// Helper function to detect geographic locations in content
function detectLocations(content: string): Array<{
  type: "Country" | "City";
  name: string;
  coordinates: { latitude: number; longitude: number };
  containedIn?: string;
}> {
  const contentLower = content.toLowerCase();
  const locations: Array<{
    type: "Country" | "City";
    name: string;
    coordinates: { latitude: number; longitude: number };
    containedIn?: string;
  }> = [];
  const addedNames = new Set<string>();

  for (const [key, data] of Object.entries(geoData)) {
    if (contentLower.includes(key) && !addedNames.has(data.name)) {
      addedNames.add(data.name);
      if ("capital" in data) {
        // It's a country
        locations.push({
          type: "Country",
          name: data.name,
          coordinates: data.coordinates,
        });
      } else if ("country" in data) {
        // It's a city
        locations.push({
          type: "City",
          name: data.name,
          coordinates: data.coordinates,
          containedIn: data.country,
        });
      }
    }
  }

  return locations;
}

// Check if content mentions FIDELIS
function isFidelisRelated(content: string): boolean {
  return content.toLowerCase().includes("fidelis");
}

export default function StructuredData({ article, dossier, faqItems }: StructuredDataProps) {
  // Organization schema (always present)
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Flash Info Afrique",
    url: "https://flashinfoafrique.com",
    logo: {
      "@type": "ImageObject",
      url: "https://flashinfoafrique.com/logo.png",
      width: 512,
      height: 512,
    },
    sameAs: [
      "https://www.linkedin.com/company/flash-info-afrique",
      "https://twitter.com/flashinfoafrique",
      "https://www.facebook.com/flashinfoafrique",
    ],
    description:
      "Flash Info Afrique - Votre source d'information sur l'actualité économique, financière et réglementaire de la zone UEMOA. Dossier FIDELIS Finance Burkina Faso et Côte d'Ivoire.",
    areaServed: [
      { "@type": "Country", name: "Côte d'Ivoire" },
      { "@type": "Country", name: "Burkina Faso" },
      { "@type": "Country", name: "Sénégal" },
      { "@type": "Country", name: "Mali" },
      { "@type": "Country", name: "Niger" },
      { "@type": "Country", name: "Togo" },
      { "@type": "Country", name: "Bénin" },
      { "@type": "Country", name: "Guinée-Bissau" },
    ],
    knowsAbout: [
      "FIDELIS Finance",
      "Fidelis Finance Burkina Faso",
      "Fidelis Finance Abidjan",
      "Fidelis Finance Côte d'Ivoire",
      "UEMOA",
      "BCEAO",
      "Commission Bancaire UMOA",
      "Secret bancaire",
    ],
  };

  // Website schema (always present)
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Flash Info Afrique",
    url: "https://flashinfoafrique.com",
    description: "Actualité économique et financière de la zone UEMOA - Dossier FIDELIS Finance",
    inLanguage: "fr-FR",
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: "https://flashinfoafrique.com/recherche?q={search_term_string}",
      },
      "query-input": "required name=search_term_string",
    },
  };

  // Article schema (only when article is provided)
  const articleSchema = article
    ? {
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        headline: article.title,
        description: article.excerpt,
        image: {
          "@type": "ImageObject",
          url: article.imageUrl,
          width: 1200,
          height: 630,
        },
        datePublished: article.publishedAt,
        dateModified: article.updatedAt || article.publishedAt,
        author: {
          "@type": "Organization",
          name: article.source.name,
          url: article.source.url,
        },
        publisher: {
          "@type": "Organization",
          name: "Flash Info Afrique",
          logo: {
            "@type": "ImageObject",
            url: "https://flashinfoafrique.com/logo.png",
            width: 512,
            height: 512,
          },
        },
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": `https://flashinfoafrique.com/article/${article.slug}`,
        },
        keywords: article.tags.join(", "),
        articleSection: article.category,
        inLanguage: "fr-FR",
        isAccessibleForFree: true,
        ...(isFidelisRelated(article.title + article.content) && {
          about: [
            {
              "@type": "Organization",
              name: "FIDELIS Finance",
              alternateName: ["Fidelis Finance Burkina Faso", "Fidelis Finance Abidjan", "Fidelis Finance Côte d'Ivoire"],
            },
          ],
        }),
      }
    : null;

  // Geographic schemas for locations mentioned in article
  const locationSchemas = article
    ? detectLocations(article.title + article.excerpt + article.content).map((loc) => ({
        "@context": "https://schema.org",
        "@type": loc.type === "Country" ? "Country" : "City",
        name: loc.name,
        geo: {
          "@type": "GeoCoordinates",
          latitude: loc.coordinates.latitude,
          longitude: loc.coordinates.longitude,
        },
        ...(loc.containedIn && {
          containedInPlace: {
            "@type": "Country",
            name: loc.containedIn,
          },
        }),
      }))
    : [];

  // BreadcrumbList schema for article pages
  const breadcrumbSchema = article
    ? {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Accueil",
            item: "https://flashinfoafrique.com",
          },
          {
            "@type": "ListItem",
            position: 2,
            name: article.category,
            item: `https://flashinfoafrique.com/categorie/${article.category}`,
          },
          {
            "@type": "ListItem",
            position: 3,
            name: article.title,
            item: `https://flashinfoafrique.com/article/${article.slug}`,
          },
        ],
      }
    : null;

  // CollectionPage schema for dossiers
  const collectionSchema = dossier
    ? {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: dossier.title,
        description: dossier.description,
        url: `https://flashinfoafrique.com/dossier/${dossier.slug}`,
        dateModified: dossier.updatedAt,
        inLanguage: "fr-FR",
        isPartOf: {
          "@type": "WebSite",
          name: "Flash Info Afrique",
          url: "https://flashinfoafrique.com",
        },
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: dossier.articleIds.length,
          itemListOrder: "https://schema.org/ItemListOrderDescending",
        },
        ...(dossier.slug === "fidelis" && {
          about: {
            "@type": "Organization",
            name: "FIDELIS Finance",
            alternateName: ["Fidelis Finance Burkina Faso", "Fidelis Finance Abidjan", "Fidelis Finance Côte d'Ivoire"],
            description: "Établissement financier burkinabè impliqué dans une affaire de violation présumée du secret bancaire en Côte d'Ivoire.",
          },
        }),
      }
    : null;

  // Dossier breadcrumb
  const dossierBreadcrumbSchema = dossier
    ? {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Accueil",
            item: "https://flashinfoafrique.com",
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Dossiers",
            item: "https://flashinfoafrique.com/dossiers",
          },
          {
            "@type": "ListItem",
            position: 3,
            name: dossier.title,
            item: `https://flashinfoafrique.com/dossier/${dossier.slug}`,
          },
        ],
      }
    : null;

  // FAQPage schema for FAQ sections
  const faqSchema = faqItems && faqItems.length > 0
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqItems.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: item.answer,
          },
        })),
      }
    : null;

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(organizationSchema)}</script>
      <script type="application/ld+json">{JSON.stringify(websiteSchema)}</script>
      {articleSchema && (
        <script type="application/ld+json">{JSON.stringify(articleSchema)}</script>
      )}
      {locationSchemas.map((schema, index) => (
        <script key={`location-${index}`} type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      ))}
      {breadcrumbSchema && (
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      )}
      {collectionSchema && (
        <script type="application/ld+json">{JSON.stringify(collectionSchema)}</script>
      )}
      {dossierBreadcrumbSchema && (
        <script type="application/ld+json">{JSON.stringify(dossierBreadcrumbSchema)}</script>
      )}
      {faqSchema && (
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      )}
    </Helmet>
  );
}

// Export FIDELIS FAQ items for use in the Dossier page
export const fidelisFaqItems = [
  {
    question: "Qu'est-ce que FIDELIS Finance ?",
    answer: "FIDELIS Finance est un établissement financier basé au Burkina Faso, spécialisé dans le crédit-bail et les services financiers. L'entreprise opère également en Côte d'Ivoire via une succursale à Abidjan.",
  },
  {
    question: "Où se trouve FIDELIS Finance ?",
    answer: "FIDELIS Finance est basée à Ouagadougou, Burkina Faso, avec une succursale à Abidjan, Côte d'Ivoire. L'établissement opère dans la zone UEMOA (Union Économique et Monétaire Ouest-Africaine).",
  },
  {
    question: "Quel est le dossier judiciaire de FIDELIS Finance ?",
    answer: "FIDELIS Finance fait l'objet de poursuites judiciaires en Côte d'Ivoire pour violation présumée du secret bancaire. L'affaire oppose la société ivoirienne SOGETRA à FIDELIS Finance, et pourrait créer la première jurisprudence pénale en matière de secret bancaire dans l'UEMOA.",
  },
  {
    question: "Pourquoi FIDELIS Finance est-elle poursuivie ?",
    answer: "FIDELIS Finance et quatre de ses dirigeants sont poursuivis pour violation présumée du secret bancaire, destruction de preuves et subornation de témoin. L'affaire concerne la divulgation présumée d'informations confidentielles sur une entreprise cliente à un tiers.",
  },
  {
    question: "Quelles sont les conséquences de l'affaire FIDELIS Finance ?",
    answer: "L'affaire a entraîné des conséquences économiques importantes, notamment l'annulation d'une transaction immobilière de 7,7 milliards FCFA et le licenciement de 72 employés de la PME SOGETRA. Elle pourrait également établir un précédent juridique majeur dans l'UEMOA.",
  },
];
