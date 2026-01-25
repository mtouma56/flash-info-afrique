import Footer from "@/components/Footer";
import Header from "@/components/Header";
import SEO from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";

export default function Confidentialite() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SEO
        title="Politique de confidentialité"
        description="Politique de confidentialité de Flash Info Afrique - Protection de vos données personnelles, cookies et droits RGPD."
        url="https://flashinfoafrique.com/confidentialite"
      />

      <Header />

      <main className="flex-1">
        <div className="container py-8 sm:py-12">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-8">
              Politique de confidentialité
            </h1>

            <div className="space-y-8">
              {/* Introduction */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold text-foreground mb-4">
                    Introduction
                  </h2>
                  <div className="space-y-4 text-muted-foreground">
                    <p>
                      Flash Info Afrique s'engage à protéger la vie privée de ses utilisateurs. 
                      Cette politique de confidentialité explique comment nous collectons, utilisons, 
                      stockons et protégeons vos données personnelles lorsque vous visitez notre site.
                    </p>
                    <p>
                      En utilisant notre site, vous acceptez les pratiques décrites dans cette politique.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Données collectées */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold text-foreground mb-4">
                    Données collectées
                  </h2>
                  <div className="space-y-4 text-muted-foreground">
                    <p>Nous pouvons collecter les types de données suivants :</p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>
                        <strong className="text-foreground">Données d'inscription à la newsletter :</strong>{" "}
                        Adresse email fournie volontairement pour recevoir nos actualités
                      </li>
                      <li>
                        <strong className="text-foreground">Données de navigation :</strong>{" "}
                        Informations techniques telles que l'adresse IP, le type de navigateur, 
                        les pages consultées et la durée de visite
                      </li>
                      <li>
                        <strong className="text-foreground">Cookies :</strong>{" "}
                        Petits fichiers stockés sur votre appareil pour améliorer votre expérience 
                        de navigation
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Utilisation des données */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold text-foreground mb-4">
                    Utilisation des données
                  </h2>
                  <div className="space-y-4 text-muted-foreground">
                    <p>Les données collectées sont utilisées pour :</p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>Fournir et améliorer nos services</li>
                      <li>Envoyer notre newsletter aux abonnés</li>
                      <li>Analyser l'utilisation du site pour l'optimiser</li>
                      <li>Assurer la sécurité du site</li>
                      <li>Répondre à vos demandes de contact</li>
                    </ul>
                    <p className="mt-4">
                      Nous ne vendons, n'échangeons ni ne louons vos données personnelles à des tiers.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Cookies */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold text-foreground mb-4">
                    Cookies
                  </h2>
                  <div className="space-y-4 text-muted-foreground">
                    <p>Notre site utilise des cookies pour :</p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>
                        <strong className="text-foreground">Cookies essentiels :</strong>{" "}
                        Nécessaires au fonctionnement du site
                      </li>
                      <li>
                        <strong className="text-foreground">Cookies de préférences :</strong>{" "}
                        Mémorisent vos préférences (thème clair/sombre)
                      </li>
                      <li>
                        <strong className="text-foreground">Cookies analytiques :</strong>{" "}
                        Nous aident à comprendre comment le site est utilisé
                      </li>
                    </ul>
                    <p className="mt-4">
                      Vous pouvez configurer votre navigateur pour refuser les cookies. 
                      Cependant, certaines fonctionnalités du site peuvent ne plus fonctionner correctement.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Conservation des données */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold text-foreground mb-4">
                    Conservation des données
                  </h2>
                  <div className="space-y-4 text-muted-foreground">
                    <p>
                      Nous conservons vos données personnelles uniquement pendant la durée nécessaire 
                      aux finalités pour lesquelles elles ont été collectées :
                    </p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>
                        <strong className="text-foreground">Données newsletter :</strong>{" "}
                        Jusqu'à votre désinscription
                      </li>
                      <li>
                        <strong className="text-foreground">Données de navigation :</strong>{" "}
                        Maximum 13 mois
                      </li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Vos droits */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold text-foreground mb-4">
                    Vos droits
                  </h2>
                  <div className="space-y-4 text-muted-foreground">
                    <p>
                      Conformément à la réglementation applicable en matière de protection des données, 
                      vous disposez des droits suivants :
                    </p>
                    <ul className="list-disc list-inside space-y-2 ml-4">
                      <li>
                        <strong className="text-foreground">Droit d'accès :</strong>{" "}
                        Obtenir une copie de vos données personnelles
                      </li>
                      <li>
                        <strong className="text-foreground">Droit de rectification :</strong>{" "}
                        Corriger des données inexactes ou incomplètes
                      </li>
                      <li>
                        <strong className="text-foreground">Droit à l'effacement :</strong>{" "}
                        Demander la suppression de vos données
                      </li>
                      <li>
                        <strong className="text-foreground">Droit d'opposition :</strong>{" "}
                        Vous opposer au traitement de vos données
                      </li>
                      <li>
                        <strong className="text-foreground">Droit à la portabilité :</strong>{" "}
                        Recevoir vos données dans un format structuré
                      </li>
                    </ul>
                    <p className="mt-4">
                      Pour exercer ces droits, contactez-nous à{" "}
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

              {/* Sécurité */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold text-foreground mb-4">
                    Sécurité des données
                  </h2>
                  <div className="space-y-4 text-muted-foreground">
                    <p>
                      Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles 
                      appropriées pour protéger vos données personnelles contre tout accès non autorisé, 
                      modification, divulgation ou destruction.
                    </p>
                    <p>
                      Notre site utilise le protocole HTTPS pour sécuriser les échanges de données.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Modifications */}
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold text-foreground mb-4">
                    Modifications de cette politique
                  </h2>
                  <div className="space-y-4 text-muted-foreground">
                    <p>
                      Nous nous réservons le droit de modifier cette politique de confidentialité 
                      à tout moment. Les modifications entreront en vigueur dès leur publication 
                      sur cette page. Nous vous encourageons à consulter régulièrement cette page.
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
                      Pour toute question concernant cette politique de confidentialité ou 
                      le traitement de vos données personnelles, contactez-nous :
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
