import Footer from "@/components/Footer";
import Header from "@/components/Header";
import SEO from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";

export default function ConditionsUtilisation() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title="Conditions d'utilisation"
        description="Conditions générales d'utilisation de Flash Info Afrique - Règles d'accès et d'utilisation du site."
        url="https://flashinfoafrique.com/conditions-utilisation"
      />

      <Header />

      <main className="flex-1">
        <div className="container py-8 sm:py-12">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-8">
              Conditions d'utilisation
            </h1>

            <div className="space-y-8">
              {/* Préambule */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold text-foreground mb-4">
                    Préambule
                  </h2>
                  <div className="space-y-4 text-muted-foreground">
                    <p>
                      Les présentes conditions générales d'utilisation (CGU) régissent l'accès et 
                      l'utilisation du site Flash Info Afrique. En accédant à ce site, vous acceptez 
                      sans réserve les présentes conditions.
                    </p>
                    <p>
                      Flash Info Afrique se réserve le droit de modifier ces conditions à tout moment. 
                      Il vous appartient de les consulter régulièrement.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Objet du site */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold text-foreground mb-4">
                    Objet du site
                  </h2>
                  <div className="space-y-4 text-muted-foreground">
                    <p>
                      Flash Info Afrique est un média d'information en ligne spécialisé dans 
                      l'actualité économique, financière et réglementaire de la zone UEMOA 
                      (Union Économique et Monétaire Ouest Africaine).
                    </p>
                    <p>
                      Le site propose des articles d'information, des analyses et des dossiers 
                      thématiques sur le secteur bancaire, les marchés financiers et la régulation 
                      dans la région.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Accès au site */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold text-foreground mb-4">
                    Accès au site
                  </h2>
                  <div className="space-y-4 text-muted-foreground">
                    <p>
                      L'accès au site est gratuit et ouvert à tout utilisateur disposant d'un 
                      accès à Internet. Tous les coûts liés à l'accès au site (matériel, logiciels, 
                      connexion Internet) sont à la charge exclusive de l'utilisateur.
                    </p>
                    <p>
                      Flash Info Afrique met tout en œuvre pour offrir un accès continu au site. 
                      Toutefois, nous ne pouvons garantir une disponibilité permanente et déclinons 
                      toute responsabilité en cas d'interruption du service.
                    </p>
                    <p>
                      Nous nous réservons le droit de suspendre, interrompre ou limiter l'accès 
                      à tout ou partie du site pour des raisons de maintenance, de mise à jour 
                      ou pour toute autre raison.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Utilisation du contenu */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold text-foreground mb-4">
                    Utilisation du contenu
                  </h2>
                  <div className="space-y-4 text-muted-foreground">
                    <p>
                      Le contenu publié sur Flash Info Afrique est protégé par les droits de 
                      propriété intellectuelle. Toute utilisation non autorisée est interdite.
                    </p>
                    <p>
                      <strong className="text-foreground">Vous êtes autorisé à :</strong>
                    </p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Consulter le contenu à des fins personnelles et non commerciales</li>
                      <li>Partager les liens vers nos articles sur les réseaux sociaux</li>
                      <li>Citer de courts extraits avec mention de la source et lien vers l'article original</li>
                    </ul>
                    <p className="mt-4">
                      <strong className="text-foreground">Vous n'êtes pas autorisé à :</strong>
                    </p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Reproduire intégralement ou partiellement le contenu sans autorisation</li>
                      <li>Utiliser le contenu à des fins commerciales</li>
                      <li>Modifier, adapter ou transformer le contenu</li>
                      <li>Supprimer les mentions de droits d'auteur ou d'attribution</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Comportement de l'utilisateur */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold text-foreground mb-4">
                    Comportement de l'utilisateur
                  </h2>
                  <div className="space-y-4 text-muted-foreground">
                    <p>
                      En utilisant ce site, vous vous engagez à :
                    </p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Respecter les lois et réglementations en vigueur</li>
                      <li>Ne pas porter atteinte à l'ordre public ou aux bonnes mœurs</li>
                      <li>Ne pas diffuser de contenu illicite, diffamatoire ou offensant</li>
                      <li>Ne pas tenter de compromettre la sécurité ou le fonctionnement du site</li>
                      <li>Ne pas collecter de données sur les autres utilisateurs</li>
                      <li>Ne pas utiliser de robots, scrapers ou tout autre moyen automatisé</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Newsletter */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold text-foreground mb-4">
                    Newsletter
                  </h2>
                  <div className="space-y-4 text-muted-foreground">
                    <p>
                      En vous inscrivant à notre newsletter, vous acceptez de recevoir par email 
                      des informations sur l'actualité économique et financière de la zone UEMOA.
                    </p>
                    <p>
                      Vous pouvez vous désinscrire à tout moment en utilisant le lien de 
                      désinscription présent dans chaque email ou en nous contactant directement.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Limitation de responsabilité */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold text-foreground mb-4">
                    Limitation de responsabilité
                  </h2>
                  <div className="space-y-4 text-muted-foreground">
                    <p>
                      Les informations publiées sur Flash Info Afrique sont fournies à titre 
                      informatif uniquement. Elles ne constituent pas des conseils professionnels 
                      (juridiques, financiers, fiscaux ou autres).
                    </p>
                    <p>
                      Flash Info Afrique ne saurait être tenu responsable :
                    </p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Des décisions prises sur la base des informations publiées</li>
                      <li>Des dommages directs ou indirects résultant de l'utilisation du site</li>
                      <li>Des erreurs ou omissions dans le contenu</li>
                      <li>Des interruptions ou dysfonctionnements du site</li>
                      <li>Du contenu des sites tiers accessibles via des liens</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Liens externes */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold text-foreground mb-4">
                    Liens externes
                  </h2>
                  <div className="space-y-4 text-muted-foreground">
                    <p>
                      Ce site peut contenir des liens vers des sites externes. Ces liens sont 
                      fournis pour votre commodité et ne signifient pas que nous approuvons ou 
                      sommes affiliés à ces sites.
                    </p>
                    <p>
                      Nous n'exerçons aucun contrôle sur ces sites et ne sommes pas responsables 
                      de leur contenu, de leurs politiques de confidentialité ou de leurs pratiques.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Droit applicable */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold text-foreground mb-4">
                    Droit applicable et juridiction
                  </h2>
                  <div className="space-y-4 text-muted-foreground">
                    <p>
                      Les présentes conditions générales d'utilisation sont régies par le droit 
                      applicable dans la zone UEMOA.
                    </p>
                    <p>
                      En cas de litige relatif à l'interprétation ou à l'exécution des présentes 
                      conditions, les parties s'efforceront de trouver une solution amiable. 
                      À défaut, les tribunaux compétents seront saisis.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Contact */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold text-foreground mb-4">
                    Contact
                  </h2>
                  <div className="space-y-4 text-muted-foreground">
                    <p>
                      Pour toute question concernant ces conditions d'utilisation, contactez-nous :
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
