import { cn } from "@/lib/utils";
import { List } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface TocItem {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
  className?: string;
  minReadingTime?: number; // Minimum reading time in minutes to show TOC
  readingTime: number;
}

/**
 * Extracts potential headings from plain text content.
 * Detects patterns like:
 * - Short paragraphs (< 80 chars) that could be section titles
 * - Paragraphs starting with numbers or bullets
 * - All-caps paragraphs
 */
function extractHeadings(content: string): TocItem[] {
  const paragraphs = content.split("\n\n").filter(p => p.trim());
  const headings: TocItem[] = [];
  
  paragraphs.forEach((paragraph, index) => {
    const trimmed = paragraph.trim();
    
    // Skip very short or very long paragraphs
    if (trimmed.length < 10 || trimmed.length > 100) return;
    
    // Check if it looks like a heading:
    // 1. Short paragraph (potential title)
    // 2. Starts with a number followed by period/colon
    // 3. Is in all caps or title case with no punctuation at end
    const isShortAndDistinct = trimmed.length < 80 && !trimmed.endsWith('.') && !trimmed.endsWith(',');
    const startsWithNumber = /^\d+[\.\:\)]\s/.test(trimmed);
    const isAllCaps = trimmed === trimmed.toUpperCase() && /[A-Z]/.test(trimmed);
    const isTitleCase = /^[A-Z][a-zéèêëàâäùûüôöîïç]+(\s+[A-Zéèêëàâäùûüôöîïç][a-zéèêëàâäùûüôöîïç]*)*$/.test(trimmed);
    
    if (isShortAndDistinct && (startsWithNumber || isAllCaps || isTitleCase)) {
      const id = `section-${index}`;
      headings.push({
        id,
        text: trimmed.replace(/^\d+[\.\:\)]\s*/, ''), // Remove leading numbers
        level: startsWithNumber ? 2 : 1,
      });
    }
  });
  
  return headings;
}

/**
 * Generates content with IDs for headings.
 * Returns paragraphs with IDs where headings were detected.
 */
export function generateContentWithIds(content: string): { paragraphs: { text: string; id?: string }[] } {
  const paragraphs = content.split("\n\n").filter(p => p.trim());
  const headings = extractHeadings(content);
  const headingIds = new Set(headings.map(h => parseInt(h.id.replace('section-', ''))));
  
  return {
    paragraphs: paragraphs.map((text, index) => ({
      text: text.trim(),
      id: headingIds.has(index) ? `section-${index}` : undefined,
    })),
  };
}

export default function TableOfContents({ 
  content, 
  className = "",
  minReadingTime = 5,
  readingTime,
}: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const headings = extractHeadings(content);
  
  // Don't show TOC for short articles or if no headings detected
  if (readingTime < minReadingTime || headings.length < 2) {
    return null;
  }

  // Track active section based on scroll position
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: '-80px 0px -80% 0px' }
    );

    headings.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [headings]);

  const scrollToSection = useCallback((id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const headerOffset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  }, []);

  return (
    <nav 
      className={cn("bg-card border border-border rounded-lg p-4", className)}
      aria-label="Table des matières"
    >
      <div className="flex items-center gap-2 mb-3 pb-3 border-b border-border">
        <List className="h-4 w-4 text-primary" aria-hidden="true" />
        <h3 className="text-sm font-semibold text-foreground">
          Sommaire
        </h3>
      </div>
      <ul className="space-y-2">
        {headings.map(({ id, text, level }) => (
          <li key={id}>
            <button
              onClick={() => scrollToSection(id)}
              className={cn(
                "text-left text-sm transition-colors w-full px-2 py-1 rounded hover:bg-muted",
                level === 2 && "pl-4",
                activeId === id 
                  ? "text-primary font-medium bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {text}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
