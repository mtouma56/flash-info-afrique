import { describe, expect, it } from "vitest";
import { articles, categories, timelineEvents } from "./articles";

describe("Articles data", () => {
  describe("articles", () => {
    it("should have at least one article", () => {
      expect(articles.length).toBeGreaterThan(0);
    });

    it("should have unique IDs", () => {
      const ids = articles.map((a) => a.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it("should have unique slugs", () => {
      const slugs = articles.map((a) => a.slug);
      const uniqueSlugs = new Set(slugs);
      expect(uniqueSlugs.size).toBe(slugs.length);
    });

    it("should have valid categories", () => {
      const categoryIds = categories.map((c) => c.id);
      articles.forEach((article) => {
        expect(categoryIds).toContain(article.category);
      });
    });

    it("should have required fields", () => {
      articles.forEach((article) => {
        expect(article.id).toBeDefined();
        expect(article.title).toBeDefined();
        expect(article.slug).toBeDefined();
        expect(article.excerpt).toBeDefined();
        expect(article.content).toBeDefined();
        expect(article.category).toBeDefined();
        expect(article.tags).toBeDefined();
        expect(Array.isArray(article.tags)).toBe(true);
        expect(article.source).toBeDefined();
        expect(article.source.name).toBeDefined();
        expect(article.source.url).toBeDefined();
        expect(article.publishedAt).toBeDefined();
        expect(article.imageUrl).toBeDefined();
      });
    });

    it("should have valid date formats", () => {
      articles.forEach((article) => {
        const date = new Date(article.publishedAt);
        expect(date.toString()).not.toBe("Invalid Date");
      });
    });
  });

  describe("categories", () => {
    it("should have at least one category", () => {
      expect(categories.length).toBeGreaterThan(0);
    });

    it("should have unique IDs", () => {
      const ids = categories.map((c) => c.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it("should have required fields", () => {
      categories.forEach((category) => {
        expect(category.id).toBeDefined();
        expect(category.name).toBeDefined();
        expect(category.slug).toBeDefined();
        expect(category.color).toBeDefined();
        expect(category.description).toBeDefined();
      });
    });
  });

  describe("timelineEvents", () => {
    it("should have events", () => {
      expect(timelineEvents.length).toBeGreaterThan(0);
    });

    it("should have valid date formats", () => {
      timelineEvents.forEach((event) => {
        const date = new Date(event.date);
        expect(date.toString()).not.toBe("Invalid Date");
      });
    });

    it("should be sorted chronologically", () => {
      for (let i = 1; i < timelineEvents.length; i++) {
        const prevDate = new Date(timelineEvents[i - 1].date);
        const currDate = new Date(timelineEvents[i].date);
        expect(currDate.getTime()).toBeGreaterThanOrEqual(prevDate.getTime());
      }
    });
  });
});
