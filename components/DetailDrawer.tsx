'use client';

import React, { useState } from 'react';
import {
  X,
  Building2,
  HeartHandshake,
  MapPin,
  Train,
  Phone,
  Mail,
  Globe,
  Clock,
  FileText,
  CheckSquare,
  AlertCircle,
  Accessibility,
  Languages,
  Printer,
  Copy,
  Check,
  ShieldCheck,
  PhoneCall,
  Calendar,
  Flag,
} from 'lucide-react';
import { Facility } from '@/types/facility';
import { ReportCorrectionModal } from './ReportCorrectionModal';

interface DetailDrawerProps {
  facility: Facility | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenPrint: (facility: Facility) => void;
}

export const DetailDrawer: React.FC<DetailDrawerProps> = ({
  facility,
  isOpen,
  onClose,
  onOpenPrint,
}) => {
  const [copied, setCopied] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);

  const formatShareText = () => {
    if (!facility) return '';
    let text = `📍 *${facility.name}*`;
    if (facility.subTitle) text += ` (${facility.subTitle})`;
    text += `\n🏢 ${facility.address.street}, ${facility.address.zipCode} Berlin`;
    if (facility.transit?.station) {
      text += `\n🚇 ${facility.transit.station} (${facility.transit.lines.join(', ')}) - ${facility.transit.walkingTime}`;
    }
    if (facility.contact?.phone) {
      text += `\n📞 Tel: ${facility.contact.phone}`;
    }
    if (facility.openingHours?.walkIn) {
      text += `\n⏰ Offene Sprechzeiten: ${facility.openingHours.walkIn}`;
    }
    if (facility.requiredDocuments && facility.requiredDocuments.length > 0) {
      text += `\n📄 Unterlagen mitbringen: ${facility.requiredDocuments.join(', ')}`;
    }
    text += `\n\n💡 Aus Polaris | SocialWorkHub (polaris-socialworkhub.net)`;
    return text;
  };

  const handleShareWhatsApp = () => {
    const text = formatShareText();
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
  };

  const handleCopyDetails = async () => {
    const text = formatShareText();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.warn('Copy failed', e);
    }
  };

  if (!isOpen || !facility) return null;

  const isAmt = facility.institutionType === 'amt';
  const isNiedrigschwellig = facility.accessType === 'niedrigschwellig';

  const handleCopyNote = () => {
    const note = `[Polaris Vermerk - Weiterleitung/Triage]
Einrichtung: ${facility.name} (${isAmt ? 'Behörde/Amt' : 'Freier Träger'})
Bezirk: ${facility.district}
Adresse: ${facility.address.street}, ${facility.address.zipCode} Berlin
ÖPNV: ${facility.transit.station} (${facility.transit.lines.join(', ')} - ${facility.transit.walkingTime})
Telefon: ${facility.contact.phone}
Notfall-Hotline: ${facility.contact.emergencyPhone || 'k.A.'}
E-Mail: ${facility.contact.email}
Rechtsgrundlagen: ${facility.legalBases.join(', ')}
Offene Sprechzeit: ${facility.openingHours.walkIn}
Mitzubringende Unterlagen:
${facility.requiredDocuments.map((d) => `- ${d}`).join('\n')}
Hinweis f. Fallführung: ${facility.internalWorkerNotes}`;

    navigator.clipboard.writeText(note);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in-50 duration-200"
      />

      {/* Slide-over Drawer Panel */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-2xl bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-200 border-l border-slate-200">
          {/* Header */}
          <div className="p-5 bg-slate-900 text-white flex items-start justify-between gap-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2 flex-wrap mb-2">
                {isAmt ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                    <Building2 className="w-3.5 h-3.5" />
                    Behörde / Amt
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    <HeartHandshake className="w-3.5 h-3.5" />
                    Freier Träger / NGO
                  </span>
                )}

                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                    isNiedrigschwellig
                      ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30'
                      : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                  }`}
                >
                  {isNiedrigschwellig ? 'Offen / Niedrigschwellig' : 'Antragspflichtig (SGB)'}
                </span>

                <span className="inline-flex items-center gap-1 text-xs text-slate-300 bg-slate-800 px-2.5 py-0.5 rounded-full">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  Bezirk {facility.district}
                </span>
              </div>

              <h2 className="text-lg sm:text-xl font-bold text-white leading-snug">
                {facility.name}
              </h2>
              <p className="text-xs text-slate-400 mt-1">{facility.subTitle}</p>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
              title="Schließen"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Body Content (Scrollable) */}
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-slate-800 text-sm">
            {/* Quick Action Banner */}
            <div className="flex items-center justify-between gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
              <div>
                <h4 className="text-xs font-bold text-blue-900">Für Beratung & Klientenkontakt</h4>
                <p className="text-xs text-blue-700">Druckfertiges Merkblatt generieren oder Aktenvermerk kopieren</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCopyNote}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white text-slate-700 hover:text-slate-900 border border-slate-300 rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                  <span>{copied ? 'Kopiert!' : 'Aktenvermerk'}</span>
                </button>
                <button
                  onClick={() => onOpenPrint(facility)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Klienten-Zettel drucken</span>
                </button>
              </div>
            </div>

            {/* Address & Transit */}
            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-blue-600" />
                Standort & ÖPNV-Anbindung
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="block text-slate-400 font-medium">Adresse:</span>
                  <p className="font-semibold text-slate-800">{facility.address.street}</p>
                  <p className="text-slate-600">{facility.address.zipCode} Berlin ({facility.district})</p>
                </div>
                <div>
                  <span className="block text-slate-400 font-medium">Nächste Station:</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Train className="w-4 h-4 text-blue-600" />
                    <span className="font-bold text-slate-900">{facility.transit.station}</span>
                  </div>
                  <p className="text-slate-600 mt-0.5">
                    Linien: {facility.transit.lines.join(', ')} • {facility.transit.walkingTime}
                  </p>
                </div>
              </div>
            </div>

            {/* Opening Hours & Contact */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Hours */}
              <div className="border border-slate-200 rounded-xl p-4 space-y-2.5 bg-white">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-amber-600" />
                  Sprechzeiten & Zugang
                </h4>
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="font-semibold text-slate-900 block">Offene Sprechstunde / Walk-In:</span>
                    <span className="text-slate-700">{facility.openingHours.walkIn}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900 block">Terminvereinbarung:</span>
                    <span className="text-slate-600">{facility.openingHours.appointment}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900 block">Telefonische Erreichbarkeit:</span>
                    <span className="text-slate-600">{facility.openingHours.phoneHours}</span>
                  </div>
                </div>
              </div>

              {/* Direct Contact */}
              <div className="border border-slate-200 rounded-xl p-4 space-y-2.5 bg-white">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <PhoneCall className="w-4 h-4 text-emerald-600" />
                  Kontakt & Erstanlaufstelle
                </h4>
                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-slate-400 block font-medium">Telefonische Zentrale / Intake:</span>
                    <a
                      href={`tel:${facility.contact.phone.replace(/\s+/g, '')}`}
                      className="text-blue-600 hover:underline font-bold text-sm"
                    >
                      {facility.contact.phone}
                    </a>
                  </div>
                  {facility.contact.emergencyPhone && (
                    <div>
                      <span className="text-red-500 block font-medium">Notfall-Hotline / Krisentelefon:</span>
                      <a
                        href={`tel:${facility.contact.emergencyPhone.replace(/\s+/g, '')}`}
                        className="text-red-700 hover:underline font-bold"
                      >
                        {facility.contact.emergencyPhone}
                      </a>
                    </div>
                  )}
                  <div>
                    <span className="text-slate-400 block font-medium">E-Mail:</span>
                    <a
                      href={`mailto:${facility.contact.email}`}
                      className="text-blue-600 hover:underline break-all"
                    >
                      {facility.contact.email}
                    </a>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Webauftritt:</span>
                    <a
                      href={facility.contact.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline inline-flex items-center gap-1"
                    >
                      <span>Offizielle Webseite öffnen</span>
                      <Globe className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Intake Process & Jurisdiction */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-700" />
                Aufnahmeprozedere & Clearing-Ablauf
              </h4>
              <p className="text-xs leading-relaxed text-slate-700 font-medium">
                {facility.intakeRules.procedure}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-xs">
                {facility.intakeRules.regionalJurisdiction && (
                  <div>
                    <span className="font-semibold text-slate-800 block">Zuständigkeitsbereich:</span>
                    <span className="text-slate-600">{facility.intakeRules.regionalJurisdiction}</span>
                  </div>
                )}
                {facility.intakeRules.waitingTimeEstimate && (
                  <div>
                    <span className="font-semibold text-slate-800 block">Wartezeitschätzung:</span>
                    <span className="text-slate-600">{facility.intakeRules.waitingTimeEstimate}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Required Documents Checklist */}
            <div className="border border-amber-200 bg-amber-50/50 rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                <CheckSquare className="w-4 h-4 text-amber-700" />
                Mitzubringende Unterlagen (Checkliste für Klient*innen)
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-800">
                {facility.requiredDocuments.map((doc, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="w-4 h-4 rounded border border-amber-400 bg-white flex items-center justify-center shrink-0 mt-0.5 text-amber-700 font-bold text-[10px]">
                      ✓
                    </span>
                    <span>{doc}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal bases */}
            <div className="border border-slate-200 rounded-xl p-4 space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                Rechtsgrundlagen & SGB-Zuordnung
              </h4>
              <div className="flex flex-wrap gap-2">
                {facility.legalBases.map((basis) => (
                  <span
                    key={basis}
                    className="px-3 py-1 bg-slate-100 text-slate-800 rounded-lg text-xs font-mono font-medium border border-slate-200"
                  >
                    {basis}
                  </span>
                ))}
              </div>
            </div>

            {/* Accessibility & Languages */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                <span className="font-semibold text-slate-700 flex items-center gap-1">
                  <Accessibility className="w-3.5 h-3.5 text-slate-500" />
                  Barrierefreiheit:
                </span>
                <p className="text-slate-600 capitalize">
                  {facility.accessibility.wheelchair === 'voll'
                    ? 'Vollständig rollstuhlgerecht (Aufzug vorhanden)'
                    : facility.accessibility.wheelchair === 'eingeschraenkt'
                    ? 'Eingeschränkt zugänglich'
                    : 'Nicht barrierefrei'}
                </p>
              </div>

              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1">
                <span className="font-semibold text-slate-700 flex items-center gap-1">
                  <Languages className="w-3.5 h-3.5 text-slate-500" />
                  Sprachkompetenzen im Team:
                </span>
                <p className="text-slate-600">{facility.accessibility.languages.join(', ')}</p>
              </div>
            </div>

            {/* Internal caseworker notes */}
            <div className="border border-blue-200 bg-blue-50/40 rounded-xl p-4 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-blue-700" />
                Praxishinweise für Sozialarbeiter*innen & Fallmanagement
              </h4>
              <p className="text-xs leading-relaxed text-blue-950 font-medium">
                {facility.internalWorkerNotes}
              </p>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 bg-slate-100 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsReportOpen(true)}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded-lg transition-colors cursor-pointer"
                title="Fehler oder geänderte Öffnungszeiten melden"
              >
                <Flag className="w-3.5 h-3.5 text-amber-600" />
                <span>Korrektur</span>
              </button>

              <button
                type="button"
                onClick={handleCopyDetails}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded-lg transition-colors cursor-pointer"
                title="Adresse und Infos in Zwischenablage kopieren"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                <span>{copied ? 'Kopiert!' : 'Kopieren'}</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-lg shadow-xs transition-colors cursor-pointer"
                title="Direkt per WhatsApp an Klient*in oder Kolleg*in senden"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.711 2.598 2.664-.698c.99.54 1.777.818 2.796.818 3.18 0 5.767-2.587 5.767-5.766.001-3.182-2.585-5.767-5.767-5.767zm0 10.373c-.927 0-1.63-.24-2.482-.697l-.178-.096-1.579.414.421-1.539-.115-.184c-.538-.858-.823-1.603-.823-2.505 0-2.539 2.065-4.604 4.605-4.604 2.539 0 4.604 2.065 4.604 4.604 0 2.54-2.065 4.607-4.604 4.607z"/>
                </svg>
                <span>WhatsApp</span>
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-300 rounded-lg transition-colors cursor-pointer"
              >
                Schließen
              </button>

              <button
                onClick={() => {
                  onClose();
                  onOpenPrint(facility);
                }}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Klienten-Zettel drucken</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Crowdsourced Report / Correction Modal */}
      <ReportCorrectionModal
        facility={facility}
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
      />
    </div>
  );
};
