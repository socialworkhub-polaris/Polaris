'use client';

import React, { useState } from 'react';
import {
  Landmark,
  X,
  Search,
  Building2,
  Phone,
  Clock,
  FileText,
  MapPin,
  ExternalLink,
  Copy,
  Check,
  ShieldAlert,
  AlertCircle,
  HelpCircle,
  Navigation,
} from 'lucide-react';
import {
  resolveJurisdictionByAddress,
  DISTRICT_JURISDICTIONS,
  JurisdictionMatchResult,
  StatutoryAgency,
} from '@/lib/lor/jurisdictionEngine';
import { BerlinDistrict } from '@/types/facility';
import { getTransitDirectionsUrl } from '@/lib/geolocation';

interface JurisdictionFinderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const JurisdictionFinderModal: React.FC<JurisdictionFinderModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [addressInput, setAddressInput] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState<BerlinDistrict | 'manual'>('manual');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen) return null;

  // Resolve jurisdiction either by dropdown or query
  let result: JurisdictionMatchResult | null = null;
  if (selectedDistrict !== 'manual') {
    const data = DISTRICT_JURISDICTIONS[selectedDistrict];
    result = {
      district: selectedDistrict,
      matchedBy: 'district_name',
      query: selectedDistrict,
      jobcenter: data.jobcenter,
      jugendamtRSD: data.jugendamtRSD,
      sozialeWohnhilfe: data.sozialeWohnhilfe,
      spdi: data.spdi,
    };
  } else if (addressInput.trim()) {
    result = resolveJurisdictionByAddress(addressInput);
  }

  const handleCopyAgency = (agency: StatutoryAgency, district: string, key: string) => {
    const note = `[Polaris Behörden-Zuständigkeit (LOR)]
Behörde: ${agency.title} (${district})
Rechtskreis: ${agency.statutoryBasis}
Adresse: ${agency.address}
Notfall-Sprechzeit: ${agency.emergencyHours}
Telefon: ${agency.phone}
Notfall-Hotline: ${agency.emergencyPhone || '-'}
Praxishinweis: ${agency.internalAdvice}`;

    navigator.clipboard.writeText(note);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in-50 duration-150">
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
              <Landmark className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-tight">
                Amts- & Behördenzuständigkeit (LOR Berlin)
              </h2>
              <p className="text-xs text-blue-200/80">
                Ermittelt Jobcenter, RSD/Jugendamt, Soziale Wohnhilfe und SpDi nach Meldeadresse
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input Bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200/80 space-y-2.5 shrink-0">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="sm:col-span-2 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={addressInput}
                onChange={(e) => {
                  setAddressInput(e.target.value);
                  setSelectedDistrict('manual');
                }}
                placeholder="Berliner Straße + Hausnummer oder PLZ (z.B. Sonnenallee, 10969)..."
                className="w-full h-9 pl-9 pr-3 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <select
                value={selectedDistrict}
                onChange={(e) => {
                  setSelectedDistrict(e.target.value as BerlinDistrict | 'manual');
                  if (e.target.value !== 'manual') setAddressInput('');
                }}
                className="w-full h-9 px-2.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-blue-500"
              >
                <option value="manual">Oder Bezirk wählen...</option>
                {Object.keys(DISTRICT_JURISDICTIONS).map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {result && (
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-900 bg-blue-50 border border-blue-200/80 px-2.5 py-1.5 rounded-md">
              <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>
                Zuständiger Bezirk: <strong className="text-blue-700">{result.district}</strong>{' '}
                {result.matchedBy === 'zip' && `(gemeldet über PLZ ${result.query})`}
                {result.matchedBy === 'street' && `(gemeldet über Straße „${result.query}“)`}
                {result.matchedBy === 'locality' && `(gemeldet über Ortsteil „${result.query}“)`}
                {result.matchedBy === 'district_name' && `(Bezirksabfrage: ${result.query})`}
              </span>
            </div>
          )}
        </div>

        {/* Authorities Result Cards */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {!result ? (
            <div className="text-center py-10 space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <HelpCircle className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">
                Keine Adresse oder Bezirk eingegeben
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                Geben Sie oben die Meldeadresse des Klienten (z.B. Straße oder PLZ) ein, um die zuständigen Berliner Pflichtämter aufzurufen.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {/* 1. Jobcenter Card */}
              <AgencyCard
                agency={result.jobcenter}
                district={result.district}
                badgeColor="bg-blue-50 text-blue-700 border-blue-200"
                onCopy={() => handleCopyAgency(result!.jobcenter, result!.district, 'jobcenter')}
                isCopied={copiedKey === 'jobcenter'}
              />

              {/* 2. Jugendamt / RSD Card */}
              <AgencyCard
                agency={result.jugendamtRSD}
                district={result.district}
                badgeColor="bg-emerald-50 text-emerald-700 border-emerald-200"
                onCopy={() => handleCopyAgency(result!.jugendamtRSD, result!.district, 'rsd')}
                isCopied={copiedKey === 'rsd'}
              />

              {/* 3. Soziale Wohnhilfe Card */}
              <AgencyCard
                agency={result.sozialeWohnhilfe}
                district={result.district}
                badgeColor="bg-amber-50 text-amber-800 border-amber-200"
                onCopy={() => handleCopyAgency(result!.sozialeWohnhilfe, result!.district, 'wohnhilfe')}
                isCopied={copiedKey === 'wohnhilfe'}
              />

              {/* 4. SpDi & Krisendienst Card */}
              <AgencyCard
                agency={result.spdi}
                district={result.district}
                badgeColor="bg-purple-50 text-purple-700 border-purple-200"
                onCopy={() => handleCopyAgency(result!.spdi, result!.district, 'spdi')}
                isCopied={copiedKey === 'spdi'}
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>§ 35 SGB I konform: Keine Klientendaten gespeichert.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-semibold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};

const AgencyCard: React.FC<{
  agency: StatutoryAgency;
  district: string;
  badgeColor: string;
  onCopy: () => void;
  isCopied: boolean;
}> = ({ agency, district, badgeColor, onCopy, isCopied }) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200/90 hover:border-slate-300 p-4 shadow-2xs flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-2 mb-2">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold border ${badgeColor}`}>
            <Building2 className="w-3 h-3" />
            <span>{agency.statutoryBasis}</span>
          </span>
          <button
            type="button"
            onClick={onCopy}
            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            title="Aktenvermerk kopieren"
          >
            {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>

        <h4 className="text-sm font-bold text-slate-900 mb-1">{agency.title}</h4>
        <p className="text-xs text-slate-500 mb-2 flex items-center gap-1">
          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
          <span>{agency.address}</span>
        </p>

        {/* Emergency Hours Box */}
        <div className="p-2 bg-slate-50 rounded-lg border border-slate-200/70 mb-2 text-xs space-y-1">
          <div className="flex items-center gap-1 text-slate-800 font-semibold text-[11px]">
            <Clock className="w-3 h-3 text-blue-600 shrink-0" />
            <span>Notfall-Sprechzeit: {agency.emergencyHours}</span>
          </div>
          <div className="text-[11px] text-slate-600">
            Regulär: {agency.regularHours}
          </div>
        </div>

        {/* Internal Worker Advice */}
        <div className="p-2 bg-amber-50/60 rounded-lg border border-amber-200/50 text-[11px] text-amber-950 mb-3 leading-relaxed">
          <strong>Praxistipp: </strong>
          {agency.internalAdvice}
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
        <a
          href={`tel:${agency.phone.replace(/\s+/g, '')}`}
          className="inline-flex items-center gap-1 font-bold text-blue-600 hover:underline"
        >
          <Phone className="w-3 h-3" />
          <span>{agency.phone}</span>
        </a>

        <a
          href={getTransitDirectionsUrl(`${agency.name}, ${agency.address}`)}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-bold text-blue-900 bg-blue-100 hover:bg-blue-200 rounded border border-blue-300 transition-colors"
          title="Öffne Google Maps ÖPNV-Route ab aktuellem Standort"
        >
          <Navigation className="w-2.5 h-2.5 text-blue-700" />
          <span>ÖPNV Route</span>
          <ExternalLink className="w-2.5 h-2.5 text-blue-600" />
        </a>
      </div>
    </div>
  );
};
