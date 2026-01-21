import { Helmet } from "react-helmet-async";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  url?: string;
  type?: "website" | "article";
  publishedTime?: string;
  author?: string;
  section?: string;
  tags?: string[];
}

const defaultMeta = {
  title: "Flash Info Afrique - L'actualité économique UEMOA",
  description:
    "Flash Info Afrique - Votre source d'information sur l'actualité économique, financière et réglementaire de la zone UEMOA. Suivez les dernières nouvelles du secteur bancaire africain.",
  keywords:
    "UEMOA, Afrique, économie, finance, banque, BCEAO, actualité africaine, FIDELIS Finance, régulation bancaire",
  image: "https://flashinfoafrique.com/og-image.jpg",
  url: "https://flashinfoafrique.com",
};

export default function SEO({
  title,
  description = defaultMeta.description,
  keywords = defaultMeta.keywords,
  image = defaultMeta.image,
  url = defaultMeta.url,
  type = "website",
  publishedTime,
  author,
  section,
  tags,
}: SEOProps) {
  const fullTitle = title
    ? `${title} | Flash Info Afrique`
    : defaultMeta.title;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={url} />

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:locale" content="fr_FR" />
      <meta property="og:site_name" content="Flash Info Afrique" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {/* Article specific */}
      {type === "article" && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {type === "article" && author && (
        <meta property="article:author" content={author} />
      )}
      {type === "article" && section && (
        <meta property="article:section" content={section} />
      )}
      {type === "article" &&
        tags?.map((tag, index) => (
          <meta key={index} property="article:tag" content={tag} />
        ))}
    </Helmet>
  );
}

// Helper function to calculate reading time
export function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}
