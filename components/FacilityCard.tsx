'use client';

import React, { useState } from 'react';
import {
  Building2,
  HeartHandshake,
  MapPin,
  Train,
  Phone,
  DoorOpen,
  FileCheck2,
  Printer,
  ChevronRight,
  Copy,
  Check,
  Bookmark,
} from 'lucide-react';
import { Facility } from '@/types/facility';
import { useBookmarks } from '../lib/useBookmarks';

interface FacilityCardProps {
  facility: Facility;
  isSelected: boolean;
  onSelect: (facility: Facility) => void;
  onOpenDetails: (facility: Facility) => void;
  onOpenPrint: (facility: Facility) => void;
}

export const FacilityCard: React.FC<FacilityCardProps> = ({
  facility,
  isSelected,
  onSelect,
  onOpenDetails,
  onOpenPrint,
}) => {
  const [copied, setCopied] = useState(false);
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const bookmarked = isBookmarked(facility.id);
  const isAmt = facility.institutionType === 'amt';
  const isNiedrigschwellig = facility.accessType === 'niedrigschwellig';

  // Formatierter Vermerk für Falldokumentation (SoPart, LISSA etc.)
  const handleCopyNote = (e: React.MouseEvent) => {
    e.stopPropagation();
    const note = `[Polaris Vermerk - Weiterleitung/Triage]
Einrichtung: ${facility.name} (${isAmt ? 'Behörde/Amt' : 'Freier Träger'})
Bezirk: ${facility.district} | Adresse: ${facility.address.street}, ${facility.address.zipCode} Berlin
ÖPNV: ${facility.transit.station} (${facility.transit.walkingTime})
Kontakt: Tel: ${facility.contact.phone} | Mail: ${facility.contact.email}
Rechtsgrundlage / Zuordnung: ${facility.legalBases.join(', ')}
Offene Sprechzeit: ${facility.openingHours.walkIn}
Mitzubringende Unterlagen: ${facility.requiredDocuments.join('; ')}
Hinweis f. Fallführung: ${facility.internalWorkerNotes}`;

    navigator.clipboard.writeText(note);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <article
      onClick={() => onSelect(facility)}
      className={`group relative bg-white rounded-xl border transition-all duration-150 cursor-pointer overflow-hidden p-4 sm:p-5 flex flex-col justify-between ${
        isSelected
          ? 'border-blue-600 ring-2 ring-blue-500/20 shadow-md bg-blue-50/15'
          : 'border-slate-200/90 hover:border-slate-300 hover:shadow-sm'
      }`}
    >
      {/* Vertikaler Kennzeichnungsstreifen links */}
      <span
        aria-hidden="true"
        className={`absolute left-0 top-0 bottom-0 w-1.5 ${
          isAmt ? 'bg-blue-600' : 'bg-emerald-600'
        }`}
      />

      <div>
        {/* Header-Reihe: Badges & Bookmark */}
        <div className="flex items-start justify-between gap-2 mb-2.5 pl-1.5">
          <div className="flex items-center gap-1.5 flex-wrap">
            {/* Trägertyp Badge */}
            {isAmt ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/80">
                <Building2 className="w-3 h-3 text-blue-600 shrink-0" />
                Behörde / Amt
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                <HeartHandshake className="w-3 h-3 text-emerald-600 shrink-0" />
                Freier Träger
              </span>
            )}

            {/* Zugangsart Badge */}
            {isNiedrigschwellig ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
                <DoorOpen className="w-3 h-3 text-slate-500 shrink-0" />
                Offene Sprechzeit
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200/70">
                <FileCheck2 className="w-3 h-3 text-amber-600 shrink-0" />
                Antragspflichtig (SGB)
              </span>
            )}

            {/* Bezirk Badge */}
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100/90 px-2 py-0.5 rounded">
              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
              {facility.district}
            </span>
          </div>

          {/* Bookmark Button */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              toggleBookmark(facility.id);
            }}
            title={bookmarked ? 'Aus Favoriten entfernen' : 'Zu Favoriten hinzufügen'}
            className={`p-1.5 rounded-lg border transition-colors shrink-0 ${
              bookmarked
                ? 'bg-amber-50 text-amber-500 border-amber-300'
                : 'text-slate-400 hover:text-amber-500 hover:bg-slate-50 border-transparent'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${bookmarked ? 'fill-amber-500' : ''}`} />
          </button>
        </div>

        {/* Titel & Kurzbeschreibung */}
        <div className="mb-3 pl-1.5">
          <h3 className="text-base font-bold text-slate-900 leading-snug group-hover:text-blue-600 transition-colors">
            {facility.name}
          </h3>
          <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
            {facility.subTitle}
          </p>
        </div>

        {/* ÖPNV & Standort Box */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-600 gap-1.5 py-1.5 px-2.5 bg-slate-50/90 rounded-lg border border-slate-200/60 mb-2.5 ml-1.5">
          <div className="flex items-center gap-1.5">
            <Train className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="font-medium text-slate-800">{facility.transit.station}</span>
            <span className="text-slate-400">({facility.transit.walkingTime})</span>
          </div>
          <span className="text-slate-500 text-[11px] truncate">{facility.address.street}</span>
        </div>

        {/* Rechtsgrundlagen */}
        {facility.legalBases?.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap mb-2.5 ml-1.5">
            <span className="text-[11px] font-medium text-slate-400">Leistungen:</span>
            {facility.legalBases.map((basis) => (
              <span
                key={basis}
                className="px-1.5 py-0.5 text-[11px] font-mono bg-slate-100 text-slate-700 rounded border border-slate-200"
              >
                {basis}
              </span>
            ))}
          </div>
        )}

        {/* Zugang / Klienten-Hinweis */}
        {facility.intakeRules?.summary && (
          <div className="text-xs text-slate-700 mb-3.5 ml-1.5 p-2 rounded-lg bg-amber-50/50 border border-amber-200/50 leading-relaxed">
            <span className="font-semibold text-amber-900">Zugang & Voraussetzung: </span>
            <span className="line-clamp-2">{facility.intakeRules.summary}</span>
          </div>
        )}
      </div>

      {/* Fußzeile: Kontakt & Aktionen */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-slate-100 text-xs ml-1.5">
        {/* Telefon-Direktlink */}
        <a
          href={`tel:${facility.contact.phone.replace(/\s+/g, '')}`}
          onClick={(e) => e.stopPropagation()}
          className="inline-flex items-center gap-1.5 text-slate-700 hover:text-blue-600 font-medium transition-colors"
          title="Direkt anrufen"
        >
          <Phone className="w-3.5 h-3.5 text-slate-400" />
          <span>{facility.contact.phone}</span>
        </a>

        {/* Aktionsbuttons */}
        <div className="flex items-center gap-1.5 ml-auto">
          {/* Vermerk kopieren */}
          <button
            type="button"
            onClick={handleCopyNote}
            className="inline-flex items-center gap-1 h-8 px-2.5 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/90 rounded-md text-xs font-medium transition-colors"
            title="Fallakten-Vermerk kopieren"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-semibold">Kopiert!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-slate-500" />
                <span>Vermerk</span>
              </>
            )}
          </button>

          {/* Klienten-Zettel Drucken */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenPrint(facility);
            }}
            className="inline-flex items-center gap-1 h-8 px-2.5 text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200/80 rounded-md text-xs font-medium transition-colors"
            title="Klienten-Infoblatt drucken"
          >
            <Printer className="w-3.5 h-3.5 text-blue-600" />
            <span>Klienten-Zettel</span>
          </button>

          {/* Details Drawer öffnen */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetails(facility);
            }}
            className="inline-flex items-center gap-1 h-8 px-3 text-white bg-slate-900 hover:bg-slate-800 rounded-md text-xs font-medium transition-colors shadow-xs"
          >
            <span>Details</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
          </button>
        </div>
      </div>
    </article>
  );
};