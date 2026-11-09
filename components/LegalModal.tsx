'use client';

import React, { useState } from 'react';
import { X, ShieldCheck, FileText, AlertTriangle } from 'lucide-react';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'dsgvo' | 'disclaimer' | 'impressum';
}

export const LegalModal: React.FC<LegalModalProps> = ({
  isOpen,
  onClose,
  defaultTab = 'dsgvo',
}) => {
  const [activeTab, setActiveTab] = useState<'dsgvo' | 'disclaimer' | 'impressum'>(defaultTab);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Rechtliche Hinweise &amp; Datenschutz</h3>
              <p className="text-[11px] text-slate-500">Transparenz für Sozialarbeiter*innen und Träger</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-white px-4">
          <button
            type="button"
            onClick={() => setActiveTab('dsgvo')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'dsgvo'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Datenschutz &amp; DSGVO</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('disclaimer')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'disclaimer'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Fachlicher Haftungsausschluss</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('impressum')}
            className={`py-3 px-4 text-xs font-bold border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'impressum'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Impressum</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-700 leading-relaxed">
          {activeTab === 'dsgvo' && (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl text-emerald-950 font-medium">
                <strong>Wichtigstes Prinzip: Zero-PII-Architektur</strong>
                <p className="mt-1 text-emerald-900 text-[11px]">
                  Polaris speichert zu keinem Zeitpunkt Klientennamen, Geburtsdaten, Aktenzeichen oder Wohnanschriften.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">1. Flüchtige Verarbeitung bei der Triage</h4>
                <p>
                  Die im Triage-Assistenten ausgewählten Kriterien (wie ungefähres Alter, Meldebezirk, Wohnstatus, Barrieren) werden ausschließlich zur Laufzeit im flüchtigen Arbeitsspeicher (RAM) der Serverless Function ausgewertet, um einen passgenauen Handlungsstufenplan zu generieren. Nach Abschluss der Anfrage werden die Fallvariablen sofort verworfen.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">2. Datenbank &amp; Server-Standorte</h4>
                <p>
                  Unsere Datenbank wird über Supabase in ISO-27001-zertifizierten Rechenzentren innerhalb der Europäischen Union betrieben. Es werden ausschließlich Einrichtungsstammdaten (Adressen, Öffnungszeiten, Telefonnummern) in der Datenbank gespeichert.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">3. Vereinbarung zur Auftragsverarbeitung (AVV)</h4>
                <p>
                  Für Wohlfahrtsverbände, Jugendhilfeträger und öffentliche Institutionen stellen wir im Rahmen einer Organisationslizenz eine formelle Vereinbarung zur Auftragsverarbeitung (AVV) gemäß Art. 28 DSGVO bereit.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'disclaimer' && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl text-amber-950 font-medium">
                <strong>Fachliches Assistenzsystem – keine Garantenübernahme</strong>
                <p className="mt-1 text-amber-900 text-[11px]">
                  Polaris dient der Orientierung und Zeiteinsparung im Berliner Hilfesystem. Die fachliche Verantwortung und Letztentscheidung verbleibt bei der zuständigen Fachkraft.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">Kein Ersatz für behördliche Verwaltungsakte</h4>
                <p>
                  Die von Polaris erstellten Vorschläge und Stufenpläne stellen weder eine behördliche Leistungszusicherung noch einen Rechtsanspruch dar. Die Gewährung von Leistungen nach dem SGB II, SGB VIII, SGB XII oder ASOG obliegt ausschließlich den zuständigen Ämtern und Behörden.
                </p>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-1">Akute Kindeswohlgefährdung &amp; Notfälle</h4>
                <p>
                  Bei Vorliegen gewichtiger Anhaltspunkte für eine akute Kindeswohlgefährdung (§ 8a SGB VIII) oder akute Eigen- bzw. Fremdgefährdung ist unverzüglich der Kinderschutz-Notdienst, der Berliner Krisendienst oder der Notruf (110 / 112) zu kontaktieren.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'impressum' && (
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 text-sm mb-1">Angaben gemäß § 5 TMG</h4>
              <p>
                <strong>SocialWorkHub · Polaris Initiative</strong><br />
                E-Mail: contact@socialworkhub.net<br />
                Webseite: https://polaris-socialworkhub.net
              </p>
              <p className="text-[11px] text-slate-500 pt-2 border-t border-slate-200">
                Plattform zur Navigation und Triage im Berliner Sozialsystem für Fachkräfte der Sozialen Arbeit.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 bg-slate-100 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg cursor-pointer"
          >
            Schließen
          </button>
        </div>

      </div>
    </div>
  );
};
