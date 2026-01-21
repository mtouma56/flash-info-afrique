import { toast } from "sonner";

interface ShareData {
  title: string;
  text: string;
  url: string;
}

/**
 * Share content using Web Share API with fallback
 */
export function useWebShare() {
  const canShare = typeof navigator !== "undefined" && "share" in navigator;

  const share = async (data: ShareData) => {
    if (canShare) {
      try {
        await navigator.share(data);
        return true;
      } catch (err) {
        // User cancelled or error occurred
        if ((err as Error).name !== "AbortError") {
          console.error("Share failed:", err);
        }
        return false;
      }
    }
    // Fallback: copy to clipboard
    return copyToClipboard(data.url);
  };

  return { share, canShare };
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    toast.success("Lien copié dans le presse-papiers !");
    return true;
  } catch {
    toast.error("Impossible de copier le lien");
    return false;
  }
}

/**
 * Share on LinkedIn
 */
export function shareOnLinkedIn(url: string, title?: string): void {
  const linkedInUrl = new URL("https://www.linkedin.com/sharing/share-offsite/");
  linkedInUrl.searchParams.set("url", url);
  if (title) {
    linkedInUrl.searchParams.set("title", title);
  }
  window.open(linkedInUrl.toString(), "_blank", "width=600,height=600,noopener,noreferrer");
}

/**
 * Share on Facebook
 */
export function shareOnFacebook(url: string): void {
  const facebookUrl = new URL("https://www.facebook.com/sharer/sharer.php");
  facebookUrl.searchParams.set("u", url);
  window.open(facebookUrl.toString(), "_blank", "width=600,height=600,noopener,noreferrer");
}

/**
 * Share on Twitter/X
 */
export function shareOnTwitter(url: string, text?: string): void {
  const twitterUrl = new URL("https://twitter.com/intent/tweet");
  twitterUrl.searchParams.set("url", url);
  if (text) {
    twitterUrl.searchParams.set("text", text);
  }
  window.open(twitterUrl.toString(), "_blank", "width=600,height=600,noopener,noreferrer");
}

/**
 * Share via email
 */
export function shareViaEmail(url: string, title: string, body?: string): void {
  const subject = encodeURIComponent(title);
  const emailBody = encodeURIComponent(body ? `${body}\n\n${url}` : url);
  window.location.href = `mailto:?subject=${subject}&body=${emailBody}`;
}
