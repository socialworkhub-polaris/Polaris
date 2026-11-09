'use client';

import React, { useState } from 'react';
import { X, CheckCircle2, ShieldCheck, FileText, Mail, Printer, Building2, Users, ArrowRight } from 'lucide-react';

interface LicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function LicenseModal({ isOpen, onClose }: LicenseModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const mailSubject = encodeURIComponent('Anfrage Team-Lizenz Polaris (10 Plätze)');
  const mailBody = encodeURIComponent(
`Sehr geehrtes SocialWorkHub-Team,

wir möchten für unser Team ein Angebot bzw. eine Rechnung für die Polaris Team-Lizenz anfordern:

Träger / Organisation: 
Einrichtung / Fachbereich: 
Ansprechpartner*in: 
Telefon: 
Rechnungsadresse: 
Gewünschter Lizenzbeginn: 
Anzahl Team-Pakete (je 10 Zugänge für 89 €/Monat netto): 

Mit freundlichen Grüßen,
`
  );

  const mailtoLink = `mailto:kontakt@socialworkhub.net?subject=${mailSubject}&body=${mailBody}`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                Team-Lizenz für freie & öffentliche Träger
              </h2>
              <p className="text-xs text-slate-400">
                Arbeitsplatzausstattung für Beratungsstellen, Jugendhilfe und Krisendienste
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

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-300 text-sm">
          
          {/* Pricing Box */}
          <div className="p-5 rounded-xl bg-gradient-to-br from-slate-800/90 to-slate-800/40 border border-slate-700/80">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-700/60">
              <div>
                <span className="text-xs uppercase tracking-wider font-semibold text-emerald-400">
                  Standard Träger-Paket
                </span>
                <div className="text-2xl font-black text-white mt-0.5">
                  89 € <span className="text-sm font-normal text-slate-400">/ Monat (zzgl. USt.)</span>
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Rechnungskauf nach § 14 UStG mit 30 Tagen Zahlungsziel • Monatlich kündbar
                </div>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold">
                <Users className="w-4 h-4" />
                <span>10 Fachkraft-Zugänge inklusive</span>
              </div>
            </div>

            {/* Included Value Points */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-4 text-xs">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>DSGVO-Auftragsverarbeitung (AVV nach Art. 28)</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Garantierte Zero-PII Triage (§ 203 StGB / SGB X)</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Offline-Fähigkeit für Streetwork & Außendienst</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Prioritärer Berliner Behörden- & Adress-Support</span>
              </div>
            </div>
          </div>

          {/* Individual Caseworker Note */}
          <div className="flex items-start gap-3 p-3.5 rounded-lg bg-blue-950/30 border border-blue-800/40 text-xs text-blue-200">
            <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div>
              <strong className="text-white block mb-0.5">Hinweis für einzelne Sozialarbeiter*innen:</strong>
              Die Grundfunktionen von Polaris (Einrichtungs-Recherche, Basistriage, Offline-Hotlines) sind für einzelne Fachkräfte in der Praxis kostenfrei nutzbar. Das Team-Paket richtet sich an Träger zur offiziellen institutionellen Lizenzierung.
            </div>
          </div>

          {/* Action Area */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Lizenzierung starten oder einreichen
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Mail to order */}
              <a
                href={mailtoLink}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg shadow-md transition-colors text-xs text-center"
              >
                <Mail className="w-4 h-4" />
                <span>Angebot / Rechnung anfordern</span>
              </a>

              {/* Print procurement brief */}
              <button
                type="button"
                onClick={handlePrint}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-semibold rounded-lg border border-slate-700 transition-colors text-xs text-center"
              >
                <Printer className="w-4 h-4 text-blue-400" />
                <span>Beschaffungsantrag (PDF / Druck)</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-500 text-center">
              Rechnungsstellung erfolgt über SocialWorkHub Berlin. Bezahlung bequem per SEPA-Überweisung.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-900 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
          >
            Schließen
          </button>
        </div>

      </div>
    </div>
  );
}
