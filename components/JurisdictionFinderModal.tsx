'use client';

import React, { useState, useRef, useEffect, useMemo } from 'react';
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
import { searchBerlinStreets, StreetSuggestion } from '@/lib/lor/streetIndex';

interface JurisdictionFinderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const JurisdictionFinderModal: React.FC<JurisdictionFinderModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [addressInput, setAddressInput] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState<BerlinDistrict | 'manual'>('manual');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Autocomplete dropdown state
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputContainerRef = useRef<HTMLDivElement>(null);

  // Debounce user keystrokes (200ms) to prevent UI jitter/snapping while typing
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(addressInput.trim());
    }, 200);
    return () => clearTimeout(handler);
  }, [addressInput]);

  // Real-time suggestions from the curated Berlin street & locality index
  const suggestions = useMemo(() => {
    const trimmed = addressInput.trim();
    if (trimmed.length < 2) return [];
    return searchBerlinStreets(trimmed, 8);
  }, [addressInput]);

  // Click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        inputContainerRef.current &&
        !inputContainerRef.current.contains(e.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isOpen) return null;

  // Resolve jurisdiction: priority to manual district dropdown, then debounced address query
  const result: JurisdictionMatchResult | null = (() => {
    if (selectedDistrict !== 'manual') {
      const data = DISTRICT_JURISDICTIONS[selectedDistrict];
      return {
        district: selectedDistrict,
        matchedBy: 'district_name',
        query: selectedDistrict,
        jobcenter: data.jobcenter,
        jugendamtRSD: data.jugendamtRSD,
        sozialeWohnhilfe: data.sozialeWohnhilfe,
        spdi: data.spdi,
      };
    }

    if (!debouncedQuery) return null;

    // 1. Exact match via address resolver (PLZ, direct street, locality)
    const directMatch = resolveJurisdictionByAddress(debouncedQuery);
    if (directMatch) return directMatch;

    // 2. Intelligent prefix fallback: If user typed 3+ chars, check if top suggestion is a match
    if (debouncedQuery.length >= 3) {
      const topStreets = searchBerlinStreets(debouncedQuery, 1);
      if (topStreets.length > 0) {
        const top = topStreets[0];
        const data = DISTRICT_JURISDICTIONS[top.district];
        return {
          district: top.district,
          matchedBy: 'street',
          query: top.name,
          jobcenter: data.jobcenter,
          jugendamtRSD: data.jugendamtRSD,
          sozialeWohnhilfe: data.sozialeWohnhilfe,
          spdi: data.spdi,
        };
      }
    }

    return null;
  })();

  const handleSelectSuggestion = (suggestion: StreetSuggestion) => {
    setAddressInput(suggestion.name);
    setDebouncedQuery(suggestion.name);
    setSelectedDistrict('manual');
    setIsDropdownOpen(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isDropdownOpen || suggestions.length === 0) {
      if (e.key === 'ArrowDown' && suggestions.length > 0) {
        setIsDropdownOpen(true);
        setHighlightedIndex(0);
        e.preventDefault();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
    } else if (e.key === 'Enter') {
      if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
        e.preventDefault();
        handleSelectSuggestion(suggestions[highlightedIndex]);
      } else if (suggestions.length > 0) {
        e.preventDefault();
        handleSelectSuggestion(suggestions[0]);
      }
    } else if (e.key === 'Escape') {
      setIsDropdownOpen(false);
      setHighlightedIndex(-1);
    }
  };

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
                Amts- &amp; Behördenzuständigkeit (LOR Berlin)
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
            <div ref={inputContainerRef} className="sm:col-span-2 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={addressInput}
                onFocus={() => {
                  if (suggestions.length > 0) setIsDropdownOpen(true);
                }}
                onChange={(e) => {
                  setAddressInput(e.target.value);
                  setSelectedDistrict('manual');
                  setIsDropdownOpen(true);
                  setHighlightedIndex(-1);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Berliner Straße + Hausnummer oder PLZ (z.B. Sonnenallee, 10969)..."
                className="w-full h-9 pl-9 pr-8 text-xs sm:text-sm bg-white border border-slate-200 rounded-lg placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-colors"
                autoComplete="off"
                spellCheck="false"
              />
              {addressInput && (
                <button
                  type="button"
                  onClick={() => {
                    setAddressInput('');
                    setDebouncedQuery('');
                    setIsDropdownOpen(false);
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                  title="Eingabe löschen"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Floating Autocomplete Dropdown */}
              {isDropdownOpen && suggestions.length > 0 && (
                <div
                  ref={dropdownRef}
                  className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden py-1 max-h-64 overflow-y-auto animate-in fade-in slide-in-from-top-1 duration-150"
                >
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100 flex items-center justify-between">
                    <span>Straßen- &amp; Ortsteil-Vorschläge</span>
                    <span>↑↓ Navigieren • ↵ Wählen</span>
                  </div>
                  {suggestions.map((s, index) => {
                    const isSelected = highlightedIndex === index;
                    return (
                      <button
                        key={`${s.name}-${s.district}-${index}`}
                        type="button"
                        onClick={() => handleSelectSuggestion(s)}
                        onMouseEnter={() => setHighlightedIndex(index)}
                        className={`w-full px-3 py-2 text-left flex items-center justify-between gap-2 text-xs transition-colors cursor-pointer ${
                          isSelected ? 'bg-blue-50 text-blue-900 font-semibold' : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center gap-2 truncate">
                          <MapPin className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                          <span className="truncate">{s.name}</span>
                          {s.subtitle && (
                            <span className="text-[10px] text-slate-400 font-normal">
                              ({s.subtitle})
                            </span>
                          )}
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border shrink-0 ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}>
                          {s.district}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div>
              <select
                value={selectedDistrict}
                onChange={(e) => {
                  setSelectedDistrict(e.target.value as BerlinDistrict | 'manual');
                  if (e.target.value !== 'manual') {
                    setAddressInput('');
                    setDebouncedQuery('');
                    setIsDropdownOpen(false);
                  }
                }}
                className="w-full h-9 px-2.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700 focus:outline-none focus:border-blue-500 cursor-pointer"
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
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-900 bg-blue-50 border border-blue-200/80 px-2.5 py-1.5 rounded-md animate-in fade-in duration-150">
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
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1 transition-all duration-200 ease-out">
          {!result ? (
            <div className="text-center py-10 space-y-3 animate-in fade-in duration-200">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <HelpCircle className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">
                {addressInput.trim().length > 0 && addressInput.trim().length < 3
                  ? 'Weiter tippen für automatische Erkennung...'
                  : addressInput.trim().length >= 3
                  ? 'Keine Berliner Behörde für diese Eingabe gefunden'
                  : 'Keine Adresse oder Bezirk eingegeben'}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                {addressInput.trim().length >= 3
                  ? 'Wählen Sie einen der Vorschläge aus dem Dropdown-Menü oder wählen Sie rechts den Bezirk manuell aus.'
                  : 'Geben Sie oben die Meldeadresse des Klienten (z.B. Straße oder PLZ) ein, um die zuständigen Berliner Pflichtämter aufzurufen.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 animate-in fade-in duration-200">
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
          href={getTransitDirectionsUrl(agency.address)}
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
