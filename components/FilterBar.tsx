'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import { FilterState, InstitutionType, AccessType, PrimaryFocus, BerlinDistrict, AgeGroup } from '@/types/facility';
import { BERLIN_DISTRICTS, PRIMARY_FOCUS_OPTIONS, AGE_GROUP_OPTIONS, COMMON_LANGUAGES } from '@/data/districts';
import { useLanguage } from '@/lib/LanguageContext';

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
}) => {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : internalExpanded;
  const { t } = useLanguage();

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
      <div className="p-3.5 sm:p-4 space-y-3">
        {/* Haupt-Suchzeile & Favoriten-Schalter */}
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

          {/* Favoriten Filter */}
          <button
            type="button"
            onClick={onToggleBookmarks}
            className={`inline-flex items-center gap-1.5 h-9 px-3 text-xs font-medium rounded-lg border transition-colors shrink-0 cursor-pointer ${
              showOnlyBookmarks
                ? 'bg-amber-50 text-amber-700 border-amber-300 font-semibold'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Bookmark className={`w-3.5 h-3.5 ${showOnlyBookmarks ? 'fill-amber-500 text-amber-500' : 'text-slate-400'}`} />
            <span className="hidden sm:inline">{t.favorites}</span>
          </button>

          {/* Kältehilfe Schnell-Filter (Saisonal) */}
          <button
            type="button"
            onClick={() => onChange({ ...filterState, kaeltehilfeOnly: !filterState.kaeltehilfeOnly })}
            className={`inline-flex items-center gap-1.5 h-9 px-3 text-xs font-semibold rounded-lg border transition-all shrink-0 cursor-pointer ${
              filterState.kaeltehilfeOnly
                ? 'bg-cyan-600 text-white border-cyan-700 shadow-sm ring-2 ring-cyan-400/30'
                : 'bg-cyan-50/80 text-cyan-800 border-cyan-200 hover:bg-cyan-100 hover:text-cyan-900'
            }`}
            title="Nur Notübernachtungen, Wärmestuben und Kältehilfe-Angebote anzeigen"
          >
            <Snowflake className={`w-3.5 h-3.5 ${filterState.kaeltehilfeOnly ? 'animate-pulse text-white' : 'text-cyan-600'}`} />
            <span>{t.coldRelief}</span>
          </button>
        </div>

        {/* Träger-Segment (Amt vs. Träger) */}
        <div className="flex bg-slate-100/90 p-0.5 rounded-lg border border-slate-200/80 text-xs font-medium">
          <button
            type="button"
            onClick={() => handleInstitutionChange('all')}
            className={`flex-1 py-1.5 px-2 rounded-md transition-all text-center cursor-pointer ${
              filterState.institutionType === 'all'
                ? 'bg-white text-slate-900 shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {t.allInstitutions}
          </button>
          <button
            type="button"
            onClick={() => handleInstitutionChange('amt')}
            className={`flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md transition-all cursor-pointer ${
              filterState.institutionType === 'amt'
                ? 'bg-blue-600 text-white shadow-xs font-semibold'
                : 'text-slate-600 hover:text-blue-700'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 shrink-0" />
            <span>{t.authoritiesTab}</span>
          </button>
          <button
            type="button"
            onClick={() => handleInstitutionChange('traeger')}
            className={`flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-md transition-all cursor-pointer ${
              filterState.institutionType === 'traeger'
                ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                : 'text-slate-600 hover:text-emerald-700'
            }`}
          >
            <HeartHandshake className="w-3.5 h-3.5 shrink-0" />
            <span>{t.agenciesTab}</span>
          </button>
        </div>

        {/* Schnellzugriff: Zugangsart & Schwerpunkte */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-xs">
          {/* Zugangsart Pill-Gruppe */}
          <div className="inline-flex bg-slate-100 p-0.5 rounded-md border border-slate-200">
            <button
              type="button"
              onClick={() => handleAccessChange('all')}
              className={`px-2 py-1 rounded text-[11px] transition-colors cursor-pointer ${
                filterState.accessType === 'all' ? 'bg-white text-slate-900 font-semibold shadow-2xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.allAccess}
            </button>
            <button
              type="button"
              onClick={() => handleAccessChange('niedrigschwellig')}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] transition-colors cursor-pointer ${
                filterState.accessType === 'niedrigschwellig'
                  ? 'bg-teal-600 text-white font-medium shadow-2xs'
                  : 'text-slate-600 hover:text-teal-700'
              }`}
            >
              <DoorOpen className="w-3 h-3" />
              <span>{t.walkIn}</span>
            </button>
            <button
              type="button"
              onClick={() => handleAccessChange('termin')}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] transition-colors cursor-pointer ${
                filterState.accessType === 'termin'
                  ? 'bg-sky-600 text-white font-medium shadow-2xs'
                  : 'text-slate-600 hover:text-sky-700'
              }`}
            >
              <Calendar className="w-3 h-3" />
              <span>{t.appointment}</span>
            </button>
            <button
              type="button"
              onClick={() => handleAccessChange('antragspflichtig')}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] transition-colors cursor-pointer ${
                filterState.accessType === 'antragspflichtig'
                  ? 'bg-indigo-600 text-white font-medium shadow-2xs'
                  : 'text-slate-600 hover:text-indigo-700'
              }`}
            >
              <FileCheck2 className="w-3 h-3" />
              <span>{t.application}</span>
            </button>
          </div>

          {/* Fachlicher Schwerpunkt Dropdown (kompakt) */}
          <div className="flex-1 min-w-[140px]">
            <select
              value={filterState.primaryFocus}
              onChange={(e) => handleFocusChange(e.target.value as 'all' | PrimaryFocus)}
              className="w-full h-7 px-2 bg-slate-50 border border-slate-200 rounded-md text-[11px] text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="all">{t.allFocus}</option>
              {PRIMARY_FOCUS_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Ausklappbarer Bereich: Erweiterte Filter */}
        {isExpanded && (
          <div className="pt-3 border-t border-slate-200/80 space-y-3 animate-in fade-in-50 duration-150">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              {/* Bezirk */}
              <div>
                <label className="block text-slate-600 font-medium mb-1 flex items-center gap-1 text-[11px]">
                  <MapPin className="w-3 h-3 text-blue-600" />
                  <span>Bezirk</span>
                </label>
                <select
                  value={filterState.district}
                  onChange={handleDistrictChange}
                  className="w-full h-8 px-2 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="all">Ganz Berlin (Alle Bezirke)</option>
                  {BERLIN_DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sprache */}
              <div>
                <label className="block text-slate-600 font-medium mb-1 flex items-center gap-1 text-[11px]">
                  <Languages className="w-3 h-3 text-blue-600" />
                  <span>Sprachangebot</span>
                </label>
                <select
                  value={filterState.language}
                  onChange={handleLanguageChange}
                  className="w-full h-8 px-2 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="all">Alle Sprachen</option>
                  {COMMON_LANGUAGES.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>

              {/* Zielgruppe / Altersgruppe */}
              <div className="sm:col-span-2">
                <label className="block text-slate-600 font-medium mb-1 flex items-center gap-1 text-[11px]">
                  <Users className="w-3 h-3 text-blue-600" />
                  <span>Zielgruppe / Alter</span>
                </label>
                <div className="flex flex-wrap gap-1">
                  {AGE_GROUP_OPTIONS.map((age) => {
                    const isSelected = filterState.ageGroups.includes(age.id as AgeGroup);
                    return (
                      <button
                        key={age.id}
                        type="button"
                        onClick={() => toggleAgeGroup(age.id as AgeGroup)}
                        className={`px-2 py-0.5 rounded text-[11px] border transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-blue-600 text-white border-blue-600 font-medium'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        {age.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Barrierefreiheit & Filter zurücksetzen */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between flex-wrap gap-2 text-xs">
              <label className="flex items-center gap-1.5 cursor-pointer select-none text-slate-600 font-medium text-[11px]">
                <input
                  type="checkbox"
                  checked={filterState.wheelchairOnly}
                  onChange={toggleWheelchair}
                  className="w-3.5 h-3.5 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                />
                <Accessibility className="w-3.5 h-3.5 text-slate-500" />
                <span>Nur rollstuhlgerecht</span>
              </label>

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={onReset}
                  className="text-[11px] text-amber-700 hover:text-amber-800 font-medium underline underline-offset-2 cursor-pointer"
                >
                  Filter zurücksetzen
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};