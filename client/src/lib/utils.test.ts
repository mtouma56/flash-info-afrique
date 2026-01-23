import { describe, expect, it } from "vitest";
import { cn } from "./utils";

describe("cn utility", () => {
  it("should merge class names correctly", () => {
    expect(cn("class1", "class2")).toBe("class1 class2");
  });

  it("should handle conditional classes", () => {
    expect(cn("base", true && "included", false && "excluded")).toBe("base included");
  });

  it("should handle undefined and null values", () => {
    expect(cn("base", undefined, null, "end")).toBe("base end");
  });

  it("should merge Tailwind classes correctly", () => {
    // tailwind-merge should handle conflicting classes
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
  });

  it("should handle object syntax", () => {
    expect(cn({ "class-a": true, "class-b": false })).toBe("class-a");
  });

  it("should handle array syntax", () => {
    expect(cn(["class1", "class2"])).toBe("class1 class2");
  });

  it("should handle empty inputs", () => {
    expect(cn()).toBe("");
    expect(cn("")).toBe("");
  });

  it("should handle complex combinations", () => {
    const result = cn(
      "base-class",
      ["array-class"],
      { "object-class": true, "hidden-class": false },
      undefined,
      "final-class"
    );
    expect(result).toContain("base-class");
    expect(result).toContain("array-class");
    expect(result).toContain("object-class");
    expect(result).toContain("final-class");
    expect(result).not.toContain("hidden-class");
  });
});
