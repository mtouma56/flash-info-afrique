import { Facebook, Linkedin, Twitter } from "lucide-react";
import { Link } from "wouter";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-card mt-16" role="contentinfo">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* About */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary">
                <span className="text-white font-bold text-xl" aria-hidden="true">F</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground font-['Sora']">
                  Flash Info Afrique
                </h3>
                <p className="text-xs text-muted-foreground">
                  L'actualité économique UEMOA
                </p>
              </div>
            </div>
            <p className="text-sm text-muted-foreground max-w-md">
              Flash Info Afrique est un média d'information spécialisé dans
              l'actualité économique, financière et réglementaire de la zone
              UEMOA. Nous agrégeons et analysons les principales actualités du
              secteur bancaire, des marchés financiers et de la régulation.
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-4">
              Navigation
            </h4>
            <nav aria-label="Navigation pied de page">
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    href="/"
                    className="text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                  >
                    Accueil
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dossier/fidelis"
                    className="text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                  >
                    Dossier FIDELIS
                  </Link>
                </li>
                <li>
                  <Link
                    href="/categorie/banque-finance"
                    className="text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                  >
                    Banque & Finance
                  </Link>
                </li>
                <li>
                  <Link
                    href="/categorie/regulation-conformite"
                    className="text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                  >
                    Régulation
                  </Link>
                </li>
              </ul>
            </nav>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-4">
              Légal
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="#mentions-legales"
                  className="text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                >
                  Mentions légales
                </a>
              </li>
              <li>
                <a
                  href="#confidentialite"
                  className="text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                >
                  Politique de confidentialité
                </a>
              </li>
              <li>
                <a
                  href="#cgu"
                  className="text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded"
                >
                  Conditions d'utilisation
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0">
          <p className="text-sm text-muted-foreground">
            © {currentYear} Flash Info Afrique. Tous droits réservés.
          </p>
          <nav aria-label="Réseaux sociaux">
            <ul className="flex items-center space-x-4">
              <li>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded p-1"
                  aria-label="Suivez-nous sur LinkedIn"
                >
                  <Linkedin className="h-5 w-5" aria-hidden="true" />
                </a>
              </li>
              <li>
                <a
                  href="https://facebook.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded p-1"
                  aria-label="Suivez-nous sur Facebook"
                >
                  <Facebook className="h-5 w-5" aria-hidden="true" />
                </a>
              </li>
              <li>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded p-1"
                  aria-label="Suivez-nous sur Twitter"
                >
                  <Twitter className="h-5 w-5" aria-hidden="true" />
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </footer>
  );
}
