import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, Briefcase, Loader2, Mail, Scale, TrendingUp } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";
import { toast } from "sonner";

interface NewsletterWidgetProps {
  className?: string;
}

// Quick links for sidebar
const quickLinks = [
  { name: "Banque & Finance", href: "/categorie/banque-finance", icon: Briefcase, color: "#3B82F6" },
  { name: "Régulation", href: "/categorie/regulation-conformite", icon: Scale, color: "#EF4444" },
  { name: "Marchés", href: "/categorie/marches-investissements", icon: TrendingUp, color: "#10B981" },
];

export default function NewsletterWidget({ className = "" }: NewsletterWidgetProps) {
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
    <div className={`space-y-4 ${className}`}>
      {/* Newsletter Card */}
      <Card className="border-primary/20">
        <CardContent className="p-5">
          <div className="flex justify-center mb-3">
            <div className="p-2 bg-primary/10 rounded-full">
              <Mail className="h-5 w-5 text-primary" aria-hidden="true" />
            </div>
          </div>
          <h3 className="text-lg font-bold text-foreground mb-2 text-center font-['Sora']">
            Newsletter UEMOA
          </h3>
          <p className="text-sm text-muted-foreground mb-4 text-center">
            Recevez le résumé de l'actualité chaque vendredi
          </p>
          <form onSubmit={handleSubmit} className="space-y-3">
            <Input
              type="email"
              placeholder="votre@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubscribing}
              className="min-h-[44px]"
              aria-label="Adresse email pour la newsletter"
              required
            />
            <Button 
              type="submit" 
              className="w-full min-h-[44px]" 
              disabled={isSubscribing}
            >
              {isSubscribing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                  Inscription...
                </>
              ) : (
                "S'inscrire"
              )}
            </Button>
          </form>
          <p className="text-xs text-muted-foreground mt-3 text-center">
            Pas de spam. Désinscription facile.
          </p>
        </CardContent>
      </Card>

      {/* Quick Links Card */}
      <Card>
        <CardContent className="p-4">
          <h4 className="text-sm font-semibold text-foreground mb-3">
            Catégories populaires
          </h4>
          <nav aria-label="Catégories populaires">
            <ul className="space-y-2">
              {quickLinks.map((link) => {
                const Icon = link.icon;
                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="flex items-center gap-2 p-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                    >
                      <Icon className="h-4 w-4" style={{ color: link.color }} aria-hidden="true" />
                      <span className="flex-1">{link.name}</span>
                      <ArrowRight className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" aria-hidden="true" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          <Separator className="my-3" />
          <Link
            href="/articles"
            className="flex items-center justify-center gap-2 p-2 rounded-md text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
          >
            Voir tous les articles
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
