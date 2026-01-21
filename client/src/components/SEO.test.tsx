import { describe, expect, it } from "vitest";
import { calculateReadingTime } from "./SEO";

describe("SEO utilities", () => {
  describe("calculateReadingTime", () => {
    it("should return 1 minute for short content", () => {
      const shortContent = "This is a short article with just a few words.";
      expect(calculateReadingTime(shortContent)).toBe(1);
    });

    it("should calculate correct reading time for longer content", () => {
      // 200 words = 1 minute at 200 wpm
      const words = Array(400).fill("word").join(" ");
      expect(calculateReadingTime(words)).toBe(2);
    });

    it("should round up to the nearest minute", () => {
      // 250 words should round up to 2 minutes
      const words = Array(250).fill("word").join(" ");
      expect(calculateReadingTime(words)).toBe(2);
    });

    it("should handle empty content", () => {
      expect(calculateReadingTime("")).toBe(1);
    });

    it("should handle content with extra whitespace", () => {
      const contentWithSpaces = "   word   word   word   ";
      expect(calculateReadingTime(contentWithSpaces)).toBe(1);
    });
  });
});
