import { Facebook, Linkedin, Twitter } from "lucide-react";
import { Link } from "wouter";

export default function MobileFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-card mt-4 pb-20" role="contentinfo">
      <div className="px-4 py-6">
        {/* Logo and description */}
        <div className="mb-6">
          <div className="flex items-center mb-3">
            <img 
              src="/logo.png" 
              alt="Flash Info Afrique" 
              className="h-10 w-auto object-contain"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Flash Info Afrique - L'actualité économique, financière et réglementaire de la zone UEMOA.
          </p>
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <h4 className="text-xs font-semibold text-foreground mb-2">
              Navigation
            </h4>
            <nav aria-label="Navigation pied de page">
              <ul className="space-y-1 text-xs">
                <li>
                  <Link href="/" className="text-muted-foreground hover:text-foreground transition-colors">
                    Accueil
                  </Link>
                </li>
                <li>
                  <Link href="/articles" className="text-muted-foreground hover:text-foreground transition-colors">
                    Articles
                  </Link>
                </li>
                <li>
                  <Link href="/dossiers" className="text-muted-foreground hover:text-foreground transition-colors">
                    Dossiers
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
          <div>
            <h4 className="text-xs font-semibold text-foreground mb-2">
              Catégories
            </h4>
            <nav aria-label="Catégories">
              <ul className="space-y-1 text-xs">
                <li>
                  <Link href="/categorie/banque-finance" className="text-muted-foreground hover:text-foreground transition-colors">
                    Banque & Finance
                  </Link>
                </li>
                <li>
                  <Link href="/categorie/regulation-conformite" className="text-muted-foreground hover:text-foreground transition-colors">
                    Régulation
                  </Link>
                </li>
                <li>
                  <Link href="/categorie/marches-investissements" className="text-muted-foreground hover:text-foreground transition-colors">
                    Marchés
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </div>

        {/* Social links */}
        <div className="flex items-center justify-center space-x-4 mb-4">
          <a
            href="https://linkedin.com/company/flash-info-afrique"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-primary transition-colors p-2"
            aria-label="Suivez-nous sur LinkedIn"
          >
            <Linkedin className="h-5 w-5" aria-hidden="true" />
          </a>
          <a
            href="https://facebook.com/flashinfoafrique"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-primary transition-colors p-2"
            aria-label="Suivez-nous sur Facebook"
          >
            <Facebook className="h-5 w-5" aria-hidden="true" />
          </a>
          <a
            href="https://twitter.com/flashinfoafrique"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-primary transition-colors p-2"
            aria-label="Suivez-nous sur Twitter"
          >
            <Twitter className="h-5 w-5" aria-hidden="true" />
          </a>
        </div>

        {/* Legal links */}
        <div className="flex flex-wrap justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground mb-4">
          <Link href="/mentions-legales" className="hover:text-foreground transition-colors">
            Mentions légales
          </Link>
          <Link href="/confidentialite" className="hover:text-foreground transition-colors">
            Confidentialité
          </Link>
          <Link href="/conditions-utilisation" className="hover:text-foreground transition-colors">
            Conditions
          </Link>
        </div>

        {/* Copyright */}
        <p className="text-xs text-muted-foreground text-center">
          © {currentYear} Flash Info Afrique
        </p>
      </div>
    </footer>
  );
}
