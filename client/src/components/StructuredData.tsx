import type { Article } from "@/hooks/useArticles";
import { Helmet } from "react-helmet-async";

interface StructuredDataProps {
  article?: Article;
}

export default function StructuredData({ article }: StructuredDataProps) {
  // Organization schema (always present)
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Flash Info Afrique",
    url: "https://flashinfoafrique.com",
    logo: "https://flashinfoafrique.com/logo.png",
    sameAs: [
      "https://www.linkedin.com/company/flash-info-afrique",
      "https://twitter.com/flashinfoafrique",
      "https://www.facebook.com/flashinfoafrique",
    ],
    description:
      "Flash Info Afrique - Votre source d'information sur l'actualité économique, financière et réglementaire de la zone UEMOA.",
  };

  // Website schema (always present)
  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Flash Info Afrique",
    url: "https://flashinfoafrique.com",
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
        image: article.imageUrl,
        datePublished: article.publishedAt,
        dateModified: article.publishedAt,
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
          },
        },
        mainEntityOfPage: {
          "@type": "WebPage",
          "@id": `https://flashinfoafrique.com/article/${article.slug}`,
        },
        keywords: article.tags.join(", "),
        articleSection: article.category,
        inLanguage: "fr-FR",
      }
    : null;

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

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(organizationSchema)}</script>
      <script type="application/ld+json">{JSON.stringify(websiteSchema)}</script>
      {articleSchema && (
        <script type="application/ld+json">{JSON.stringify(articleSchema)}</script>
      )}
      {breadcrumbSchema && (
        <script type="application/ld+json">{JSON.stringify(breadcrumbSchema)}</script>
      )}
    </Helmet>
  );
}
