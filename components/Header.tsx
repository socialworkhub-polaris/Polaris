'use client';

import React from 'react';
import { Star, Building2, HeartHandshake, RefreshCw, Sparkles, FilterX } from 'lucide-react';
import UserMenu from '@/components/UserMenu';

export interface FacilityCounts {
  total: number;
  filtered: number;
  totalAmt: number;
  totalTraeger: number;
  filteredAmt: number;
  filteredTraeger: number;
}

interface HeaderProps {
  counts: FacilityCounts;
  onResetFilters: () => void;
  hasActiveFilters: boolean;
  dataSource?: 'supabase' | 'notion' | 'mock';
  onRefresh?: () => void;
  isLoading?: boolean;
  onOpenTriage?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  counts,
  onResetFilters,
  hasActiveFilters,
  dataSource = 'mock',
  onRefresh,
  isLoading = false,
  onOpenTriage,
}) => {
  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          {/* Logo & Titel */}
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 text-white rounded-xl shadow-inner flex items-center justify-center">
              <Star className="w-5 h-5 text-blue-100 fill-blue-200/40" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold tracking-tight text-white">
                  Polaris
                </h1>
                <span className="px-2 py-0.5 text-[11px] font-medium bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 rounded-full">
                  Sozialarbeit Triage
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Schnittstelle zwischen Ämtern & freien Trägern
              </p>
            </div>
          </div>

          {/* Badges, Zähler & Aktionen */}
          <div className="flex items-center flex-wrap gap-2 text-xs">
            
            {/* Status-Badge: Live vs. Demo */}
            {dataSource === 'supabase' ? (
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-950/70 text-emerald-300 border border-emerald-700/40 font-medium"
                title="Aktiv mit Supabase PostgreSQL synchronisiert"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                Live (Supabase)
              </span>
            ) : dataSource === 'notion' ? (
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-950/70 text-blue-300 border border-blue-700/40 font-medium"
                title="Aktiv mit Notion synchronisiert"
              >
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                Live (Notion)
              </span>
            ) : (
              <span
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-950/70 text-amber-300 border border-amber-700/40 font-medium"
                title="Mock-Datenmodus aktiv"
              >
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                Demo-Daten
              </span>
            )}

            {/* Treffer-Gesamtzähler */}
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800 border border-slate-700 font-medium text-slate-200">
              <span className="text-slate-400">Treffer:</span>
              <span className="font-semibold text-white">
                {counts.filtered}
              </span>
              <span className="text-slate-500">/ {counts.total}</span>
            </div>

            {/* Ämter-Zähler */}
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700/80 text-slate-300"
              title={`${counts.filteredAmt} von ${counts.totalAmt} Ämtern/Behörden`}
            >
              <Building2 className="w-3.5 h-3.5 text-blue-400" />
              <span>Ämter:</span>
              <span className="font-semibold text-blue-300">
                {counts.filteredAmt}
              </span>
            </div>

            {/* Freie Träger-Zähler */}
            <div
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700/80 text-slate-300"
              title={`${counts.filteredTraeger} von ${counts.totalTraeger} Freien Trägern/NGOs`}
            >
              <HeartHandshake className="w-3.5 h-3.5 text-emerald-400" />
              <span>Träger:</span>
              <span className="font-semibold text-emerald-300">
                {counts.filteredTraeger}
              </span>
            </div>

            {/* Filter zurücksetzen Button (erscheint nur bei aktivem Filter) */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={onResetFilters}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30 transition-colors cursor-pointer"
                title="Alle Filter zurücksetzen"
              >
                <FilterX className="w-3.5 h-3.5" />
                <span>Filter lösen</span>
              </button>
            )}

            {/* Datenbank neu laden */}
            {onRefresh && (
              <button
                type="button"
                onClick={onRefresh}
                disabled={isLoading}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
                title="Datenbank aktualisieren"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-400' : ''}`} />
              </button>
            )}

            {/* Smart Triage Button */}
            {onOpenTriage && (
              <button
                type="button"
                onClick={onOpenTriage}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-md shadow-sm transition-colors cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-200" />
                <span>Smart Triage</span>
              </button>
            )}

            {/* Benutzer-Profil */}
            <UserMenu />
          </div>

        </div>
      </div>
    </header>
  );
};