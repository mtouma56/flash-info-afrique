import Footer from "@/components/Footer";
import Header from "@/components/Header";
import SEO from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";

export default function MentionsLegales() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title="Mentions légales"
        description="Mentions légales de Flash Info Afrique - Informations sur l'éditeur, l'hébergeur et les conditions d'utilisation du site."
        url="https://flashinfoafrique.com/mentions-legales"
      />

      <Header />

      <main className="flex-1">
        <div className="container py-6 sm:py-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-6">
              Mentions légales
            </h1>

            <div className="space-y-8">
              {/* Éditeur */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold text-foreground mb-4">
                    Éditeur du site
                  </h2>
                  <div className="space-y-2 text-muted-foreground">
                    <p>
                      <strong className="text-foreground">Nom :</strong> Flash Info Afrique
                    </p>
                    <p>
                      <strong className="text-foreground">Statut :</strong> Média d'information en ligne
                    </p>
                    <p>
                      <strong className="text-foreground">Zone de couverture :</strong> Union Économique et Monétaire Ouest Africaine (UEMOA)
                    </p>
                    <p>
                      <strong className="text-foreground">Directeur de la publication :</strong> Flash Info Afrique
                    </p>
                    <p>
                      <strong className="text-foreground">Email :</strong>{" "}
                      <a
                        href="mailto:contact@flashinfoafrique.com"
                        className="text-primary hover:underline"
                      >
                        contact@flashinfoafrique.com
                      </a>
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Hébergeur */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold text-foreground mb-4">
                    Hébergement
                  </h2>
                  <div className="space-y-2 text-muted-foreground">
                    <p>
                      <strong className="text-foreground">Hébergeur :</strong> Vercel Inc.
                    </p>
                    <p>
                      <strong className="text-foreground">Adresse :</strong> 340 S Lemon Ave #4133, Walnut, CA 91789, États-Unis
                    </p>
                    <p>
                      <strong className="text-foreground">Site web :</strong>{" "}
                      <a
                        href="https://vercel.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        https://vercel.com
                      </a>
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Propriété intellectuelle */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold text-foreground mb-4">
                    Propriété intellectuelle
                  </h2>
                  <div className="space-y-4 text-muted-foreground">
                    <p>
                      L'ensemble du contenu de ce site (textes, images, graphismes, logo, icônes, etc.) 
                      est la propriété exclusive de Flash Info Afrique, à l'exception des marques, 
                      logos ou contenus appartenant à d'autres sociétés partenaires ou auteurs.
                    </p>
                    <p>
                      Toute reproduction, distribution, modification, adaptation, retransmission ou 
                      publication, même partielle, de ces différents éléments est strictement interdite 
                      sans l'accord exprès par écrit de Flash Info Afrique.
                    </p>
                    <p>
                      Les articles publiés peuvent citer des sources externes. Dans ce cas, 
                      les sources sont mentionnées et les droits restent la propriété de leurs auteurs respectifs.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Responsabilité */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold text-foreground mb-4">
                    Limitation de responsabilité
                  </h2>
                  <div className="space-y-4 text-muted-foreground">
                    <p>
                      Flash Info Afrique s'efforce de fournir des informations aussi précises que possible. 
                      Toutefois, il ne pourra être tenu responsable des omissions, des inexactitudes et des 
                      carences dans la mise à jour, qu'elles soient de son fait ou du fait des tiers 
                      partenaires qui lui fournissent ces informations.
                    </p>
                    <p>
                      Les informations présentes sur ce site sont données à titre indicatif et ne 
                      constituent en aucun cas un conseil juridique, financier ou professionnel. 
                      Nous vous invitons à consulter des professionnels qualifiés pour toute décision 
                      importante.
                    </p>
                    <p>
                      Flash Info Afrique décline toute responsabilité quant aux éventuels 
                      dysfonctionnements pouvant survenir sur le site et entraîner une perte de 
                      données ou une indisponibilité de l'accès aux informations.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Liens hypertextes */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold text-foreground mb-4">
                    Liens hypertextes
                  </h2>
                  <div className="space-y-4 text-muted-foreground">
                    <p>
                      Ce site peut contenir des liens hypertextes vers d'autres sites. 
                      Flash Info Afrique n'exerce aucun contrôle sur ces sites et décline 
                      toute responsabilité quant à leur contenu.
                    </p>
                    <p>
                      La création de liens hypertextes vers ce site est soumise à l'accord 
                      préalable de Flash Info Afrique.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Droit applicable */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold text-foreground mb-4">
                    Droit applicable
                  </h2>
                  <div className="space-y-4 text-muted-foreground">
                    <p>
                      Le présent site et ses mentions légales sont régis par le droit applicable 
                      dans la zone UEMOA. En cas de litige, et après échec de toute tentative de 
                      recherche d'une solution amiable, les tribunaux compétents seront saisis du litige.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Date de mise à jour */}
              <p className="text-sm text-muted-foreground text-center pt-4">
                Dernière mise à jour : Janvier 2026
              </p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
