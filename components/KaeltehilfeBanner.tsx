'use client';

import React, { useState } from 'react';
import {
  Snowflake,
  PhoneCall,
  Clock,
  ShieldAlert,
  ChevronDown,
  ChevronUp,
  Info,
  Heart,
  Dog,
  Accessibility,
} from 'lucide-react';
import { KAELTEHILFE_HOTLINES } from '@/lib/kaeltehilfe/capacityEngine';

interface KaeltehilfeBannerProps {
  onSelectTagFilter?: (tag: string) => void;
  activeTagFilter?: string | null;
}

export const KaeltehilfeBanner: React.FC<KaeltehilfeBannerProps> = ({
  onSelectTagFilter,
  activeTagFilter,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="bg-gradient-to-r from-cyan-900 via-sky-950 to-blue-950 text-white rounded-xl border border-cyan-800/80 shadow-md p-3.5 sm:p-4 mb-3.5">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300">
            <Snowflake className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold tracking-tight text-white">
                Berliner Kältehilfe & Notversorgung
              </h3>
              <span className="hidden sm:inline-block px-2 py-0.2 text-[10px] font-semibold bg-cyan-400/20 text-cyan-200 border border-cyan-400/30 rounded-full">
                Saison 2024/2025
              </span>
            </div>
            <p className="text-[11px] text-cyan-200/80">
              Notübernachtungen, Wärmestuben und akute Kältebus-Rufnummern
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-cyan-300 hover:text-white p-1 rounded-md hover:bg-cyan-900/50 transition-colors"
          title={isExpanded ? 'Kompakt anzeigen' : 'Details ausklappen'}
        >
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Expandable Section */}
      {isExpanded && (
        <div className="mt-3 pt-3 border-t border-cyan-800/60 space-y-3">
          {/* Hotline Quick Call Pills */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {KAELTEHILFE_HOTLINES.map((hotline) => (
              <a
                key={hotline.name}
                href={`tel:${hotline.phone.replace(/\s+/g, '')}`}
                className="group flex flex-col justify-between p-2.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/70 border border-cyan-800/50 hover:border-cyan-600 transition-all"
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-[11px] font-bold text-cyan-100 group-hover:text-white line-clamp-1">
                    {hotline.name}
                  </span>
                  <PhoneCall className="w-3 h-3 text-cyan-400 shrink-0 group-hover:animate-bounce" />
                </div>
                <div className="text-xs font-mono font-bold text-amber-300 group-hover:underline">
                  {hotline.phone}
                </div>
                <div className="flex items-center gap-1 text-[10px] text-cyan-300/80 mt-1">
                  <Clock className="w-2.5 h-2.5 shrink-0" />
                  <span>{hotline.hours}</span>
                </div>
              </a>
            ))}
          </div>

          {/* Frontline Instructions Note */}
          <div className="flex items-start gap-2 p-2.5 bg-cyan-950/40 rounded-lg border border-cyan-800/40 text-[11px] text-cyan-200/90 leading-relaxed">
            <Info className="w-3.5 h-3.5 text-cyan-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-white">Praxistipp für Streetwork: </span>
              Notübernachtungen haben nach 22:00 Uhr oft geschlossene Türen, nehmen im Notfall bei Erfrierungsgefahr (§ 19 ASOG) über Klingel oder Clearingstelle jedoch auf. Vermeiden Sie vorschnelle Abweisungen.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
