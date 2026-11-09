'use client';

import React, { useState } from 'react';
import {
  X,
  Printer,
  Train,
  MapPin,
  Phone,
  Clock,
  CheckSquare,
  AlertCircle,
  FileEdit,
  Building2,
  HeartHandshake,
  Calendar,
} from 'lucide-react';
import { Facility } from '@/types/facility';

interface ClientPrintModalProps {
  facility: Facility | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ClientPrintModal: React.FC<ClientPrintModalProps> = ({
  facility,
  isOpen,
  onClose,
}) => {
  const [workerNote, setWorkerNote] = useState<string>('');
  const [checkedDocs, setCheckedDocs] = useState<Record<string, boolean>>({});

  if (!isOpen || !facility) return null;

  const isAmt = facility.institutionType === 'amt';

  const handlePrint = () => {
    window.print();
  };

  const toggleDoc = (doc: string) => {
    setCheckedDocs((prev) => ({
      ...prev,
      [doc]: !prev[doc],
    }));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto print:static print:inset-auto print:overflow-visible">
      {/* Backdrop (hidden on print) */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity print:hidden"
      />

      <div className="flex min-h-full items-center justify-center p-4 print:p-0">
        <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden print:border-none print:shadow-none print:max-w-none print:w-full print:rounded-none">
          {/* Action Bar (hidden on print) */}
          <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800 print:hidden">
            <div className="flex items-center gap-2">
              <Printer className="w-5 h-5 text-blue-400" />
              <div>
                <h3 className="text-sm font-bold text-white">Druckansicht & Klienten-Information</h3>
                <p className="text-xs text-slate-400">
                  Druckfertiges Merkblatt (DIN A4) für Klient*innen im Beratungsgespräch
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Jetzt Drucken</span>
              </button>
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Printable Sheet Canvas */}
          <div className="p-8 sm:p-10 space-y-6 text-slate-900 bg-white print:p-0 print:m-0 print:space-y-4">
            {/* Sheet Header */}
            <div className="border-b-2 border-slate-900 pb-4 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-extrabold uppercase tracking-widest text-slate-600">
                    Polaris • Klienten-Informationsblatt
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.2 bg-slate-100 border border-slate-300 rounded text-slate-700 print:border-slate-800">
                    {isAmt ? 'Öffentliche Behörde / Amt' : 'Freier Träger / Beratungsstelle'}
                  </span>
                </div>
                <h1 className="text-2xl font-black text-slate-900 leading-tight">
                  {facility.name}
                </h1>
                <p className="text-sm text-slate-600 font-medium mt-0.5">{facility.subTitle}</p>
              </div>

              <div className="text-right shrink-0">
                <span className="text-xs text-slate-500 block">Ausdruck vom:</span>
                <span className="text-xs font-bold text-slate-800">
                  {new Date().toLocaleDateString('de-DE', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>

            {/* Address & ÖPNV Box */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 print:bg-white print:border-slate-800 print:p-3">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1.5 print:text-slate-800">
                  <MapPin className="w-4 h-4 text-blue-600 print:text-black" />
                  Adresse & Anfahrt
                </h4>
                <p className="text-sm font-bold text-slate-900">{facility.address.street}</p>
                <p className="text-sm text-slate-700">{facility.address.zipCode} Berlin ({facility.district})</p>
                {facility.accessibility.wheelchair === 'voll' && (
                  <p className="text-xs text-emerald-700 font-medium mt-1">
                    ✓ Rollstuhlgerecht / Barrierefreier Eingang vorhanden
                  </p>
                )}
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1.5 print:text-slate-800">
                  <Train className="w-4 h-4 text-blue-600 print:text-black" />
                  Öffentlicher Nahverkehr (BVG / S-Bahn)
                </h4>
                <p className="text-sm font-bold text-slate-900">{facility.transit.station}</p>
                <p className="text-xs text-slate-700">
                  Linien: <span className="font-semibold">{facility.transit.lines.join(', ')}</span>
                </p>
                <p className="text-xs text-slate-600 mt-0.5">
                  Fußweg von der Station: <span className="font-medium text-slate-900">{facility.transit.walkingTime}</span>
                </p>
              </div>
            </div>

            {/* Opening Hours & Contact Box */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border border-slate-200 rounded-xl p-4 print:border-slate-800 print:p-3">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1.5 print:text-slate-800">
                  <Clock className="w-4 h-4 text-amber-600 print:text-black" />
                  Öffnungszeiten & Vorsprache
                </h4>
                <div className="space-y-1 text-xs">
                  <p>
                    <span className="font-bold text-slate-900">Offene Sprechzeit (ohne Termin):</span>
                    <br />
                    <span className="text-slate-800">{facility.openingHours.walkIn}</span>
                  </p>
                  <p className="pt-1">
                    <span className="font-bold text-slate-900">Termine:</span> {facility.openingHours.appointment}
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1 flex items-center gap-1.5 print:text-slate-800">
                  <Phone className="w-4 h-4 text-emerald-600 print:text-black" />
                  Telefon & Ansprechperson
                </h4>
                <div className="space-y-1 text-xs">
                  <p>
                    <span className="text-slate-500">Telefon Zentrale:</span>{' '}
                    <span className="text-sm font-bold text-slate-900">{facility.contact.phone}</span>
                  </p>
                  {facility.contact.emergencyPhone && (
                    <p>
                      <span className="text-red-600 font-semibold">Notfall / Akut:</span>{' '}
                      <span className="font-bold text-slate-900">{facility.contact.emergencyPhone}</span>
                    </p>
                  )}
                  <p>
                    <span className="text-slate-500">E-Mail:</span>{' '}
                    <span className="font-medium text-slate-800">{facility.contact.email}</span>
                  </p>
                  {facility.contact.intakePerson && (
                    <p className="text-slate-600">
                      Zuständigkeit: <span className="font-semibold">{facility.contact.intakePerson}</span>
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Checklist: Documents to Bring */}
            <div className="border-2 border-slate-900 rounded-xl p-5 print:p-4 bg-amber-50/20 print:bg-white">
              <h3 className="text-sm font-black uppercase tracking-wide text-slate-900 mb-2 flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-slate-900" />
                Bitte bringen Sie zu Ihrem Termin folgende Unterlagen mit:
              </h3>
              <p className="text-xs text-slate-600 mb-3 print:mb-2">
                Kreuzen Sie an, was Sie vorbereitet haben, und bringen Sie Unterlagen im Original oder als Kopie mit:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                {facility.requiredDocuments.map((doc, idx) => (
                  <label
                    key={idx}
                    className="flex items-start gap-2.5 p-2 rounded-lg border border-slate-200 bg-white print:border-slate-400 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={!!checkedDocs[doc]}
                      onChange={() => toggleDoc(doc)}
                      className="mt-0.5 w-4 h-4 rounded border-slate-400 text-blue-600 focus:ring-blue-500 print:w-4 print:h-4"
                    />
                    <span className="font-medium text-slate-800 leading-snug">{doc}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Intake Steps */}
            <div className="border border-slate-200 rounded-xl p-4 text-xs bg-slate-50 print:bg-white print:border-slate-800 print:p-3">
              <h4 className="font-bold text-slate-900 mb-1">Ablauf bei der Ankunft vor Ort:</h4>
              <p className="text-slate-700 leading-relaxed">{facility.intakeRules.procedure}</p>
            </div>

            {/* Customizable Social Worker Note */}
            <div className="border border-slate-300 rounded-xl p-4 bg-white print:border-slate-800 print:p-3 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                  <FileEdit className="w-3.5 h-3.5 text-blue-600 print:text-black" />
                  Persönliche Notiz / Vereinbarter Termin (für Klient*in):
                </h4>
                <span className="text-[11px] text-slate-400 print:hidden">Hier Freitext eingeben</span>
              </div>
              <textarea
                value={workerNote}
                onChange={(e) => setWorkerNote(e.target.value)}
                placeholder="Beispiel: Persönlicher Termin vereinbart am Donnerstag, 10:30 Uhr mit Frau Meyer (Zimmer 104). Bitte 10 Min. früher da sein."
                rows={3}
                className="w-full text-xs p-2.5 border border-slate-300 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 print:border-none print:p-0 print:text-xs print:font-medium"
              />
            </div>

            {/* Sheet Footer */}
            <div className="pt-4 border-t border-slate-200 flex items-center justify-between text-[11px] text-slate-500 print:border-slate-800">
              <p>Erstellt mit Polaris – Triage & Netzwerk für die Berliner Sozialarbeit</p>
              <p>Rechtsgrundlagen: {facility.legalBases.join(', ')}</p>
            </div>
          </div>

          {/* Modal Bottom Buttons (hidden on print) */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between print:hidden">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded-lg transition-colors cursor-pointer"
            >
              Schließen
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Drucken (DIN A4 Klienten-Zettel)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
