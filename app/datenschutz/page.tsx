import React from 'react';
import Link from 'next/link';
import { ShieldCheck, ArrowLeft, Lock, CheckCircle2, ExternalLink } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Datenschutzerklärung | Polaris - SocialWorkHub',
  description: 'Datenschutzerklärung & Google OAuth Compliance von Polaris / SocialWorkHub gemäß DSGVO und Google API Services User Data Policy.',
};

export default function DatenschutzPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 antialiased selection:bg-blue-100 selection:text-blue-900">
      {/* Top Bar */}
      <header className="border-b border-slate-200 bg-white sticky top-0 z-20 shadow-xs">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Zurück zur Anwendung</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/impressum"
              className="text-xs font-medium text-slate-500 hover:text-blue-600 transition-colors"
            >
              Impressum
            </Link>
            <span className="text-slate-300">|</span>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>DSGVO- &amp; Google-konform</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-10">
        
        {/* Title */}
        <div className="border-b border-slate-200 pb-6">
          <div className="flex items-center gap-2 text-blue-600 font-semibold text-xs tracking-wider uppercase mb-1">
            <Lock className="w-3.5 h-3.5" />
            <span>Datenschutz &amp; Privatsphäre</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Datenschutzerklärung / Privacy Policy
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Gültig für <strong>Polaris by Socialworkhub</strong> (https://polaris-socialworkhub.net) · Stand: November 2026
          </p>
        </div>

        {/* Highlight Banner: Zero-PII & Google Compliance */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl">
            <div className="flex items-center gap-2 font-bold text-sm text-emerald-900 mb-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Zero-PII bei Klientendaten</span>
            </div>
            <p className="text-xs text-emerald-800 leading-relaxed">
              Polaris speichert zu keinem Zeitpunkt Klientennamen, Geburtsdaten, Aktenzeichen oder Wohnanschriften hilfesuchender Personen. Alle Triage-Kriterien werden flüchtig im RAM verarbeitet.
            </p>
          </div>
          <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl">
            <div className="flex items-center gap-2 font-bold text-sm text-blue-900 mb-1">
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
              <span>Google API Limited Use Compliance</span>
            </div>
            <p className="text-xs text-blue-800 leading-relaxed">
              Die Nutzung und Übertragung von Informationen aus Google APIs entspricht vollständig den Richtlinien für Nutzerdaten der Google API-Dienste (einschließlich Limited Use Requirements).
            </p>
          </div>
        </div>

        {/* Section 1: Verantwortlicher */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-200 pb-1">
            1. Verantwortliche Stelle (Data Controller)
          </h2>
          <p className="text-xs text-slate-700 leading-relaxed">
            Verantwortlicher im Sinne der Datenschutz-Grundverordnung (DSGVO) und anderer nationaler Datenschutzgesetze der Mitgliedsstaaten sowie sonstiger datenschutzrechtlicher Bestimmungen ist:
          </p>
          <div className="bg-white border border-slate-200 p-4 rounded-xl text-xs text-slate-800 space-y-1 shadow-xs">
            <p className="font-bold text-slate-900 text-sm">Polaris by Socialworkhub</p>
            <p className="font-semibold text-slate-800">Maximilian Breith</p>
            <p className="text-slate-600">Hauptstraße 8, 66953 Pirmasens, Deutschland</p>
            <p className="text-slate-600">Telefon: +49 155 6767 8327</p>
            <p>E-Mail: <a href="mailto:kontakt@socialworkhub.net" className="text-blue-600 underline">kontakt@socialworkhub.net</a> (alternativ: <a href="mailto:socialworkhub@proton.me" className="text-slate-600 underline">socialworkhub@proton.me</a>)</p>
            <p>Webseite: <a href="https://polaris-socialworkhub.net" className="text-blue-600 underline">https://polaris-socialworkhub.net</a></p>
            <p className="text-slate-500 pt-1">
              (Vollständige Angaben gemäß § 5 DDG siehe <Link href="/impressum" className="text-blue-600 underline">Impressum</Link>)
            </p>
          </div>
        </section>

        {/* Section 2: Google Sign-In & OAuth 2.0 (Strict Google Compliance) */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-200 pb-1">
            2. Google Sign-In &amp; Verarbeitung von Google-Nutzerdaten
          </h2>
          <p className="text-xs text-slate-700 leading-relaxed">
            Polaris bietet Fachkräften der Sozialen Arbeit die Möglichkeit, sich über den Dienst <strong>Google Sign-In</strong> (Google LLC, 1600 Amphitheatre Parkway, Mountain View, CA 94043, USA bzw. Google Ireland Limited, Gordon House, Barrow Street, Dublin 4, Irland) anzumelden.
          </p>
          
          <div className="space-y-3 bg-white border border-slate-200 p-4 rounded-xl shadow-xs text-xs text-slate-700">
            <div>
              <h3 className="font-bold text-slate-900 mb-1">a) Erhobene Datenkategorien (Scopes)</h3>
              <p>Wenn Sie sich über Google anmelden, bitten wir ausschließlich um Freigabe folgender Standard-Identitätsdaten:</p>
              <ul className="list-disc pl-5 mt-1.5 space-y-1 text-slate-600">
                <li><strong>E-Mail-Adresse</strong> (Scope: <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px]">email</code> / <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px]">userinfo.email</code>) – zur eindeutigen Zuordnung Ihres Fachkraft-Accounts.</li>
                <li><strong>Profilinformationen</strong> (Scope: <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px]">profile</code> / <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px]">userinfo.profile</code>) – Ihr Vor- und Nachname sowie Ihre Profilbild-URL zur Darstellung in der Benutzeroberfläche.</li>
                <li><strong>OpenID Identifier</strong> (Scope: <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px]">openid</code>) – ein verschlüsselter Identifikator zur sicheren Sitzungsverwaltung.</li>
              </ul>
              <p className="mt-2 text-slate-600 font-medium">
                Polaris fordert zu keinem Zeitpunkt Zugriff auf Google Drive, Google Kalender, Kontakte, Gmail oder sonstige vertrauliche Google-Dienste an.
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <h3 className="font-bold text-slate-900 mb-1">b) Zweck und Rechtsgrundlage</h3>
              <p>
                Die Verarbeitung Ihrer Google-Profil- und E-Mail-Daten dient ausschließlich der Erstellung und Verwaltung Ihres Benutzerkontos, der Authentifizierung und der Einbindung in Team-Features Ihrer sozialen Einrichtung. Rechtsgrundlage ist <strong>Art. 6 Abs. 1 lit. b DSGVO</strong> (Vertragserfüllung bzw. Durchführung vorvertraglicher Maßnahmen zur Nutzung des Polaris-Fachportals).
              </p>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <h3 className="font-bold text-slate-900 mb-1">c) Google Limited Use Disclosure &amp; Keine Weitergabe an Dritte</h3>
              <p>
                Polaris verwendet die über Google APIs erhaltenen Daten strikt zweckgebunden:
              </p>
              <ul className="list-disc pl-5 mt-1 space-y-1 text-slate-600">
                <li>Daten werden <strong>nicht</strong> an Datenhändler, Marktforscher oder Werbenetzwerke weitergegeben oder verkauft.</li>
                <li>Daten werden <strong>nicht</strong> zur Schaltung von Werbung oder zum Tracking über fremde Plattformen hinweg verwendet.</li>
                <li>Daten werden <strong>nicht</strong> zum Training generativer KI-Modelle ohne explizite, separate Zustimmung herangezogen.</li>
                <li>
                  Die Nutzung und Übertragung von Informationen an andere Apps hält die Anforderungen der 
                  <a
                    href="https://developers.google.com/terms/api-services-user-data-policy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline inline-flex items-center gap-0.5 ml-1"
                  >
                    Google API Services User Data Policy
                    <ExternalLink className="w-3 h-3 inline" />
                  </a> ein.
                </li>
              </ul>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <h3 className="font-bold text-slate-900 mb-1">d) Widerruf des Zugriffs</h3>
              <p>
                Sie können die Berechtigung für Polaris jederzeit in Ihrem persönlichen Google-Konto widerrufen unter:{' '}
                <a
                  href="https://myaccount.google.com/permissions"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 underline font-medium inline-flex items-center gap-1"
                >
                  myaccount.google.com/permissions
                  <ExternalLink className="w-3 h-3 inline" />
                </a>.
              </p>
            </div>
          </div>
        </section>

        {/* Section 3: Klientendaten & Zero-PII Architektur */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-200 pb-1">
            3. Zero-PII-Architektur bei Hilfesuchenden / Klient*innen
          </h2>
          <p className="text-xs text-slate-700 leading-relaxed">
            Als Plattform für Sozialarbeiter*innen und Beratungsstellen unterliegt Polaris höchsten Anforderungen an das Sozialgeheimnis (§ 35 SGB I) und den Schutz vulnerabler Gruppen:
          </p>
          <ul className="list-disc pl-5 text-xs text-slate-700 space-y-1.5">
            <li><strong>Keine Speicherung personenbezogener Daten von Klienten:</strong> In der Datenbank werden keinerlei Namen, Geburtsdaten, Telefonnummern, Aktenzeichen oder Wohnorte von Klient*innen hinterlegt.</li>
            <li><strong>Flüchtige Auswertung:</strong> Ausgewählte Merkmale im Triage-Assistenten (z. B. Hilfebedarf, Alterskategorie, Sprachbarriere) verbleiben während der Berechnung im flüchtigen Speicher (RAM) der Serverless Function und werden unmittelbar nach der Ergebnisrückgabe verworfen.</li>
            <li><strong>Ausdrucke &amp; Handzettel:</strong> Die Generierung von Klienten-Handzetteln (z. B. Laufzettel zur Kältehilfe oder Fachstelle) erfolgt rein clientseitig im Webbrowser der Fachkraft. Es findet kein serverseitiges Logging statt.</li>
          </ul>
        </section>

        {/* Section 4: Hosting & Auftragsverarbeitung (Supabase & Hosting) */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-200 pb-1">
            4. Hosting, Infrastruktur &amp; Auftragsverarbeiter (AVV)
          </h2>
          <div className="text-xs text-slate-700 space-y-2">
            <p>
              Zur Bereitstellung der Plattform bedienen wir uns sorgfältig ausgewählter Dienstleister im Rahmen einer Auftragsverarbeitung gemäß Art. 28 DSGVO:
            </p>
            <div className="grid sm:grid-cols-2 gap-3 pt-1">
              <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-xs">
                <h4 className="font-bold text-slate-900 mb-1">Mistral AI (Europäische KI-Inferenz)</h4>
                <p className="text-slate-600">
                  Mistral AI SAS (Paris, Frankreich). Die Inferenz (Triage-Empfehlungen und Übersetzungen) erfolgt ausschließlich auf Rechenzentren in der Europäischen Union. Es gilt eine strikte Zero-Data-Retention-Garantie: Eingaben werden nicht protokolliert oder für Modelltrainings verwendet.
                </p>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-xs">
                <h4 className="font-bold text-slate-900 mb-1">Supabase (Authentifizierung &amp; Stammdaten)</h4>
                <p className="text-slate-600">
                  Supabase Inc. verwaltet Benutzer-IDs und Einrichtungs-Stammdaten. Die Datenbank wird in ISO-27001-zertifizierten Rechenzentren innerhalb der Europäischen Union (Region Frankfurt am Main, Deutschland) gehostet.
                </p>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-xs">
                <h4 className="font-bold text-slate-900 mb-1">Webhosting &amp; Serverless Functions</h4>
                <p className="text-slate-600">
                  Die Webanwendung wird über moderne europäische Cloud-Infrastrukturen (Vercel EU Region) mit SSL/TLS-Ende-zu-Ende-Verschlüsselung ausgeliefert. Server-Logfiles werden ausschließlich zur Gefahrenabwehr kurzzeitig gespeichert.
                </p>
              </div>
              <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-xs">
                <h4 className="font-bold text-slate-900 mb-1">Vektorkarten (Protomaps PMTiles)</h4>
                <p className="text-slate-600">
                  Die interaktive Berlin-Karte läuft vollständig eigengehostet über Cloudflare R2 mit EU Data Boundary. Zu keinem Zeitpunkt werden Anfragen an Drittanbieter-Kartendienste (wie Google Maps oder Mapbox) weitergeleitet.
                </p>
              </div>
            </div>
            <p className="text-slate-500 text-[11px] pt-1">
              Für Wohlfahrtsverbände, Jugendhilfeträger und kommunale Einrichtungen stellen wir bei Bedarf eine formelle Vereinbarung zur Auftragsverarbeitung (AVV) nach Art. 28 DSGVO bereit.
            </p>
          </div>
        </section>

        {/* Section 5: Speicherdauer & Kontolöschung */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-200 pb-1">
            5. Speicherdauer &amp; Datenlöschung
          </h2>
          <p className="text-xs text-slate-700 leading-relaxed">
            Ihre Fachkraft-Benutzerdaten (E-Mail-Adresse, Name) werden gespeichert, solange Ihr Benutzerkonto aktiv ist. Sie können die vollständige Löschung Ihres Profils und sämtlicher verknüpfter Team-Einträge jederzeit per E-Mail an <a href="mailto:socialworkhub@proton.me" className="text-blue-600 underline">socialworkhub@proton.me</a> oder direkt über die Profileinstellungen veranlassen. Die Daten werden dann unverzüglich aus der Live-Datenbank entfernt.
          </p>
        </section>

        {/* Section 6: Betroffenenrechte nach DSGVO */}
        <section className="space-y-3">
          <h2 className="text-lg font-bold text-slate-900 border-b border-slate-200 pb-1">
            6. Ihre Rechte als betroffene Person (DSGVO)
          </h2>
          <p className="text-xs text-slate-700 leading-relaxed">
            Nach der DSGVO stehen Ihnen umfassende Schutzrechte gegenüber dem Verantwortlichen zu:
          </p>
          <div className="grid sm:grid-cols-2 gap-2 text-xs text-slate-700">
            <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
              <strong>Art. 15 DSGVO:</strong> Recht auf Auskunft über die verarbeiteten Daten.
            </div>
            <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
              <strong>Art. 16 DSGVO:</strong> Recht auf unverzügliche Berichtigung unrichtiger Daten.
            </div>
            <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
              <strong>Art. 17 DSGVO:</strong> Recht auf Löschung („Recht auf Vergessenwerden“).
            </div>
            <div className="p-2.5 bg-white border border-slate-200 rounded-lg">
              <strong>Art. 18 &amp; 20 DSGVO:</strong> Recht auf Einschränkung &amp; Datenübertragbarkeit.
            </div>
          </div>
          <p className="text-xs text-slate-600 pt-1">
            Zudem steht Ihnen nach <strong>Art. 77 DSGVO</strong> ein Beschwerderecht bei der zuständigen Datenschutzaufsichtsbehörde zu (z. B. Berliner Beauftragte für Datenschutz und Informationsfreiheit).
          </p>
        </section>

        {/* English Summary Box for Reviewers */}
        <section className="bg-slate-900 text-slate-200 p-6 rounded-2xl space-y-3">
          <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-wider">
            <span>English Summary for Google OAuth Verification Reviewers</span>
          </div>
          <h3 className="text-base font-bold text-white">Google API Services User Data Policy Compliance Statement</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Polaris requests access to basic user identity information via Google Sign-In (<code className="text-blue-300">openid</code>, <code className="text-blue-300">email</code>, <code className="text-blue-300">profile</code>) solely to authenticate social workers and permit collaborative casework across authorized institutions.
          </p>
          <ul className="list-disc pl-5 text-xs text-slate-300 space-y-1">
            <li>We do not sell, rent, or transfer user data to third parties, advertising platforms, or data brokers.</li>
            <li>We adhere to the Google API Services User Data Policy, including the Limited Use requirements.</li>
            <li>Users can revoke access at any time via <a href="https://myaccount.google.com/permissions" target="_blank" rel="noopener noreferrer" className="text-blue-400 underline">Google Account Permissions</a> or delete their profile entirely upon request.</li>
          </ul>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12 text-center text-xs text-slate-500 space-y-1">
        <p>© {new Date().getFullYear()} Polaris by Socialworkhub</p>
        <div className="space-x-4">
          <Link href="/" className="hover:text-slate-900 underline">Startseite</Link>
          <Link href="/datenschutz" className="hover:text-slate-900 underline font-semibold">Datenschutz</Link>
          <Link href="/impressum" className="hover:text-slate-900 underline">Impressum</Link>
        </div>
      </footer>
    </div>
  );
}
