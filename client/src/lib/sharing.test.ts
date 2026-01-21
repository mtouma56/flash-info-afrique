import { describe, expect, it, vi } from "vitest";
import { shareOnFacebook, shareOnLinkedIn, shareOnTwitter } from "./sharing";

describe("Sharing utilities", () => {
  const originalOpen = window.open;

  beforeEach(() => {
    window.open = vi.fn();
  });

  afterEach(() => {
    window.open = originalOpen;
  });

  describe("shareOnLinkedIn", () => {
    it("should open LinkedIn share dialog with correct URL", () => {
      const url = "https://example.com/article";
      const title = "Test Article";

      shareOnLinkedIn(url, title);

      expect(window.open).toHaveBeenCalledWith(
        expect.stringContaining("linkedin.com/sharing/share-offsite"),
        "_blank",
        expect.any(String)
      );
      expect(window.open).toHaveBeenCalledWith(
        expect.stringContaining(encodeURIComponent(url)),
        expect.any(String),
        expect.any(String)
      );
    });
  });

  describe("shareOnFacebook", () => {
    it("should open Facebook share dialog with correct URL", () => {
      const url = "https://example.com/article";

      shareOnFacebook(url);

      expect(window.open).toHaveBeenCalledWith(
        expect.stringContaining("facebook.com/sharer/sharer.php"),
        "_blank",
        expect.any(String)
      );
    });
  });

  describe("shareOnTwitter", () => {
    it("should open Twitter share dialog with URL and text", () => {
      const url = "https://example.com/article";
      const text = "Check out this article";

      shareOnTwitter(url, text);

      expect(window.open).toHaveBeenCalledWith(
        expect.stringContaining("twitter.com/intent/tweet"),
        "_blank",
        expect.any(String)
      );
    });
  });
});
