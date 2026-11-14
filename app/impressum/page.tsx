import React from 'react';
import Link from 'next/link';
import { ArrowLeft, FileText, Mail, Globe, Phone, Shield } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Impressum | Polaris - SocialWorkHub',
  description: 'Rechtliche Anbieterkennzeichnung gemäß § 5 Digitale-Dienste-Gesetz (DDG).',
};

export default function ImpressumPage() {
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
              href="/datenschutz"
              className="text-xs font-medium text-slate-500 hover:text-blue-600 transition-colors"
            >
              Datenschutzerklärung
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        <div className="border-b border-slate-200 pb-6">
          <div className="flex items-center gap-2 text-blue-600 font-semibold text-xs tracking-wider uppercase mb-1">
            <FileText className="w-3.5 h-3.5" />
            <span>Rechtliche Anbieterkennzeichnung</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Impressum
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Angaben gemäß § 5 Digitale-Dienste-Gesetz (DDG)
          </p>
        </div>

        {/* Anbieter */}
        <section className="bg-white border border-slate-200 p-6 rounded-2xl shadow-xs space-y-5 text-xs text-slate-700 leading-relaxed">
          <div>
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2">Dienstanbieter</h2>
            <p className="font-bold text-slate-900 text-base">Polaris by Socialworkhub</p>
            <p className="font-semibold text-slate-800 text-sm mt-0.5">Maximilian Breith</p>
            <p className="text-slate-600">Hauptstraße 8</p>
            <p className="text-slate-600">66953 Pirmasens</p>
            <p className="text-slate-600">Deutschland</p>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-2">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Kontakt</h3>
            <p className="flex items-center gap-2 text-slate-700">
              <Phone className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>Telefon: <a href="tel:+4915567678327" className="text-slate-900 font-medium hover:underline">+49 155 6767 8327</a></span>
            </p>
            <p className="flex items-center gap-2 text-slate-700">
              <Mail className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>E-Mail: <a href="mailto:kontakt@socialworkhub.net" className="text-blue-600 font-medium hover:underline">kontakt@socialworkhub.net</a> (alternativ: <a href="mailto:socialworkhub@proton.me" className="text-slate-600 hover:underline">socialworkhub@proton.me</a>)</span>
            </p>
            <p className="flex items-center gap-2 text-slate-700">
              <Globe className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>Internet: <a href="https://polaris-socialworkhub.net" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">https://polaris-socialworkhub.net</a></span>
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-1">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Steuerliche Angaben</h3>
            <p className="text-slate-700">
              Steuernummer / USt-IdNr.: In behördlicher Erteilung beim zuständigen Finanzamt (Gewerbeanmeldung anhängig; wird nach Zuteilung unverzüglich nachgetragen gemäß § 5 DDG).
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-1">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV</h3>
            <p className="font-semibold text-slate-800">Maximilian Breith</p>
            <p className="text-slate-600">Hauptstraße 8, 66953 Pirmasens</p>
          </div>

          <div className="pt-4 border-t border-slate-100 space-y-1">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Verbraucherstreitbeilegung / Universalschlichtungsstelle</h3>
            <p className="text-slate-600">
              Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
            </p>
          </div>
        </section>

        {/* Fachlicher Haftungsausschluss */}
        <section className="space-y-4 text-xs text-slate-700 leading-relaxed bg-white border border-slate-200 p-6 rounded-2xl shadow-xs">
          <div className="flex items-center gap-2 text-amber-700 font-bold text-sm">
            <Shield className="w-4 h-4 text-amber-600" />
            <span>Fachlicher Haftungsausschluss (Disclaimer)</span>
          </div>
          <p>
            <strong>Keine Garantenstellung oder behördliche Leistungszusicherung:</strong> Die auf Polaris bereitgestellten Informationen, Notfallstufenpläne und Hilfsangebote dienen der ersten Orientierung und Entscheidungsunterstützung im Berliner Hilfesystem. Sie ersetzen zu keinem Zeitpunkt die fachliche Prüfung durch die zuständigen Behörden (z. B. Jugendämter, Jobcenter, Sozialämter) oder das fachliche Urteil einer qualifizierten Fachkraft.
          </p>
          <p>
            <strong>Akute Krisen &amp; Kinderschutz:</strong> Bei Vorliegen gewichtiger Anhaltspunkte für eine akute Kindeswohlgefährdung (§ 8a SGB VIII) oder unmittelbare Eigen- bzw. Fremdgefährdung ist sofort der polizeiliche Notruf (110), der Rettungsdienst (112), der Berliner Krisendienst oder der Kinderschutz-Notdienst hinzuzuziehen.
          </p>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6 mt-12 text-center text-xs text-slate-500 space-y-1">
        <p>© {new Date().getFullYear()} Polaris by Socialworkhub</p>
        <div className="space-x-4">
          <Link href="/" className="hover:text-slate-900 underline">Startseite</Link>
          <Link href="/datenschutz" className="hover:text-slate-900 underline">Datenschutz</Link>
          <Link href="/impressum" className="hover:text-slate-900 underline font-semibold">Impressum</Link>
        </div>
      </footer>
    </div>
  );
}
