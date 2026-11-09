'use client';

import { useState } from 'react';
import { Phone, ChevronDown, ChevronUp, ShieldAlert, HeartHandshake, Snowflake } from 'lucide-react';

interface Hotline {
  name: string;
  number: string;
  label: string;
  hours: string;
  badge?: string;
  icon: typeof ShieldAlert;
}

const HOTLINES: Hotline[] = [
  {
    name: 'Kinderschutz-Hotline',
    number: '030 61 00 66',
    label: 'Kindeswohlgefährdung (24/7)',
    hours: 'Rund um die Uhr',
    icon: ShieldAlert,
  },
  {
    name: 'Berliner Krisendienst',
    number: '030 390 63 10',
    label: 'Psychiatrische & seelische Krisen',
    hours: '24/7 Bereitschaft',
    icon: HeartHandshake,
  },
  {
    name: 'BIG Hotline',
    number: '030 611 03 00',
    label: 'Häusliche Gewalt gegen Frauen',
    hours: 'Täglich 08:00 – 23:00',
    icon: ShieldAlert,
  },
  {
    name: 'Kältehilfetelefon',
    number: '01578 66 40 037',
    label: 'Obdachlosigkeit & Notübernachtung',
    hours: '19:00 – 23:00 (Saison)',
    badge: 'Winter',
    icon: Snowflake,
  },
  {
    name: 'Drogennotdienst',
    number: '030 19237',
    label: 'Sucht- & Intoxikationsnotfälle',
    hours: '24/7 Notruf',
    icon: Phone,
  },
];

export default function EmergencyBar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-700 shadow-2xl transition-all">
      {/* Drawer Toggle Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold text-slate-200 hover:text-white transition-colors"
        aria-label="Notfall-Hotlines für Streetwork"
      >
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
          </span>
          <span className="uppercase tracking-wider font-bold text-slate-100">
            Streetwork Notfall-Hotlines (Berlin)
          </span>
        </div>
        <div className="flex items-center gap-1 text-slate-400">
          <span>{isOpen ? 'Schließen' : 'Schnellwahl (1-Tap)'}</span>
          {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
        </div>
      </button>

      {/* Expanded List */}
      {isOpen && (
        <div className="px-4 pb-4 pt-1 max-h-[60vh] overflow-y-auto space-y-2 border-t border-slate-800">
          <p className="text-[11px] text-slate-400 mb-2">
            Direkte Notrufnummern für akute Gefährdungslagen im Außendienst. Direkter Anruf per Klick.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {HOTLINES.map((h) => {
              const Icon = h.icon;
              const cleanTel = h.number.replace(/\s+/g, '');
              return (
                <a
                  key={h.name}
                  href={`tel:${cleanTel}`}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 border border-slate-700/60 active:scale-[0.98] transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 rounded-md bg-red-500/10 text-red-400 group-hover:bg-red-500 group-hover:text-white transition-colors">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="text-left">
                      <div className="text-xs font-semibold text-slate-100 flex items-center gap-1.5">
                        {h.name}
                        {h.badge && (
                          <span className="text-[10px] px-1.5 py-0.2 bg-blue-500/20 text-blue-300 rounded font-normal">
                            {h.badge}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400">{h.label}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 pl-2 text-right">
                    <span className="text-xs font-mono font-bold text-amber-400 group-hover:underline">
                      {h.number}
                    </span>
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
