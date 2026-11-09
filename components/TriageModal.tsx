'use client';

import React, { useState } from 'react';
import { 
  X, Sparkles, AlertCircle, Printer, Copy, Check, 
  ShieldAlert, Globe, ExternalLink, Search, Loader2 
} from 'lucide-react';
import { 
  HousingStatus, UrgencyLevel, LegalResidenceStatus, 
  BenefitStatus, TriageInput, TriageResponse 
} from '@/types/triage';

interface TriageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ExaResult {
  title: string;
  url: string;
  text?: string;
}

const BERLIN_DISTRICTS = [
  'Mitte', 'Friedrichshain-Kreuzberg', 'Pankow', 'Charlottenburg-Wilmersdorf',
  'Spandau', 'Steglitz-Zehlendorf', 'Tempelhof-Schöneberg', 'Neukölln',
  'Treptow-Köpenick', 'Marzahn-Hellersdorf', 'Lichtenberg', 'Reinickendorf'
];

export default function TriageModal({ isOpen, onClose }: TriageModalProps) {
  const [formData, setFormData] = useState<TriageInput>({
    clientAge: undefined,
    district: '',
    housingStatus: 'homeless',
    urgency: 'high',
    residenceStatus: 'german',
    benefitStatus: 'none',
    hasIdOrPassport: true,
    hasPostalAddress: true,
    hasBankAccount: true,
    hasHealthInsurance: true,
    hasPet: false,
    hasMobilityImpairment: false,
    hasDebtIssues: false,
    hasChildrenInHousehold: false,
    isPregnant: false,
    isDomesticViolenceVictim: false,
    needsSubstanceOrMentalSupport: false,
    notes: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TriageResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Exa-Zustände
  const [exaLoading, setExaLoading] = useState(false);
  const [exaResults, setExaResults] = useState<ExaResult[]>([]);
  const [exaError, setExaError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setExaResults([]);
    setExaError(null);

    try {
      const res = await fetch('/api/triage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) throw new Error('Fehler beim Abrufen des Stufenplans');

      const data: TriageResponse = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Etwas ist schiefgelaufen.');
    } finally {
      setIsLoading(false);
    }
  };

// Exa-Suche aufrufen mit alters- und kontextsensitiver Query
  const handleExaSearch = async () => {
    try {
      setExaLoading(true);
      setExaError(null);

      const isMinor = formData.clientAge !== undefined && formData.clientAge < 18;
      const isStableHoused = formData.housingStatus === 'parental_home' || (formData.housingStatus as string) === 'regular_rent';
      
      const queryParts: string[] = [];

      // 1. Regionaler Bezug als fester Anker ganz vorne
      const districtStr = formData.district ? `Berlin ${formData.district}` : 'Berlin';
      queryParts.push(districtStr);

      // 2. Altersgerechte Einordnung (SGB VIII vs. Erwachsene)
      if (isMinor) {
        queryParts.push('Kinder- und Jugendhilfe');
        
        if (formData.isDomesticViolenceVictim) {
          queryParts.push('Kinderschutz Jugendnotdienst Beratung häusliche Gewalt');
        } else {
          queryParts.push('Erziehungs- und Familienberatung');
        }
      } else {
        // Erwachsene
        if (formData.isDomesticViolenceVictim) {
          queryParts.push('Gewaltschutz Beratung Frauen Kriseneinrichtung');
        }
      }

      // 3. Wohnsituation
      if (!isStableHoused) {
        if (formData.housingStatus === 'homeless') {
          queryParts.push(isMinor ? 'Notunterkunft Jugendliche Clearingstelle' : 'Wohnungsnotfall Notübernachtung');
        } else if (formData.housingStatus === 'rent_threatened') {
          queryParts.push('Mietschuldenberatung Soziale Wohnhilfe');
        }
      }

      // 4. Spezifische Zusatzbedarfe
      if (formData.needsSubstanceOrMentalSupport) {
        queryParts.push(isMinor ? 'Jugendsuchtberatung' : 'Suchthilfe Krisendienst');
      }

      if (formData.hasPet && !isStableHoused) {
        queryParts.push('Notunterkunft Hund');
      }

      // 5. Freitext
      if (formData.notes && formData.notes.trim().length > 0) {
        queryParts.push(formData.notes.trim().slice(0, 60));
      }

      const queryString = queryParts.join(' ').trim();

      // Ruft unsere eigene Next.js API-Route auf (nicht direkt Exa!)
      const res = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: queryString }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Fehler bei der Exa-Recherche');

      setExaResults(data.results || []);
    } catch (err: any) {
      setExaError(err.message || 'Exa-Recherche konnte nicht durchgeführt werden.');
    } finally {
      setExaLoading(false);
    }
  };

const handlePrint = () => {
    window.print();
  };

  const handleCopyToClipboard = async () => {
    if (!result) return;

    const today = new Date().toLocaleDateString('de-DE');
    let text = `=== ERSTCLEARING / TRIAGE-STUFENPLAN (${today}) ===\n`;
    text += `Bezirk: ${formData.district || 'Ungeklärt / Berlinweit'}\n`;
    text += `Wohnsituation: ${formData.housingStatus} | Dringlichkeit: ${formData.urgency}\n`;
    text += `Einschätzung: ${result.summary}\n`;
    if (result.legalContext && result.legalContext.length > 0) {
      text += `Rechtsgrundlagen: ${result.legalContext.join(', ')}\n`;
    }
    text += `\n--- HANDLUNGSSCHRITTE ---\n`;

    result.steps.forEach((s, idx) => {
      text += `\n[Stufe ${idx + 1}: ${s.phase.toUpperCase()}] ${s.title}\n`;
      text += `Maßnahme: ${s.action}\n`;
      if (s.requiredDocs && s.requiredDocs.length > 0) {
        text += `Unterlagen: ${s.requiredDocs.join(', ')}\n`;
      }
      if (s.matchedFacilities && s.matchedFacilities.length > 0) {
        text += `Anlaufstelle: ${s.matchedFacilities.map((f: any) => {
          const street = f.address?.street || (typeof f.address === 'string' ? f.address : '');
          const tel = f.phone || f.contact?.phone || '-';
          return `${f.name} (${street}, Tel:${tel})`;
        }).join('; ')}\n`;
      }
    });

    if (exaResults.length > 0) {
      text += `\n--- WEITERE RECHERCHIERTE WEB-ANLANGESTELLEN (EXA) ---\n`;
      exaResults.forEach((item) => {
        text += `• ${item.title}: ${item.url}\n`;
      });
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.error('Kopieren fehlgeschlagen', e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto print:p-0 print:bg-white print:static print:block" triage-print-root>
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 print:border-none print:shadow-none print:w-full print:max-w-none print:my-0 print:static print:block triage-print-card">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 print:bg-white print:border-b-2 print:border-slate-800 print:px-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600 text-white rounded-xl shadow-sm print:hidden">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 print:text-xl">
                {result ? 'Klienten-Handout & Handlungsplan' : 'Smart Triage Planer'}
              </h2>
              <p className="text-xs text-slate-500 print:text-slate-700">
                {result 
                  ? `Erstellt am ${new Date().toLocaleDateString('de-DE')} • Bezirk: ${formData.district || 'Berlinweit'}`
                  : 'Strukturierter Stufenplan mit Notion-Matching & Exa-Websuche'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer print:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto print:max-h-none print:overflow-visible print:p-0 print:pt-4">
          {!result ? (
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Block 1: Eckdaten */}
              <div>
                <span className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  1. Fallaufnahme & Dringlichkeit
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Alter</label>
                    <input
                      type="number"
                      placeholder="z. B. 22"
                      value={formData.clientAge ?? ''}
                      onChange={(e) => setFormData({ ...formData, clientAge: e.target.value ? parseInt(e.target.value) : undefined })}
                      className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Letzter Meldebezirk</label>
                    <select
                      value={formData.district}
                      onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                      className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    >
                      <option value="">(Ungeklärt / Keiner)</option>
                      {BERLIN_DISTRICTS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Wohnsituation</label>
                    <select
                      value={formData.housingStatus}
                      onChange={(e) => setFormData({ ...formData, housingStatus: e.target.value as HousingStatus })}
                      className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    >
                      <option value="homeless">Akut obdachlos / Straße</option>
                      <option value="rent_threatened">Zur Miete (Kündigung/Klage)</option>
                      <option value="parental_home">Im elterlichen Haushalt</option>
                      <option value="sheltered">Wohnheim / Notunterkunft</option>
                      <option value="precarious">Prekär / Couchsurfing</option>
                      <option value="institutional_exit">In Entlassung (JVA/Klinik)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Dringlichkeit</label>
                    <select
                      value={formData.urgency}
                      onChange={(e) => setFormData({ ...formData, urgency: e.target.value as UrgencyLevel })}
                      className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    >
                      <option value="acute">Akut (heute kein Schlafplatz)</option>
                      <option value="high">Hoch (innerhalb 48h)</option>
                      <option value="medium">Mittel (diese Woche)</option>
                      <option value="low">Niedrig (Prävention)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Block 2: Rechtlicher Status & Finanzen */}
              <div>
                <span className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  2. Status & Finanzen
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Aufenthaltsstatus</label>
                    <select
                      value={formData.residenceStatus}
                      onChange={(e) => setFormData({ ...formData, residenceStatus: e.target.value as LegalResidenceStatus })}
                      className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    >
                      <option value="german">Deutsche Staatsangehörigkeit</option>
                      <option value="eu_citizen">EU-Bürger/in</option>
                      <option value="third_country">Drittstaatsangehörige/r (Aufenthaltstitel)</option>
                      <option value="unclear">Gestattung / Duldung / Ungeklärt</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Leistungsbezug</label>
                    <select
                      value={formData.benefitStatus}
                      onChange={(e) => setFormData({ ...formData, benefitStatus: e.target.value as BenefitStatus })}
                      className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                    >
                      <option value="none">Mittellos / Kein Einkommen</option>
                      <option value="buergergeld">Bürgergeld (Jobcenter)</option>
                      <option value="sozialamt">Grundsicherung / SGB XII</option>
                      <option value="asylblg">Asylbewerberleistungen (AsylbLG)</option>
                      <option value="employed">Erwerbstätig (Aufstocker)</option>
                      <option value="unknown">Ungeklärt / Erstantrag nötig</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Block 3: Praktische Hürden */}
              <div>
                <span className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  3. Administrative Barrieren & Schulden
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {[
                    { key: 'hasIdOrPassport', label: 'Ausweisdokument da' },
                    { key: 'hasPostalAddress', label: 'Melde-/Postadresse da' },
                    { key: 'hasBankAccount', label: 'Bankkonto vorhanden' },
                    { key: 'hasHealthInsurance', label: 'Krankenversichert' },
                    { key: 'hasDebtIssues', label: 'Schulden / Pfändung' },
                    { key: 'hasPet', label: 'Haustier / Hund dabei' },
                  ].map(({ key, label }) => (
                    <label
                      key={key}
                      className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs cursor-pointer select-none transition-colors ${
                        (formData as any)[key]
                          ? 'bg-blue-50/70 border-blue-200 text-blue-900 font-medium'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={(formData as any)[key]}
                        onChange={(e) => setFormData({ ...formData, [key]: e.target.checked })}
                        className="w-3.5 h-3.5 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Block 4: Schutzbedarfe */}
              <div>
                <span className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  4. Besondere Schutzbedarfe
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {[
                    { key: 'hasChildrenInHousehold', label: 'Minderjährige Kinder' },
                    { key: 'isPregnant', label: 'Schwangerschaft' },
                    { key: 'isDomesticViolenceVictim', label: 'Häusliche Gewalt' },
                    { key: 'needsSubstanceOrMentalSupport', label: 'Sucht / SpDi-Bedarf' },
                  ].map(({ key, label }) => (
                    <label
                      key={key}
                      className={`flex items-center gap-2 p-2.5 rounded-lg border text-xs cursor-pointer select-none transition-colors ${
                        (formData as any)[key]
                          ? 'bg-amber-50/80 border-amber-300 text-amber-900 font-medium'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={(formData as any)[key]}
                        onChange={(e) => setFormData({ ...formData, [key]: e.target.checked })}
                        className="w-3.5 h-3.5 rounded text-amber-600 border-slate-300 focus:ring-amber-500"
                      />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Block 5: Freitext */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Fallschilderung / Freitext-Besonderheiten
                  </label>
                  <span className="flex items-center gap-1 text-[11px] text-amber-600 font-medium">
                    <ShieldAlert className="w-3.5 h-3.5" />
                    Keine echten Namen eintragen (DSGVO)
                  </span>
                </div>
                <textarea
                  rows={2}
                  placeholder="z. B. Sprachbarriere, Sperrzeit beim Jobcenter, Hausverbot in Notübernachtung..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full text-sm px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white resize-none"
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 p-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Analysiere Fall & matche Einrichtungen...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Stufenplan generieren</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* Ergebnisansicht */
            <div className="space-y-6">
              
              {/* Fallübersicht */}
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl print:hidden">
                <h3 className="text-sm font-bold text-blue-900 mb-1">
                  Ergebnis & Sozialrechtliche Einschätzung
                </h3>
                <p className="text-xs text-blue-800 leading-relaxed">
                  {result.summary}
                </p>
                {result.legalContext && result.legalContext.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2.5">
                    {result.legalContext.map((law, idx) => (
                      <span key={idx} className="text-[10px] bg-blue-100 text-blue-700 font-semibold px-2 py-0.5 rounded-md border border-blue-200">
                        {law}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Stufenplan */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Schritt-für-Schritt-Fahrplan ({result.steps.length} Stufen)
                  </h3>

                  {/* Exa-Trigger Button */}
                  <button
                    type="button"
                    onClick={handleExaSearch}
                    disabled={exaLoading}
                    className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
                    title="Live im Web nach weiteren passenden Angeboten suchen"
                  >
                    {exaLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                    ) : (
                      <Search className="w-3.5 h-3.5 text-blue-600" />
                    )}
                    <span>{exaLoading ? 'Recherchiere via Exa...' : 'Ergänzende Web-Recherche (Exa)'}</span>
                  </button>
                </div>
                
                {result.steps.map((step, idx) => (
                  <div 
                    key={idx} 
                    className="p-4 border border-slate-200 rounded-xl bg-white shadow-sm space-y-2.5"
                  >
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                        step.phase === 'sofort' ? 'bg-red-100 text-red-700 border-red-200' :
                        step.phase === 'behoerde' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                        'bg-emerald-100 text-emerald-800 border-emerald-200'
                      }`}>
                        Stufe {idx + 1}: {step.phase}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900">{step.title}</h4>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed">
                      {step.action}
                    </p>

                    {/* Checkliste Unterlagen */}
                    {step.requiredDocs && step.requiredDocs.length > 0 && (
                      <div className="text-[11px] text-slate-700 bg-slate-50 p-2 rounded-lg border border-slate-200">
                        <strong className="block text-slate-800 mb-1 font-semibold text-[10px] uppercase tracking-wide">
                          Mitzubringende Unterlagen:
                        </strong>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                          {step.requiredDocs.map((doc, dIdx) => (
                            <div key={dIdx} className="flex items-center gap-1.5 text-xs text-slate-700">
                              <span className="inline-block w-3.5 h-3.5 border border-slate-400 rounded-xs shrink-0 bg-white" />
                              <span>{doc}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Lokale Notion-Anlaufstellen */}
                    {step.matchedFacilities && step.matchedFacilities.length > 0 && (
                      <div className="pt-2 border-t border-slate-100">
                        <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                          Zuständige Anlaufstelle (aus Polaris-Datenbank):
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {step.matchedFacilities.map((fac: any) => {
                            const addressStr = typeof fac.address === 'string'
                              ? fac.address
                              : fac.address?.street
                                ? `${fac.address.street}, ${fac.address.zipCode || ''} Berlin`
                                : null;
                            const phoneStr = fac.phone || fac.contact?.phone;

                            return (
                              <div key={fac.id} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                                <div className="font-bold text-xs text-slate-900">{fac.name}</div>
                                {addressStr && (
                                  <div className="text-[11px] text-slate-700 mt-0.5">
                                    📍 {addressStr}{fac.district ? ` (${fac.district})` : ''}
                                  </div>
                                )}
                                {phoneStr && (
                                  <div className="text-[11px] text-slate-700 mt-0.5 font-medium">
                                    📞 Tel: {phoneStr}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Exa-Ergebnisse Box */}
              {(exaLoading || exaResults.length > 0 || exaError) && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                  <div className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-blue-600" />
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Live Web-Recherche via Exa
                    </h4>
                  </div>

                  {exaLoading && (
                    <div className="flex items-center gap-2 text-xs text-slate-500 py-2">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                      <span>Echtzeit-Websuche nach passenden Beratungsstellen & Angeboten...</span>
                    </div>
                  )}

                  {exaError && (
                    <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-200">
                      {exaError}
                    </p>
                  )}

                  {exaResults.length > 0 && (
                    <div className="grid grid-cols-1 gap-2 pt-1">
                      {exaResults.map((item, i) => (
                        <a
                          key={i}
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group p-2.5 bg-white rounded-lg border border-slate-200 hover:border-blue-400 hover:shadow-xs transition-all block"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold text-slate-900 group-hover:text-blue-600 line-clamp-1">
                              {item.title}
                            </span>
                            <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600 shrink-0 ml-1" />
                          </div>
                          {item.text && (
                            <p className="text-[11px] text-slate-600 line-clamp-2 mt-1 leading-relaxed">
                              {item.text}
                            </p>
                          )}
                          <span className="text-[10px] text-slate-400 mt-1 block truncate">
                            {item.url}
                          </span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Aktionsleiste */}
              <div className="flex justify-between items-center pt-4 border-t border-slate-200 print:hidden">
                <button
                  type="button"
                  onClick={() => setResult(null)}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 cursor-pointer"
                >
                  ← Eingaben anpassen
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleCopyToClipboard}
                    className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                    title="Dokumentationstext für Akte kopieren"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 text-emerald-600" />
                        <span className="text-emerald-700">Akte kopiert!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>In Akte kopieren</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handlePrint}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    <Printer className="w-4 h-4" />
                    <span>Drucken / PDF</span>
                  </button>
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                  >
                    Fertig
                  </button>
                </div>
              </div>

            </div>
          )}
        </div>

      </div>
    </div>
  );
}