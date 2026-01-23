import { describe, expect, it, vi, beforeEach } from "vitest";
import React from "react";
import { render, screen, fireEvent, waitFor } from "@/test/test-utils";
import OptimizedImage, { preloadImage } from "./OptimizedImage";

describe("OptimizedImage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render with correct alt text", () => {
    render(
      <OptimizedImage
        src="/test-image.jpg"
        alt="Test image description"
        priority={true}
      />
    );

    const img = screen.getByRole("img", { name: "Test image description" });
    expect(img).toBeInTheDocument();
  });

  it("should have lazy loading for non-priority images", () => {
    const { container } = render(
      <OptimizedImage
        src="/test-image.jpg"
        alt="Lazy image"
        priority={false}
      />
    );

    // Container should have loading placeholder class for non-priority images
    const wrapper = container.querySelector("div");
    expect(wrapper).toHaveClass("bg-muted");
  });

  it("should have eager loading for priority images", () => {
    render(
      <OptimizedImage
        src="/test-image.jpg"
        alt="Priority image"
        priority={true}
      />
    );

    const img = screen.getByRole("img", { name: "Priority image" });
    expect(img).toHaveAttribute("loading", "eager");
  });

  it("should call onLoad callback when image loads", async () => {
    const onLoad = vi.fn();
    
    render(
      <OptimizedImage
        src="/test-image.jpg"
        alt="Test image"
        priority={true}
        onLoad={onLoad}
      />
    );

    const img = screen.getByRole("img", { name: "Test image" });
    fireEvent.load(img);

    await waitFor(() => {
      expect(onLoad).toHaveBeenCalled();
    });
  });

  it("should call onError callback and use fallback when image fails to load", async () => {
    const onError = vi.fn();
    const fallbackSrc = "/fallback.svg";
    
    render(
      <OptimizedImage
        src="/broken-image.jpg"
        alt="Broken image"
        priority={true}
        onError={onError}
        fallbackSrc={fallbackSrc}
      />
    );

    const img = screen.getByRole("img", { name: "Broken image" });
    fireEvent.error(img);

    await waitFor(() => {
      expect(onError).toHaveBeenCalled();
      expect(img).toHaveAttribute("src", fallbackSrc);
    });
  });

  it("should apply custom className", () => {
    render(
      <OptimizedImage
        src="/test-image.jpg"
        alt="Test image"
        className="custom-class"
        priority={true}
      />
    );

    const container = screen.getByRole("img", { name: "Test image" }).closest("div");
    expect(container).toHaveClass("custom-class");
  });

  it("should set width and height when provided", () => {
    render(
      <OptimizedImage
        src="/test-image.jpg"
        alt="Test image"
        width={300}
        height={200}
        priority={true}
      />
    );

    const img = screen.getByRole("img", { name: "Test image" });
    expect(img).toHaveAttribute("width", "300");
    expect(img).toHaveAttribute("height", "200");
  });
});

describe("preloadImage", () => {
  it("should resolve when image loads successfully", async () => {
    // Mock Image constructor
    const mockImage = {
      onload: null as (() => void) | null,
      onerror: null as (() => void) | null,
      src: "",
    };
    
    vi.spyOn(globalThis, "Image").mockImplementation(() => {
      setTimeout(() => mockImage.onload?.(), 0);
      return mockImage as unknown as HTMLImageElement;
    });

    await expect(preloadImage("/test.jpg")).resolves.toBeUndefined();
  });

  it("should reject when image fails to load", async () => {
    const mockImage = {
      onload: null as (() => void) | null,
      onerror: null as ((error: Error) => void) | null,
      src: "",
    };
    
    vi.spyOn(globalThis, "Image").mockImplementation(() => {
      setTimeout(() => mockImage.onerror?.(new Error("Failed to load")), 0);
      return mockImage as unknown as HTMLImageElement;
    });

    await expect(preloadImage("/broken.jpg")).rejects.toThrow();
  });
});
