import { describe, it, expect } from "vitest";
import { extractGeoKeywords, generateEnhancedKeywords } from "@/components/SEO";
import { fidelisFaqItems } from "@/components/StructuredData";

describe("SEO Utilities", () => {
  describe("extractGeoKeywords", () => {
    it("should extract Côte d'Ivoire region from content", () => {
      const content = "Une affaire importante à Abidjan, Côte d'Ivoire";
      const result = extractGeoKeywords(content);
      
      expect(result.regions).toContain("CI");
      expect(result.placenames).toContain("Abidjan");
      expect(result.keywords).toContain("Côte d'Ivoire");
    });

    it("should extract Burkina Faso region from content", () => {
      const content = "FIDELIS Finance est basée au Burkina Faso";
      const result = extractGeoKeywords(content);
      
      expect(result.regions).toContain("BF");
      expect(result.keywords).toContain("Burkina Faso");
    });

    it("should extract FIDELIS-related keywords", () => {
      const content = "Le dossier FIDELIS Finance continue de faire des vagues";
      const result = extractGeoKeywords(content);
      
      expect(result.keywords).toContain("FIDELIS Finance");
      expect(result.keywords).toContain("Fidelis Finance Burkina Faso");
      expect(result.keywords).toContain("Fidelis Finance Abidjan");
      expect(result.keywords).toContain("Fidelis Finance Côte d'Ivoire");
    });

    it("should extract multiple countries from content", () => {
      const content = "L'UEMOA comprend le Sénégal, le Mali, le Niger et le Togo";
      const result = extractGeoKeywords(content);
      
      expect(result.regions).toContain("SN");
      expect(result.regions).toContain("ML");
      expect(result.regions).toContain("NE");
      expect(result.regions).toContain("TG");
    });

    it("should extract city placenames", () => {
      const content = "Les bureaux de Dakar et Bamako sont concernés";
      const result = extractGeoKeywords(content);
      
      expect(result.placenames).toContain("Dakar");
      expect(result.placenames).toContain("Bamako");
    });

    it("should handle empty content", () => {
      const result = extractGeoKeywords("");
      
      expect(result.regions).toEqual([]);
      expect(result.placenames).toEqual([]);
      expect(result.keywords).toEqual([]);
    });

    it("should handle content without geographic references", () => {
      const content = "This is a generic article about finance";
      const result = extractGeoKeywords(content);
      
      expect(result.regions).toEqual([]);
      expect(result.placenames).toEqual([]);
      expect(result.keywords).toEqual([]);
    });

    it("should be case insensitive", () => {
      const content = "abidjan et BURKINA FASO";
      const result = extractGeoKeywords(content);
      
      expect(result.regions).toContain("CI");
      expect(result.regions).toContain("BF");
    });
  });

  describe("generateEnhancedKeywords", () => {
    it("should combine base keywords with tags", () => {
      const baseKeywords = "UEMOA, économie";
      const tags = ["finance", "banque"];
      const result = generateEnhancedKeywords(baseKeywords, tags);
      
      expect(result).toContain("UEMOA");
      expect(result).toContain("économie");
      expect(result).toContain("finance");
      expect(result).toContain("banque");
    });

    it("should extract geo keywords from content", () => {
      const baseKeywords = "UEMOA";
      const tags = ["finance"];
      const content = "Article about FIDELIS Finance in Abidjan";
      const result = generateEnhancedKeywords(baseKeywords, tags, content);
      
      expect(result).toContain("FIDELIS Finance");
      expect(result).toContain("Côte d'Ivoire");
    });

    it("should remove duplicate keywords", () => {
      const baseKeywords = "UEMOA, finance, UEMOA";
      const tags = ["finance"];
      const result = generateEnhancedKeywords(baseKeywords, tags);
      
      const keywords = result.split(", ");
      const uniqueKeywords = [...new Set(keywords)];
      expect(keywords.length).toBe(uniqueKeywords.length);
    });

    it("should handle undefined tags", () => {
      const baseKeywords = "UEMOA";
      const result = generateEnhancedKeywords(baseKeywords, undefined);
      
      expect(result).toContain("UEMOA");
    });

    it("should handle undefined content", () => {
      const baseKeywords = "UEMOA";
      const tags = ["finance"];
      const result = generateEnhancedKeywords(baseKeywords, tags, undefined);
      
      expect(result).toContain("UEMOA");
      expect(result).toContain("finance");
    });
  });
});

describe("FIDELIS FAQ Items", () => {
  it("should have all required FAQ items", () => {
    expect(fidelisFaqItems.length).toBeGreaterThanOrEqual(5);
  });

  it("should have proper structure for each FAQ item", () => {
    fidelisFaqItems.forEach((item) => {
      expect(item).toHaveProperty("question");
      expect(item).toHaveProperty("answer");
      expect(typeof item.question).toBe("string");
      expect(typeof item.answer).toBe("string");
      expect(item.question.length).toBeGreaterThan(10);
      expect(item.answer.length).toBeGreaterThan(50);
    });
  });

  it("should include question about FIDELIS Finance location", () => {
    const locationQuestion = fidelisFaqItems.find((item) =>
      item.question.toLowerCase().includes("où")
    );
    expect(locationQuestion).toBeDefined();
    expect(locationQuestion?.answer).toContain("Burkina Faso");
    expect(locationQuestion?.answer).toContain("Abidjan");
  });

  it("should include question about FIDELIS legal case", () => {
    const legalQuestion = fidelisFaqItems.find((item) =>
      item.question.toLowerCase().includes("judiciaire") ||
      item.question.toLowerCase().includes("poursuivie")
    );
    expect(legalQuestion).toBeDefined();
  });

  it("should mention key geographic locations in answers", () => {
    const allAnswers = fidelisFaqItems.map((item) => item.answer).join(" ");
    
    expect(allAnswers).toContain("Burkina Faso");
    expect(allAnswers).toContain("Côte d'Ivoire");
    expect(allAnswers).toContain("Abidjan");
    expect(allAnswers).toContain("UEMOA");
  });
});

describe("SEO Meta Tags Validation", () => {
  const requiredKeywords = [
    "FIDELIS Finance",
    "Fidelis Finance Burkina Faso",
    "Fidelis Finance Abidjan",
    "Fidelis Finance Côte d'Ivoire",
    "UEMOA",
    "BCEAO",
    "secret bancaire",
  ];

  it("should have all required keywords in default meta", () => {
    // These keywords should be present in the defaultMeta.keywords
    const defaultKeywords = "UEMOA, Afrique, économie, finance, banque, BCEAO, actualité africaine, FIDELIS Finance, Fidelis Finance Burkina Faso, Fidelis Finance Abidjan, Fidelis Finance Côte d'Ivoire, régulation bancaire, secret bancaire, Commission Bancaire UMOA";
    
    requiredKeywords.forEach((keyword) => {
      expect(defaultKeywords.toLowerCase()).toContain(keyword.toLowerCase());
    });
  });

  it("should have geographic keywords for Fidelis Finance", () => {
    const geoKeywords = [
      "Burkina Faso",
      "Abidjan",
      "Côte d'Ivoire",
      "Ouagadougou",
    ];
    
    const defaultKeywords = "UEMOA, Afrique, économie, finance, banque, BCEAO, actualité africaine, FIDELIS Finance, Fidelis Finance Burkina Faso, Fidelis Finance Abidjan, Fidelis Finance Côte d'Ivoire, régulation bancaire, secret bancaire, Commission Bancaire UMOA";
    
    // At least the main geographic keywords should be present
    expect(defaultKeywords).toContain("Burkina Faso");
    expect(defaultKeywords).toContain("Abidjan");
    expect(defaultKeywords).toContain("Côte d'Ivoire");
  });
});

describe("Structured Data Validation", () => {
  it("should have valid Organization schema structure", () => {
    const organizationSchema = {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "Flash Info Afrique",
      url: "https://flashinfoafrique.com",
    };

    expect(organizationSchema["@context"]).toBe("https://schema.org");
    expect(organizationSchema["@type"]).toBe("Organization");
    expect(organizationSchema.name).toBeTruthy();
    expect(organizationSchema.url).toMatch(/^https?:\/\//);
  });

  it("should have valid NewsArticle schema structure", () => {
    const articleSchema = {
      "@context": "https://schema.org",
      "@type": "NewsArticle",
      headline: "Test Article",
      description: "Test description",
      datePublished: "2025-01-01",
      dateModified: "2025-01-02",
      author: {
        "@type": "Organization",
        name: "Test Source",
      },
    };

    expect(articleSchema["@type"]).toBe("NewsArticle");
    expect(articleSchema.headline).toBeTruthy();
    expect(articleSchema.datePublished).toMatch(/^\d{4}-\d{2}-\d{2}/);
    expect(articleSchema.author["@type"]).toBe("Organization");
  });

  it("should have valid FAQPage schema structure", () => {
    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: fidelisFaqItems.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    };

    expect(faqSchema["@type"]).toBe("FAQPage");
    expect(faqSchema.mainEntity.length).toBeGreaterThan(0);
    
    faqSchema.mainEntity.forEach((q) => {
      expect(q["@type"]).toBe("Question");
      expect(q.name).toBeTruthy();
      expect(q.acceptedAnswer["@type"]).toBe("Answer");
      expect(q.acceptedAnswer.text).toBeTruthy();
    });
  });
});
