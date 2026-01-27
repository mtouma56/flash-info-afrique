import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Mail } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface NewsletterBarProps {
  className?: string;
}

export default function NewsletterBar({ className = "" }: NewsletterBarProps) {
  const [email, setEmail] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast.error("Veuillez entrer une adresse email");
      return;
    }

    setIsSubscribing(true);

    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(data.message || "Inscription réussie !");
        setEmail("");
      } else {
        toast.error(data.error || "Une erreur est survenue");
      }
    } catch {
      toast.error("Impossible de se connecter au serveur");
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <section 
      className={`border-y border-border bg-primary/5 py-3 sm:py-4 ${className}`}
      aria-label="Inscription newsletter rapide"
    >
      <div className="container">
        <form 
          onSubmit={handleSubmit}
          className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4"
        >
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Mail className="h-4 w-4 text-primary shrink-0" aria-hidden="true" />
            <span>Recevez notre newsletter UEMOA chaque vendredi</span>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Input
              type="email"
              placeholder="votre@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubscribing}
              className="flex-1 sm:w-48 min-h-[44px]"
              aria-label="Adresse email pour la newsletter"
              required
            />
            <Button 
              type="submit" 
              disabled={isSubscribing}
              className="min-h-[44px] px-4 whitespace-nowrap"
            >
              {isSubscribing ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
              ) : (
                "S'inscrire"
              )}
            </Button>
          </div>
        </form>
      </div>
    </section>
  );
}
