'use client';

import React, { useState, useMemo } from 'react';
import {
  Search,
  Bookmark,
  X,
  Building2,
  HeartHandshake,
  DoorOpen,
  FileCheck2,
  MapPin,
  Accessibility,
  Languages,
  Users,
  Calendar,
  Snowflake,
  Navigation,
  Loader2,
  ChevronDown,
  SlidersHorizontal,
  RotateCcw,
} from 'lucide-react';
import { FilterState, InstitutionType, AccessType, PrimaryFocus, BerlinDistrict, AgeGroup } from '@/types/facility';
import { BERLIN_DISTRICTS, PRIMARY_FOCUS_OPTIONS, AGE_GROUP_OPTIONS, COMMON_LANGUAGES } from '@/data/districts';
import { useLanguage } from '@/lib/LanguageContext';

export const isKaeltehilfeSeason = (): boolean => {
  // Berliner Kältehilfe läuft offiziell vom 1. Oktober bis zum 30. April
  const month = new Date().getMonth(); // 0 = Jan, 3 = Apr, 9 = Okt, 11 = Dez
  return month >= 9 || month <= 3;
};

interface FilterBarProps {
  filterState: FilterState;
  onChange: (newState: FilterState) => void;
  onReset: () => void;
  hasActiveFilters: boolean;
  totalResults: number;
  showOnlyBookmarks?: boolean;
  onToggleBookmarks?: () => void;
  isExpanded?: boolean;
  onToggleExpanded?: () => void;
  userLocation?: [number, number] | null;
  onToggleNearby?: () => void;
  isLocating?: boolean;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filterState,
  onChange,
  onReset,
  hasActiveFilters,
  totalResults,
  showOnlyBookmarks = false,
  onToggleBookmarks,
  isExpanded: controlledExpanded,
  onToggleExpanded,
  userLocation,
  onToggleNearby,
  isLocating = false,
}) => {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;
  const toggleExpanded = onToggleExpanded || (() => setInternalExpanded(!internalExpanded));

  const { t } = useLanguage();
  const isSeasonalKaeltehilfe = isKaeltehilfeSeason();

  // Zähle aktive Filter im erweiterten Bereich
  const activeAdvancedCount = useMemo(() => {
    let count = 0;
    if (filterState.institutionType !== 'all') count++;
    if (filterState.language !== 'all') count++;
    if (filterState.ageGroups.length > 0) count++;
    if (filterState.wheelchairOnly) count++;
    if (filterState.accessType === 'termin' || filterState.accessType === 'antragspflichtig') count++;
    if (!isSeasonalKaeltehilfe && filterState.kaeltehilfeOnly) count++;
    return count;
  }, [filterState, isSeasonalKaeltehilfe]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange({ ...filterState, searchQuery: e.target.value });
  };

  const handleInstitutionChange = (val: 'all' | InstitutionType) => {
    onChange({ ...filterState, institutionType: val });
  };

  const handleAccessChange = (val: 'all' | AccessType) => {
    onChange({ ...filterState, accessType: val });
  };

  const handleFocusChange = (val: 'all' | PrimaryFocus) => {
    onChange({ ...filterState, primaryFocus: val });
  };

  const handleDistrictChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...filterState, district: e.target.value as 'all' | BerlinDistrict });
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange({ ...filterState, language: e.target.value });
  };

  const toggleAgeGroup = (group: AgeGroup) => {
    const current = filterState.ageGroups;
    if (current.includes(group)) {
      onChange({ ...filterState, ageGroups: current.filter((g) => g !== group) });
    } else {
      onChange({ ...filterState, ageGroups: [...current, group] });
    }
  };

  const toggleWheelchair = () => {
    onChange({ ...filterState, wheelchairOnly: !filterState.wheelchairOnly });
  };

  return (
    <div className="bg-white border-b border-slate-200">
      <div className="p-3 sm:p-3.5 space-y-2.5">
        {/* Zeile 1: Freitextsuche + GPS-Nähe + Favoriten */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={filterState.searchQuery}
              onChange={handleSearchChange}
              placeholder={t.searchPlaceholder}
              className="w-full h-9 pl-9 pr-8 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
            />
            {filterState.searchQuery && (
              <button
                type="button"
                onClick={() => onChange({ ...filterState, searchQuery: '' })}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                title="Suchfeld leeren"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* GPS / In meiner Nähe Button */}
          {onToggleNearby && (
            <button
              type="button"
              onClick={onToggleNearby}
              disabled={isLocating}
              className={`inline-flex items-center gap-1.5 h-9 px-3 text-xs font-semibold rounded-lg border transition-all shrink-0 cursor-pointer disabled:opacity-60 ${
                userLocation
                  ? 'bg-blue-600 text-white border-blue-700 shadow-xs ring-2 ring-blue-400/30'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
              }`}
              title={
                userLocation
                  ? 'Standort-Sortierung aktiv (Klicken zum Deaktivieren)'
                  : 'Aktuellen Standort ermitteln & Einrichtungen nach Entfernung sortieren'
              }
            >
              {isLocating ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
              ) : (
                <Navigation className={`w-3.5 h-3.5 ${userLocation ? 'fill-white text-white' : 'text-blue-600'}`} />
              )}
              <span className="hidden sm:inline">
                {isLocating ? 'Lokalisiere...' : userLocation ? 'In der Nähe (Aktiv)' : 'In der Nähe'}
              </span>
            </button>
          )}

          {/* Favoriten Filter */}
          {onToggleBookmarks && (
            <button
              type="button"
              onClick={onToggleBookmarks}
              className={`inline-flex items-center gap-1.5 h-9 px-3 text-xs font-medium rounded-lg border transition-all shrink-0 cursor-pointer ${
                showOnlyBookmarks
                  ? 'bg-amber-500 text-white border-amber-600 shadow-xs font-semibold'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
              }`}
              title={showOnlyBookmarks ? 'Alle Einrichtungen anzeigen' : 'Nur gemerkte Favoriten anzeigen'}
            >
              <Bookmark className={`w-3.5 h-3.5 ${showOnlyBookmarks ? 'fill-white text-white' : 'text-amber-500'}`} />
              <span className="hidden sm:inline">{t.favorites}</span>
            </button>
          )}
        </div>

        {/* Zeile 2: Smart Filter-Leiste (Bezirk, Schwerpunkt, Walk-In, Kältehilfe, Mehr Filter) */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
          {/* Bezirk-Filter (Direkt verbunden mit der Karte) */}
          <div className="relative min-w-[130px] sm:min-w-[155px] flex-1 sm:flex-initial">
            <MapPin className="w-3.5 h-3.5 text-blue-600 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <select
              value={filterState.district}
              onChange={handleDistrictChange}
              className={`w-full h-8 pl-7 sm:pl-8 pr-6 text-xs rounded-lg border appearance-none font-medium cursor-pointer transition-all ${
                filterState.district !== 'all'
                  ? 'bg-blue-50 text-blue-900 border-blue-300 font-semibold shadow-xs ring-1 ring-blue-400/20'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-white'
              }`}
              title="Bezirk auswählen – zentriert & markiert den Bezirk automatisch auf der Karte"
            >
              <option value="all">📍 Ganz Berlin</option>
              {BERLIN_DISTRICTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Fachlicher Schwerpunkt */}
          <div className="relative min-w-[140px] sm:min-w-[170px] flex-1 sm:flex-initial">
            <select
              value={filterState.primaryFocus}
              onChange={(e) => handleFocusChange(e.target.value as 'all' | PrimaryFocus)}
              className={`w-full h-8 px-2.5 pr-6 text-xs rounded-lg border appearance-none font-medium cursor-pointer transition-all ${
                filterState.primaryFocus !== 'all'
                  ? 'bg-indigo-50 text-indigo-900 border-indigo-300 font-semibold shadow-xs ring-1 ring-indigo-400/20'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-white'
              }`}
            >
              <option value="all">{t.allFocus}</option>
              {PRIMARY_FOCUS_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3 h-3 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Schnelltaste: Sofort / Ohne Termin (Walk-In) */}
          <button
            type="button"
            onClick={() => handleAccessChange(filterState.accessType === 'niedrigschwellig' ? 'all' : 'niedrigschwellig')}
            className={`inline-flex items-center gap-1.5 h-8 px-2.5 text-xs rounded-lg border transition-all cursor-pointer shrink-0 ${
              filterState.accessType === 'niedrigschwellig'
                ? 'bg-teal-600 text-white border-teal-700 shadow-xs font-semibold'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-white hover:text-slate-900'
            }`}
            title="Nur Einrichtungen mit offener Sprechstunde / ohne vorherigen Termin (Walk-In) anzeigen"
          >
            <DoorOpen className={`w-3.5 h-3.5 ${filterState.accessType === 'niedrigschwellig' ? 'text-white' : 'text-teal-600'}`} />
            <span>Ohne Termin</span>
          </button>

          {/* Dynamischer Kältehilfe Button (Saisonal: Okt–Apr) */}
          {(isSeasonalKaeltehilfe || filterState.kaeltehilfeOnly) && (
            <button
              type="button"
              onClick={() => onChange({ ...filterState, kaeltehilfeOnly: !filterState.kaeltehilfeOnly })}
              className={`inline-flex items-center gap-1.5 h-8 px-2.5 text-xs font-semibold rounded-lg border transition-all shrink-0 cursor-pointer ${
                filterState.kaeltehilfeOnly
                  ? 'bg-cyan-600 text-white border-cyan-700 shadow-xs ring-2 ring-cyan-400/30'
                  : 'bg-cyan-50/90 text-cyan-800 border-cyan-200 hover:bg-cyan-100 hover:text-cyan-900'
              }`}
              title="Berliner Kältehilfe: Notübernachtungen, Wärmestuben und Nachtcafés"
            >
              <Snowflake className={`w-3.5 h-3.5 ${filterState.kaeltehilfeOnly ? 'animate-pulse text-white' : 'text-cyan-600'}`} />
              <span>Kältehilfe</span>
            </button>
          )}

          {/* Erweiterte Filter Button */}
          <button
            type="button"
            onClick={toggleExpanded}
            className={`inline-flex items-center gap-1.5 h-8 px-2.5 text-xs font-medium rounded-lg border transition-all cursor-pointer ml-auto shrink-0 ${
              isExpanded || activeAdvancedCount > 0
                ? 'bg-slate-800 text-white border-slate-900 shadow-xs font-semibold'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-white hover:text-slate-900'
            }`}
            title="Weitere Filter öffnen: Trägerform (Ämter/Träger), Sprache, Alter, Barrierefreiheit"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filter</span>
            {activeAdvancedCount > 0 && (
              <span className="inline-flex items-center justify-center min-w-4 h-4 px-1 text-[10px] font-bold text-slate-900 bg-amber-400 rounded-full">
                {activeAdvancedCount}
              </span>
            )}
            <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180 text-white' : ''}`} />
          </button>
        </div>

        {/* Ausklappbarer Bereich: Erweiterte Filter */}
        {isExpanded && (
          <div className="pt-3 border-t border-slate-200/90 space-y-3 animate-in fade-in-50 duration-150">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
              {/* 1. Trägerform (aus der Hauptleiste hierher verlegt) */}
              <div>
                <label className="block text-slate-600 font-semibold mb-1.5 text-[11px]">
                  Trägerform
                </label>
                <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
                  <button
                    type="button"
                    onClick={() => handleInstitutionChange('all')}
                    className={`py-1 px-1.5 rounded transition-all text-center cursor-pointer ${
                      filterState.institutionType === 'all'
                        ? 'bg-white text-slate-900 shadow-xs font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Alle
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInstitutionChange('amt')}
                    className={`inline-flex items-center justify-center gap-1 py-1 px-1.5 rounded transition-all cursor-pointer ${
                      filterState.institutionType === 'amt'
                        ? 'bg-blue-600 text-white shadow-xs font-semibold'
                        : 'text-slate-600 hover:text-blue-700'
                    }`}
                  >
                    <Building2 className="w-3 h-3 shrink-0" />
                    <span>Ämter</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInstitutionChange('traeger')}
                    className={`inline-flex items-center justify-center gap-1 py-1 px-1.5 rounded transition-all cursor-pointer ${
                      filterState.institutionType === 'traeger'
                        ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                        : 'text-slate-600 hover:text-emerald-700'
                    }`}
                  >
                    <HeartHandshake className="w-3 h-3 shrink-0" />
                    <span>Träger</span>
                  </button>
                </div>
              </div>

              {/* 2. Zugangsform Details (Termin vs. Antrag) */}
              <div>
                <label className="block text-slate-600 font-semibold mb-1.5 text-[11px]">
                  Zugangsform
                </label>
                <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs">
                  <button
                    type="button"
                    onClick={() => handleAccessChange('all')}
                    className={`py-1 px-1.5 rounded transition-all text-center cursor-pointer ${
                      filterState.accessType === 'all'
                        ? 'bg-white text-slate-900 shadow-xs font-semibold'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Alle
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAccessChange('termin')}
                    className={`inline-flex items-center justify-center gap-1 py-1 px-1.5 rounded transition-all cursor-pointer ${
                      filterState.accessType === 'termin'
                        ? 'bg-sky-600 text-white shadow-xs font-semibold'
                        : 'text-slate-600 hover:text-sky-700'
                    }`}
                  >
                    <Calendar className="w-3 h-3 shrink-0" />
                    <span>Termin</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAccessChange('antragspflichtig')}
                    className={`inline-flex items-center justify-center gap-1 py-1 px-1.5 rounded transition-all cursor-pointer ${
                      filterState.accessType === 'antragspflichtig'
                        ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                        : 'text-slate-600 hover:text-indigo-700'
                    }`}
                  >
                    <FileCheck2 className="w-3 h-3 shrink-0" />
                    <span>Antrag</span>
                  </button>
                </div>
              </div>

              {/* 3. Sprachangebot */}
              <div>
                <label className="block text-slate-600 font-semibold mb-1.5 flex items-center gap-1 text-[11px]">
                  <Languages className="w-3 h-3 text-slate-500" />
                  <span>Sprachangebot</span>
                </label>
                <select
                  value={filterState.language}
                  onChange={handleLanguageChange}
                  className="w-full h-8 px-2 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="all">Alle Beratungssprachen</option>
                  {COMMON_LANGUAGES.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. Zielgruppe / Altersgruppe */}
              <div className="sm:col-span-2">
                <label className="block text-slate-600 font-semibold mb-1.5 flex items-center gap-1 text-[11px]">
                  <Users className="w-3 h-3 text-slate-500" />
                  <span>Zielgruppe / Alter</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {AGE_GROUP_OPTIONS.map((age) => {
                    const isSelected = filterState.ageGroups.includes(age.id as AgeGroup);
                    return (
                      <button
                        key={age.id}
                        type="button"
                        onClick={() => toggleAgeGroup(age.id as AgeGroup)}
                        className={`px-2.5 py-1 rounded-md text-xs border transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 font-medium shadow-2xs'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        {age.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Außerhalb der Saison: Kältehilfe hier ansteuerbar */}
              {!isSeasonalKaeltehilfe && (
                <div>
                  <label className="block text-slate-600 font-semibold mb-1.5 flex items-center gap-1 text-[11px]">
                    <Snowflake className="w-3 h-3 text-cyan-600" />
                    <span>Kältehilfe & Notversorgung</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => onChange({ ...filterState, kaeltehilfeOnly: !filterState.kaeltehilfeOnly })}
                    className={`w-full h-8 px-2.5 text-xs rounded-md border transition-all text-left flex items-center justify-between cursor-pointer ${
                      filterState.kaeltehilfeOnly
                        ? 'bg-cyan-600 text-white border-cyan-700 font-semibold'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>Nur Kältehilfe / Notübernachtung</span>
                    <Snowflake className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Barrierefreiheit & Filter zurücksetzen */}
            <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700 font-medium text-xs">
                <input
                  type="checkbox"
                  checked={filterState.wheelchairOnly}
                  onChange={toggleWheelchair}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
                <Accessibility className="w-3.5 h-3.5 text-slate-500" />
                <span>Nur rollstuhlgerecht</span>
              </label>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={onReset}
                  className="inline-flex items-center gap-1 text-xs text-amber-700 hover:text-amber-800 font-medium underline underline-offset-2 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Alle Filter zurücksetzen</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
