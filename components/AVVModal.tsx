'use client';

import React from 'react';
import {
  X,
  ShieldCheck,
  FileText,
  Printer,
  Mail,
  Building2,
  Lock,
  Server,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

interface AVVModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AVVModal: React.FC<AVVModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  const mailSubject = encodeURIComponent('Anforderung individueller AVV-Vertrag (Polaris)');
  const mailBody = encodeURIComponent(
`Hallo SocialWorkHub-Team,

wir möchten als Träger einen individuellen Auftragsverarbeitungsvertrag (AVV) nach Art. 28 DSGVO für Polaris abschließen:

Träger / Einrichtung: 
Straße, Hausnummer: 
PLZ, Ort: 
Vertretungsberechtigte Person: 
E-Mail für Datenschutzbelange: 
Telefon: 

Bitte sendet uns das gegengezeichnete AVV-Exemplar zu.

Mit freundlichen Grüßen,
`
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Auftragsverarbeitungsvertrag (AVV)
              </h2>
              <p className="text-xs text-slate-400">
                Mustervertrag nach Art. 28 DSGVO & § 35 SGB I (Sozialdatengeheimnis)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Schließen"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-300 text-xs sm:text-sm leading-relaxed">
          
          {/* Summary Box */}
          <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-500/30 space-y-2">
            <div className="flex items-center gap-2 font-bold text-emerald-300">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Garantien für Berliner Träger & öffentliche Stellen</span>
            </div>
            <p className="text-xs text-emerald-200/90 leading-relaxed">
              Polaris verarbeitet alle Workspace-Daten ausschließlich in Rechenzentren innerhalb der Europäischen Union (Region Frankfurt am Main). Es erfolgt keine Speicherung schutzbedürftiger Klientendaten ohne Zweckbindung.
            </p>
          </div>

          {/* Section 1: Präambel */}
          <div className="space-y-2">
            <h3 className="font-bold text-white text-sm uppercase tracking-wider text-slate-200">
              1. Gegenstand & Anwendungsbereich
            </h3>
            <p className="text-slate-400">
              Diese Vereinbarung regelt die Rechte und Pflichten der Vertragsparteien bei der Verarbeitung personenbezogener Daten im Rahmen der Bereitstellung der Software-as-a-Service-Lösung <strong>Polaris (SocialWorkHub)</strong> für soziale Träger, Wohlfahrtsverbände, Jugendhilfe und Beratungsstellen.
            </p>
          </div>

          {/* Section 2: Besondere Verpflichtung auf das Sozialdatengeheimnis */}
          <div className="space-y-2 p-3.5 rounded-lg bg-slate-950 border border-slate-800">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-400" />
              <span>2. Verpflichtung auf das Sozialgeheimnis (§ 35 SGB I / § 203 StGB)</span>
            </h3>
            <p className="text-slate-400 text-xs leading-relaxed">
              Der Auftragnehmer verpflichtet sämtliche mit der Durchführung betrauten Personen vor Aufnahme der Tätigkeit schriftlich auf die Wahrung des Datengeheimnisses sowie auf das <strong>Sozialdatengeheimnis nach § 35 SGB I</strong>. Das Berufsgeheimnis nach § 203 StGB wird vollumfänglich gewahrt. Die Verpflichtung besteht auch nach Beendigung der Tätigkeit fort.
            </p>
          </div>

          {/* Section 3: Technische & Organisatorische Maßnahmen (TOMs) */}
          <div className="space-y-2.5">
            <h3 className="font-bold text-white text-sm uppercase tracking-wider text-slate-200 flex items-center gap-2">
              <Server className="w-4 h-4 text-blue-400" />
              <span>3. Technische und organisatorische Maßnahmen (TOMs)</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-300">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                <span className="font-bold text-white">Verschlüsselung</span>
                <p className="text-slate-400">TLS 1.3 während des Transports, AES-256 im Ruhezustand (at rest).</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                <span className="font-bold text-white">Mandantentrennung</span>
                <p className="text-slate-400">Row Level Security (RLS) auf Datenbankebene; strikte Isolierung von Team-Notizen.</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                <span className="font-bold text-white">Server-Standort</span>
                <p className="text-slate-400">Rechenzentrum Region Frankfurt am Main (Deutschland / EU).</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-1">
                <span className="font-bold text-white">Zugriffskontrolle</span>
                <p className="text-slate-400">Rollenbasierte Berechtigungen (Admin/Mitglied), JWT-Sitzungsvalidierung.</p>
              </div>
            </div>
          </div>

          {/* Section 4: Unterauftragsverarbeiter */}
          <div className="space-y-2">
            <h3 className="font-bold text-white text-sm uppercase tracking-wider text-slate-200">
              4. Genehmigte Unterauftragnehmer
            </h3>
            <ul className="space-y-1 text-xs text-slate-400 list-disc list-inside">
              <li><strong>Supabase Inc. / AWS Europe:</strong> Datenbankhosting (Standort Frankfurt am Main, Deutschland).</li>
              <li><strong>Stripe Payments Europe Ltd.:</strong> Zahlungsabwicklung & SEPA-Mandate (Irland / EU).</li>
              <li><strong>Vercel Inc.:</strong> Hosting der Webapplikation (EU Region).</li>
            </ul>
          </div>

          {/* Section 5: Löschung & Datenherausgabe */}
          <div className="space-y-2">
            <h3 className="font-bold text-white text-sm uppercase tracking-wider text-slate-200">
              5. Beendigung & Datenlöschung
            </h3>
            <p className="text-slate-400">
              Nach Beendigung des Lizenzvertrages kann der Auftraggeber jederzeit die vollständige Löschung sämtlicher Team-Workspaces und interner Notizen verlangen. Daten werden unverzüglich und unwiederbringlich gelöscht, soweit keine gesetzlichen Aufbewahrungspflichten entgegenstehen.
            </p>
          </div>

        </div>

        {/* Modal Actions Footer */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition font-semibold cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Drucken / PDF speichern</span>
            </button>

            <a
              href={`mailto:kontakt@socialworkhub.net?subject=${mailSubject}&body=${mailBody}`}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition font-semibold cursor-pointer"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Unterschriebenes Exemplar anfordern</span>
            </a>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition font-medium cursor-pointer"
          >
            Schließen
          </button>
        </div>

      </div>
    </div>
  );
};

export default AVVModal;
