import { Helmet } from "react-helmet-async";

interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  image?: string;
  imageAlt?: string;
  imageWidth?: number;
  imageHeight?: number;
  url?: string;
  type?: "website" | "article";
  publishedTime?: string;
  modifiedTime?: string;
  author?: string;
  section?: string;
  tags?: string[];
  geoRegions?: string[];
  geoPlacenames?: string[];
}

// Geographic keywords for enhanced SEO targeting
const geoKeywords = {
  fidelis: [
    "FIDELIS Finance",
    "Fidelis Finance Burkina Faso",
    "Fidelis Finance Abidjan",
    "Fidelis Finance Côte d'Ivoire",
    "Fidelis Finance Cote d'Ivoire",
  ],
  countries: [
    "Burkina Faso",
    "Côte d'Ivoire",
    "Sénégal",
    "Mali",
    "Niger",
    "Togo",
    "Bénin",
    "Guinée-Bissau",
  ],
  cities: [
    "Abidjan",
    "Ouagadougou",
    "Dakar",
    "Bamako",
    "Niamey",
    "Lomé",
    "Cotonou",
  ],
};

const defaultMeta = {
  title: "Flash Info Afrique - L'actualité économique UEMOA",
  description:
    "Flash Info Afrique - Votre source d'information sur l'actualité économique, financière et réglementaire de la zone UEMOA. Suivez les dernières nouvelles du secteur bancaire africain, incluant le dossier FIDELIS Finance Burkina Faso et Côte d'Ivoire.",
  keywords:
    "UEMOA, Afrique, économie, finance, banque, BCEAO, actualité africaine, FIDELIS Finance, Fidelis Finance Burkina Faso, Fidelis Finance Abidjan, Fidelis Finance Côte d'Ivoire, régulation bancaire, secret bancaire, Commission Bancaire UMOA",
  image: "https://flashinfoafrique.com/og-image.svg",
  imageWidth: 1200,
  imageHeight: 630,
  url: "https://flashinfoafrique.com",
};

// Helper function to extract geographic keywords from content
export function extractGeoKeywords(content: string): {
  regions: string[];
  placenames: string[];
  keywords: string[];
} {
  const contentLower = content.toLowerCase();
  const regions: string[] = [];
  const placenames: string[] = [];
  const keywords: string[] = [];

  // Check for country mentions and add ISO codes
  if (contentLower.includes("côte d'ivoire") || contentLower.includes("cote d'ivoire") || contentLower.includes("abidjan")) {
    regions.push("CI");
    keywords.push("Côte d'Ivoire", "Cote d'Ivoire");
  }
  if (contentLower.includes("burkina") || contentLower.includes("ouagadougou")) {
    regions.push("BF");
    keywords.push("Burkina Faso");
  }
  if (contentLower.includes("sénégal") || contentLower.includes("senegal") || contentLower.includes("dakar")) {
    regions.push("SN");
    keywords.push("Sénégal");
  }
  if (contentLower.includes("mali") || contentLower.includes("bamako")) {
    regions.push("ML");
    keywords.push("Mali");
  }
  if (contentLower.includes("niger") || contentLower.includes("niamey")) {
    regions.push("NE");
    keywords.push("Niger");
  }
  if (contentLower.includes("togo") || contentLower.includes("lomé")) {
    regions.push("TG");
    keywords.push("Togo");
  }
  if (contentLower.includes("bénin") || contentLower.includes("benin") || contentLower.includes("cotonou")) {
    regions.push("BJ");
    keywords.push("Bénin");
  }

  // Check for city mentions
  geoKeywords.cities.forEach((city) => {
    if (contentLower.includes(city.toLowerCase())) {
      placenames.push(city);
    }
  });

  // Check for FIDELIS mentions and add specific keywords
  if (contentLower.includes("fidelis")) {
    keywords.push(...geoKeywords.fidelis);
  }

  return {
    regions: Array.from(new Set(regions)),
    placenames: Array.from(new Set(placenames)),
    keywords: Array.from(new Set(keywords)),
  };
}

// Helper function to generate enhanced keywords from tags and content
export function generateEnhancedKeywords(
  baseKeywords: string,
  tags?: string[],
  content?: string
): string {
  const keywordSet = new Set(baseKeywords.split(", ").map((k) => k.trim()));

  // Add tags as keywords
  tags?.forEach((tag) => keywordSet.add(tag));

  // Extract geographic keywords from content
  if (content) {
    const geoInfo = extractGeoKeywords(content);
    geoInfo.keywords.forEach((k) => keywordSet.add(k));
  }

  return Array.from(keywordSet).join(", ");
}

export default function SEO({
  title,
  description = defaultMeta.description,
  keywords = defaultMeta.keywords,
  image = defaultMeta.image,
  imageAlt,
  imageWidth = defaultMeta.imageWidth,
  imageHeight = defaultMeta.imageHeight,
  url = defaultMeta.url,
  type = "website",
  publishedTime,
  modifiedTime,
  author,
  section,
  tags,
  geoRegions = [],
  geoPlacenames = [],
}: SEOProps) {
  const fullTitle = title
    ? `${title} | Flash Info Afrique`
    : defaultMeta.title;

  // Generate image alt from title if not provided
  const finalImageAlt = imageAlt || (title ? `Image illustrant: ${title}` : "Flash Info Afrique - Actualité économique UEMOA");

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={url} />

      {/* Geographic Meta Tags */}
      {geoRegions.map((region, index) => (
        <meta key={`geo-region-${index}`} name="geo.region" content={region} />
      ))}
      {geoPlacenames.map((place, index) => (
        <meta key={`geo-place-${index}`} name="geo.placename" content={place} />
      ))}
      {/* Default geo position: Abidjan coordinates */}
      {geoRegions.length > 0 && (
        <meta name="geo.position" content="6.8523;-5.2893" />
      )}
      {geoRegions.length > 0 && (
        <meta name="ICBM" content="6.8523, -5.2893" />
      )}

      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={url} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:image:width" content={String(imageWidth)} />
      <meta property="og:image:height" content={String(imageHeight)} />
      <meta property="og:image:alt" content={finalImageAlt} />
      <meta property="og:locale" content="fr_FR" />
      <meta property="og:site_name" content="Flash Info Afrique" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={url} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      <meta name="twitter:image:alt" content={finalImageAlt} />

      {/* Article specific */}
      {type === "article" && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {type === "article" && modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
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
      
      {/* Geographic article tags for FIDELIS-related content */}
      {type === "article" && tags?.some((t) => t.toLowerCase().includes("fidelis")) && (
        <>
          <meta property="article:tag" content="Fidelis Finance Burkina Faso" />
          <meta property="article:tag" content="Fidelis Finance Abidjan" />
          <meta property="article:tag" content="Fidelis Finance Côte d'Ivoire" />
        </>
      )}
    </Helmet>
  );
}

// Helper function to calculate reading time
export function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}
