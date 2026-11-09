'use client';

import React, { useState } from 'react';
import { Facility } from '@/types/facility';
import { FacilityCard } from './FacilityCard';
import { SearchX, ArrowUpDown, Filter, ChevronDown, ChevronUp, Globe, ExternalLink, Loader2 } from 'lucide-react';

interface ExaResult {
  title: string;
  url: string;
  text?: string;
}

interface FacilityListProps {
  facilities: Facility[];
  selectedFacility: Facility | null;
  onSelectFacility: (facility: Facility) => void;
  onOpenDetails: (facility: Facility) => void;
  onOpenPrint: (facility: Facility) => void;
  onResetFilters: () => void;
  isExpanded?: boolean;
  onToggleExpanded?: () => void;
  hasActiveAdvancedFilters?: boolean;
  searchQuery?: string;
}

export const FacilityList: React.FC<FacilityListProps> = ({
  facilities,
  selectedFacility,
  onSelectFacility,
  onOpenDetails,
  onOpenPrint,
  onResetFilters,
  isExpanded = false,
  onToggleExpanded,
  hasActiveAdvancedFilters = false,
  searchQuery = '',
}) => {
  const [sortBy, setSortBy] = useState<'default' | 'name' | 'district'>('default');
  const [exaLoading, setExaLoading] = useState(false);
  const [exaResults, setExaResults] = useState<ExaResult[]>([]);
  const [exaError, setExaError] = useState<string | null>(null);

  const sortedFacilities = [...facilities].sort((a, b) => {
    if (sortBy === 'name') {
      return a.name.localeCompare(b.name, 'de');
    }
    if (sortBy === 'district') {
      return a.district.localeCompare(b.district, 'de');
    }
    return 0;
  });

  const handleExaFallbackSearch = async () => {
    if (!searchQuery) return;
    try {
      setExaLoading(true);
      setExaError(null);

      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: searchQuery }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Fehler bei der Exa-Recherche');
      setExaResults(data.results || []);
    } catch (err: any) {
      setExaError(err.message || 'Exa-Recherche fehlgeschlagen');
    } finally {
      setExaLoading(false);
    }
  };

  return (
    <div className="flex flex-col">
      {/* Sub-Header mit Filter & Sortierung */}
      <div className="flex items-center justify-between flex-wrap gap-2 px-4 py-2 bg-slate-50 border-b border-slate-200 text-xs text-slate-600">
        <div className="flex items-center gap-2">
          {onToggleExpanded && (
            <button
              type="button"
              onClick={onToggleExpanded}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border transition-colors cursor-pointer ${
                isExpanded
                  ? 'bg-blue-50 text-blue-700 border-blue-300 font-semibold'
                  : hasActiveAdvancedFilters
                  ? 'bg-blue-50 text-blue-700 border-blue-200 font-medium'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Filter className={`w-3 h-3 ${isExpanded || hasActiveAdvancedFilters ? 'text-blue-600' : 'text-slate-500'}`} />
              <span>Erweiterte Filter</span>
              {hasActiveAdvancedFilters && (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
              )}
              {isExpanded ? (
                <ChevronUp className="w-3 h-3 text-slate-400" />
              ) : (
                <ChevronDown className="w-3 h-3 text-slate-400" />
              )}
            </button>
          )}

          {facilities.length > 0 && (
            <>
              {onToggleExpanded && <span className="h-3.5 w-px bg-slate-300 hidden sm:inline-block" aria-hidden="true" />}
              <div className="flex items-center gap-1.5">
                <ArrowUpDown className="w-3 h-3 text-slate-400" />
                <span className="text-slate-500">Sortierung:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'default' | 'name' | 'district')}
                  className="bg-white border border-slate-200 rounded-md px-2 py-1 text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer shadow-xs"
                >
                  <option value="default">Standard (Relevanz)</option>
                  <option value="name">Name (A–Z)</option>
                  <option value="district">Bezirk (A–Z)</option>
                </select>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Natürlicher Karten-Flow */}
      <div className="p-4 space-y-3.5">
        {sortedFacilities.length === 0 ? (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-dashed border-slate-300 p-6 sm:p-8 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <SearchX className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">Keine lokalen Einrichtungen in Notion gefunden</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {searchQuery
                  ? `In den hinterlegten 120 Einrichtungen gibt es keinen Treffer für „${searchQuery}“.`
                  : 'Für die gewählten Filterkriterien gibt es aktuell keinen Eintrag.'}
              </p>

              <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                {searchQuery && (
                  <button
                    type="button"
                    onClick={handleExaFallbackSearch}
                    disabled={exaLoading}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {exaLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Globe className="w-3.5 h-3.5" />
                    )}
                    <span>Im Berliner Web suchen (Exa)</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={onResetFilters}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                >
                  Filter zurücksetzen
                </button>
              </div>
            </div>

            {/* Exa Fallback Ergebnisse */}
            {(exaLoading || exaResults.length > 0 || exaError) && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-blue-600" />
                  <h5 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Gefundene Web-Ergebnisse für „{searchQuery}“:
                  </h5>
                </div>

                {exaLoading && (
                  <div className="flex items-center gap-2 text-xs text-slate-500 py-3">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    <span>Exa durchsucht aktuelle Berliner Hilfsangebote...</span>
                  </div>
                )}

                {exaError && (
                  <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">
                    {exaError}
                  </p>
                )}

                {exaResults.length > 0 && (
                  <div className="grid grid-cols-1 gap-2.5">
                    {exaResults.map((item, i) => (
                      <a
                        key={i}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group p-3 bg-white rounded-lg border border-slate-200 hover:border-blue-400 hover:shadow-xs transition-all block"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900 group-hover:text-blue-600 line-clamp-1">
                            {item.title}
                          </span>
                          <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 shrink-0 ml-1" />
                        </div>
                        {item.text && (
                          <p className="text-[11px] text-slate-600 line-clamp-2 mt-1 leading-relaxed">
                            {item.text}
                          </p>
                        )}
                        <span className="text-[10px] text-slate-400 mt-1.5 block truncate">
                          {item.url}
                        </span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          sortedFacilities.map((facility) => (
            <FacilityCard
              key={facility.id}
              facility={facility}
              isSelected={selectedFacility?.id === facility.id}
              onSelect={onSelectFacility}
              onOpenDetails={onOpenDetails}
              onOpenPrint={onOpenPrint}
            />
          ))
        )}
      </div>
    </div>
  );
};