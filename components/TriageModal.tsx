'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, Sparkles, AlertCircle, Printer, Copy, Check, 
  ShieldAlert, Globe, ExternalLink, Search, Loader2,
  Lock, ArrowRight, ShieldCheck, CheckCircle2, Building2, Users, LogIn, UserPlus
} from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { supabase } from '@/lib/supabase';
import LicenseModal from '@/components/LicenseModal';
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
  const { user, signInWithGoogle, signInWithEmail, signUpWithEmail } = useAuth();
  const [isLicenseOpen, setIsLicenseOpen] = useState(false);
  const [triageUsage, setTriageUsage] = useState<{
    used: number;
    max: number;
    unlimited: boolean;
    allowed: boolean;
  }>({ used: 0, max: 3, unlimited: false, allowed: true });
  const [loadingUsage, setLoadingUsage] = useState(false);

  // Teaser Auth states for logged-out visitors
  const [teaserCase, setTeaserCase] = useState<'pregnant_minor' | 'eu_homeless_winter' | 'domestic_violence'>('pregnant_minor');
  const [authEmail, setAuthEmail] = useState('');
  const [authPass, setAuthPass] = useState('');
  const [authName, setAuthName] = useState('');
  const [isAuthRegister, setIsAuthRegister] = useState(true);
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Fetch monthly triage usage when user is logged in
  useEffect(() => {
    if (!isOpen || !user) return;
    const fetchUsage = async () => {
      try {
        setLoadingUsage(true);
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) return;
        const res = await fetch('/api/triage', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setTriageUsage({
            used: data.used || 0,
            max: data.max || 3,
            unlimited: !!data.unlimited,
            allowed: data.allowed !== false,
          });
        }
      } catch (e) {
        console.warn('Could not fetch triage usage', e);
      } finally {
        setLoadingUsage(false);
      }
    };
    fetchUsage();
  }, [isOpen, user]);

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
  const [originalResult, setOriginalResult] = useState<TriageResponse | null>(null);
  const [selectedLang, setSelectedLang] = useState<"de" | "uk" | "en" | "pl" | "ar" | "ru">("de");
  const [translating, setTranslating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Exa-Zustände
  const [exaLoading, setExaLoading] = useState(false);
  const [exaResults, setExaResults] = useState<ExaResult[]>([]);
  const [exaError, setExaError] = useState<string | null>(null);

  const handleSelectDemoCase = (type: 'pregnant_minor' | 'eu_homeless_winter' | 'domestic_violence') => {
    if (type === 'pregnant_minor') {
      setFormData({
        clientAge: 17,
        district: 'Mitte',
        housingStatus: 'parental_home',
        urgency: 'acute',
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
        isPregnant: true,
        isDomesticViolenceVictim: false,
        needsSubstanceOrMentalSupport: false,
        notes: 'Klientin ist 17 Jahre alt, im 5. Monat schwanger. Eltern fordern sofortigen Auszug bis morgen. RSD Jugendamt noch nicht eingeschaltet.',
      });
    } else if (type === 'eu_homeless_winter') {
      setFormData({
        clientAge: 38,
        district: 'Friedrichshain-Kreuzberg',
        housingStatus: 'homeless',
        urgency: 'acute',
        residenceStatus: 'eu_citizen',
        benefitStatus: 'none',
        hasIdOrPassport: true,
        hasPostalAddress: false,
        hasBankAccount: false,
        hasHealthInsurance: false,
        hasPet: false,
        hasMobilityImpairment: false,
        hasDebtIssues: false,
        hasChildrenInHousehold: false,
        isPregnant: false,
        isDomesticViolenceVictim: false,
        needsSubstanceOrMentalSupport: false,
        notes: 'Polnischer Staatsangehöriger, seit 3 Monaten auf der Straße ohne Leistungsbezug. Akute Kältehilfe und medizinisches Clearing erforderlich.',
      });
    } else if (type === 'domestic_violence') {
      setFormData({
        clientAge: 31,
        district: 'Neukölln',
        housingStatus: 'precarious',
        urgency: 'acute',
        residenceStatus: 'german',
        benefitStatus: 'none',
        hasIdOrPassport: true,
        hasPostalAddress: false,
        hasBankAccount: true,
        hasHealthInsurance: true,
        hasPet: false,
        hasMobilityImpairment: false,
        hasDebtIssues: false,
        hasChildrenInHousehold: true,
        isPregnant: false,
        isDomesticViolenceVictim: true,
        needsSubstanceOrMentalSupport: false,
        notes: 'Mutter mit zwei Kindern (3 und 6 Jahre) flieht vor gewalttätigem Partner. Dringend sichere Zufluchtswohnung oder Frauenhausplatz für heute Nacht benötigt.',
      });
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setExaResults([]);
    setExaError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const res = await fetch('/api/triage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        if (errData?.error === 'LIMIT_REACHED') {
          setTriageUsage((prev) => ({ ...prev, used: prev.max, allowed: false }));
          throw new Error('Du hast deine 3 kostenlosen KI-Triagen für diesen Monat aufgebraucht.');
        }
        throw new Error(errData?.message || 'Fehler beim Abrufen des Stufenplans');
      }

      const data: TriageResponse = await res.json();
      setResult(data);
      setOriginalResult(data);
      setSelectedLang('de');

      if ((data as any).usage) {
        setTriageUsage({
          used: (data as any).usage.used || 0,
          max: (data as any).usage.max || 3,
          unlimited: !!(data as any).usage.unlimited,
          allowed: (data as any).usage.allowed !== false,
        });
      }
    } catch (err: any) {
      setError(err.message || 'Etwas ist schiefgelaufen.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLanguageChange = async (targetLang: 'de' | 'uk' | 'en' | 'pl' | 'ar' | 'ru') => {
    if (!originalResult || targetLang === selectedLang) return;
    if (targetLang === 'de') {
      setResult(originalResult);
      setSelectedLang('de');
      return;
    }

    setTranslating(true);
    try {
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          triageResponse: originalResult,
          targetLanguage: targetLang,
        }),
      });
      if (!res.ok) throw new Error('Translation failed');
      const data = await res.json();
      if (data.translated) {
        setResult(data.translated);
        setSelectedLang(targetLang);
      }
    } catch (err: any) {
      console.warn('Translation error:', err);
    } finally {
      setTranslating(false);
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
          {/* Logged-In Quota Bar */}
          {user && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl border bg-slate-50 border-slate-200 text-xs mb-4">
              <div className="flex items-center gap-2">
                {triageUsage.unlimited ? (
                  <span className="inline-flex items-center gap-1.5 font-bold text-emerald-700 bg-emerald-100/80 border border-emerald-300 px-2.5 py-1 rounded-full">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Team-Lizenz: Unbegrenzte KI-Triage aktiv</span>
                  </span>
                ) : (
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-700">Monatliches Freikontingent:</span>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3].map((dot) => (
                        <span
                          key={dot}
                          className={`w-2.5 h-2.5 rounded-full transition-all ${
                            dot <= triageUsage.used
                              ? 'bg-blue-600 ring-2 ring-blue-300'
                              : 'bg-slate-200 border border-slate-300'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="font-bold text-slate-900">
                      {triageUsage.used} / {triageUsage.max} genutzt
                    </span>
                  </div>
                )}
              </div>
              {!triageUsage.unlimited && (
                <button
                  type="button"
                  onClick={() => setIsLicenseOpen(true)}
                  className="font-bold text-blue-600 hover:text-blue-800 hover:underline text-xs flex items-center gap-1 self-start sm:self-auto"
                >
                  <span>Team-Lizenz freischalten</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          )}

          {!user ? (
            /* Logged-Out Preview & Teaser View */
            <div className="space-y-6">
              {/* Hero Banner */}
              <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-2xl shadow-md border border-indigo-800/50">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-400 text-slate-950 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    <span>3 Gratis-Analysen pro Monat</span>
                  </span>
                  <span className="text-[11px] text-indigo-200 flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>100% DSGVO-konform (Zero-PII)</span>
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
                  KI-gestützte Fall-Triage & Clearing in Sekunden
                </h3>
                <p className="text-xs text-indigo-100/90 mt-1 max-w-xl leading-relaxed">
                  Analysiert komplexe Fallkonstellationen im Berliner Hilfesystem: Ermittelt sofort gesetzliche Zuständigkeiten, SGB-Paragraphen, prioritäre Handlungsschritte und passende freie Träger.
                </p>
              </div>

              {/* Grid: Demo Cases on Left, Fast Auth on Right */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                {/* Left 7 cols: Interactive Case Preview */}
                <div className="lg:col-span-7 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Interaktives Praxis-Beispiel (Vorschau):
                    </span>
                  </div>

                  {/* Demo Case Selector Pills */}
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => setTeaserCase('pregnant_minor')}
                      className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium transition ${
                        teaserCase === 'pregnant_minor'
                          ? 'bg-blue-600 text-white border-blue-700 shadow-sm font-bold'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
                      }`}
                    >
                      👶 17-J. Schwangere
                    </button>
                    <button
                      type="button"
                      onClick={() => setTeaserCase('eu_homeless_winter')}
                      className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium transition ${
                        teaserCase === 'eu_homeless_winter'
                          ? 'bg-blue-600 text-white border-blue-700 shadow-sm font-bold'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
                      }`}
                    >
                      ❄️ EU-Bürger Winter
                    </button>
                    <button
                      type="button"
                      onClick={() => setTeaserCase('domestic_violence')}
                      className={`text-xs px-2.5 py-1.5 rounded-lg border font-medium transition ${
                        teaserCase === 'domestic_violence'
                          ? 'bg-blue-600 text-white border-blue-700 shadow-sm font-bold'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-slate-200'
                      }`}
                    >
                      🛡️ Häusliche Gewalt
                    </button>
                  </div>

                  {/* Solution Preview Card */}
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 text-xs">
                    {teaserCase === 'pregnant_minor' && (
                      <>
                        <div className="border-b border-slate-200 pb-2">
                          <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider block">Fallkonstellation:</span>
                          <p className="text-slate-700 mt-0.5">17-jährige Jugendliche, 5. Monat schwanger. Eltern fordern Auszug bis morgen. Keine eigene Wohnung.</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div className="p-2 bg-white rounded-lg border border-slate-200">
                            <span className="font-bold text-slate-900 block">🏛️ Zuständiges Amt:</span>
                            <span className="text-blue-700 font-semibold">Jugendamt / RSD Mitte</span>
                          </div>
                          <div className="p-2 bg-white rounded-lg border border-slate-200">
                            <span className="font-bold text-slate-900 block">⚖️ Rechtsgrundlage:</span>
                            <span className="text-indigo-700 font-semibold">§ 19 i.V.m. § 34 SGB VIII</span>
                          </div>
                        </div>
                        <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900">
                          <span className="font-bold block">🏢 Gematchte Anlaufstelle:</span>
                          <span>Mutter-Kind-Clearing & Schwangerschaftskonfliktberatung (Caritas / Diakonie)</span>
                        </div>
                      </>
                    )}

                    {teaserCase === 'eu_homeless_winter' && (
                      <>
                        <div className="border-b border-slate-200 pb-2">
                          <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider block">Fallkonstellation:</span>
                          <p className="text-slate-700 mt-0.5">Polnischer Staatsangehöriger, 38 Jahre, obdachlos bei Minustemperaturen. Keine KV, kein SGB-II-Anspruch.</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div className="p-2 bg-white rounded-lg border border-slate-200">
                            <span className="font-bold text-slate-900 block">🏛️ Sofortmaßnahme:</span>
                            <span className="text-blue-700 font-semibold">ASOG Kältehilfe Notübernachtung</span>
                          </div>
                          <div className="p-2 bg-white rounded-lg border border-slate-200">
                            <span className="font-bold text-slate-900 block">⚖️ Rechtsgrundlage:</span>
                            <span className="text-indigo-700 font-semibold">§ 67 SGB XII + § 23 SGB XII</span>
                          </div>
                        </div>
                        <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900">
                          <span className="font-bold block">🏢 Gematchte Anlaufstelle:</span>
                          <span>Notübernachtung Franklinstraße + Clearingstelle für nicht-versicherte EU-Bürger</span>
                        </div>
                      </>
                    )}

                    {teaserCase === 'domestic_violence' && (
                      <>
                        <div className="border-b border-slate-200 pb-2">
                          <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider block">Fallkonstellation:</span>
                          <p className="text-slate-700 mt-0.5">Mutter mit 2 Kindern (3 & 6 J.) flieht vor gewalttätigem Partner. Dringend sichere Zuflucht für heute Nacht.</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          <div className="p-2 bg-white rounded-lg border border-slate-200">
                            <span className="font-bold text-slate-900 block">🏛️ Sofort-Schutz:</span>
                            <span className="text-rose-700 font-semibold">BIG Hotline & Frauenkrisentelefon</span>
                          </div>
                          <div className="p-2 bg-white rounded-lg border border-slate-200">
                            <span className="font-bold text-slate-900 block">⚖️ Rechtsgrundlage:</span>
                            <span className="text-indigo-700 font-semibold">Gewaltschutzgesetz & SGB VIII</span>
                          </div>
                        </div>
                        <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-900">
                          <span className="font-bold block">🏢 Gematchte Anlaufstelle:</span>
                          <span>Autonomes Frauenhaus & Zufluchtswohnung Berlin</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Right 5 cols: Fast Registration / Login */}
                <div className="lg:col-span-5 p-5 bg-white border border-slate-300 rounded-2xl shadow-lg space-y-4">
                  <div className="text-center">
                    <h4 className="font-bold text-slate-900 text-sm">
                      {isAuthRegister ? 'Kostenloses Fachkraft-Konto' : 'Bei Polaris anmelden'}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      3 kostenlose KI-Triagen pro Monat inklusive
                    </p>
                  </div>

                  {authError && (
                    <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
                      {authError}
                    </div>
                  )}

                  {/* Google OAuth Button */}
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await signInWithGoogle();
                      } catch (err: any) {
                        setAuthError(err.message || 'Google Anmeldung fehlgeschlagen');
                      }
                    }}
                    className="w-full py-2 px-3 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition flex items-center justify-center gap-2 shadow-2xs cursor-pointer"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                    </svg>
                    <span>Mit Google fortfahren</span>
                  </button>

                  <div className="relative flex items-center justify-center">
                    <div className="w-full border-t border-slate-200" />
                    <span className="bg-white px-2 text-[10px] uppercase font-bold text-slate-400 absolute">
                      oder mit E-Mail
                    </span>
                  </div>

                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      setAuthError(null);
                      setAuthSubmitting(true);
                      try {
                        if (isAuthRegister) {
                          await signUpWithEmail(authEmail, authPass, {
                            full_name: authName.trim() || undefined,
                          });
                        } else {
                          await signInWithEmail(authEmail, authPass);
                        }
                      } catch (err: any) {
                        setAuthError(err.message || 'Authentifizierungsfehler');
                      } finally {
                        setAuthSubmitting(false);
                      }
                    }}
                    className="space-y-2.5"
                  >
                    {isAuthRegister && (
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Name (optional)</label>
                        <input
                          type="text"
                          placeholder="z.B. Alex M."
                          value={authName}
                          onChange={(e) => setAuthName(e.target.value)}
                          className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-600 focus:outline-none"
                        />
                      </div>
                    )}
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Dienstliche E-Mail</label>
                      <input
                        type="email"
                        required
                        placeholder="name@traeger-berlin.de"
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">Passwort</label>
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={authPass}
                        onChange={(e) => setAuthPass(e.target.value)}
                        className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-1 focus:ring-blue-600 focus:outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={authSubmitting}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-sm transition disabled:opacity-50 cursor-pointer"
                    >
                      {authSubmitting ? 'Verarbeite...' : isAuthRegister ? 'Konto erstellen & Triage starten' : 'Anmelden & Triage starten'}
                    </button>
                  </form>

                  <div className="text-center pt-1 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => { setIsAuthRegister(!isAuthRegister); setAuthError(null); }}
                      className="text-[11px] text-blue-600 hover:underline font-semibold"
                    >
                      {isAuthRegister ? 'Bereits registriert? Hier anmelden' : 'Noch kein Konto? Jetzt registrieren'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : !result ? (

            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Pitch Demo Schnellstart Pills */}
              <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/80 rounded-xl">
                <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900 mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Schnellstart / Demo-Fälle für Pitch (1-Klick):</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleSelectDemoCase('pregnant_minor')}
                    className="text-xs px-2.5 py-1.5 rounded-lg bg-white hover:bg-blue-100 text-blue-800 border border-blue-200 transition shadow-2xs text-left"
                  >
                    👶 <strong>17-J. Schwangere</strong> (Rauswurf / SGB VIII)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectDemoCase('eu_homeless_winter')}
                    className="text-xs px-2.5 py-1.5 rounded-lg bg-white hover:bg-blue-100 text-blue-800 border border-blue-200 transition shadow-2xs text-left"
                  >
                    ❄️ <strong>EU-Bürger Winter</strong> (Straße / § 67 SGB XII)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectDemoCase('domestic_violence')}
                    className="text-xs px-2.5 py-1.5 rounded-lg bg-white hover:bg-blue-100 text-blue-800 border border-blue-200 transition shadow-2xs text-left"
                  >
                    🛡️ <strong>Häusliche Gewalt</strong> (Mutter + 2 Kinder)
                  </button>
                </div>
              </div>
              
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

              {/* Limit Reached Warning Banner */}
              {!triageUsage.unlimited && triageUsage.used >= triageUsage.max && (
                <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl space-y-2 text-xs text-amber-900">
                  <div className="flex items-center gap-2 font-bold text-amber-950">
                    <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Monatliches Kontingent erreicht (3 von 3 Triagen genutzt)</span>
                  </div>
                  <p className="leading-relaxed">
                    Dein monatliches Freikontingent von 3 KI-Analysen ist für diesen Monat aufgebraucht.
                    Möchtest du Polaris unbegrenzt mit deinem gesamten Team nutzen?
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsLicenseOpen(true)}
                    className="mt-1 px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg shadow-xs transition cursor-pointer"
                  >
                    Team-Lizenz für Träger anfragen
                  </button>
                </div>
              )}

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  disabled={isLoading || (!triageUsage.unlimited && triageUsage.used >= triageUsage.max)}
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

              {/* Print-Only Client Handoff Header */}
              <div className="hidden print:block border-b-2 border-slate-900 pb-3 mb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight">POLARIS</h1>
                    <p className="text-xs text-slate-600 font-medium">Sozialarbeiter-Kompass Berlin · Persönlicher Handlungsplan</p>
                  </div>
                  <div className="text-right text-xs text-slate-600">
                    <div>Datum: {new Date().toLocaleDateString("de-DE")}</div>
                    <div>Bezirk: {formData.district || "Berlinweit"}</div>
                  </div>
                </div>
                <p className="text-[11px] text-slate-700 mt-2 bg-slate-100 p-2 rounded border border-slate-300">
                  Hinweis: Dieser Handlungsplan wurde im Rahmen einer Erstberatung erstellt. Bitte bringen Sie die abgehakten Unterlagen zu den angegebenen Sprechzeiten mit.
                </p>
              </div>

              {/* 1-Click Multi-Language Translation Pills */}
              <div className="flex items-center justify-between flex-wrap gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl print:hidden">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                  <Globe className="w-4 h-4 text-blue-600" />
                  <span>Klienten-Sprache / Translation:</span>
                </div>
                <div className="flex items-center gap-1 flex-wrap">
                  {[
                    { code: "de", label: "🇩🇪 Deutsch" },
                    { code: "uk", label: "🇺🇦 Українська" },
                    { code: "en", label: "🇬🇧 English" },
                    { code: "pl", label: "🇵🇱 Polski" },
                    { code: "ar", label: "🇸🇾 العربية" },
                    { code: "ru", label: "🇷🇺 Русский" },
                  ].map((l) => (
                    <button
                      key={l.code}
                      type="button"
                      disabled={translating}
                      onClick={() => handleLanguageChange(l.code as any)}
                      className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors cursor-pointer disabled:opacity-50 ${
                        selectedLang === l.code
                          ? "bg-blue-600 text-white shadow-xs"
                          : "bg-white text-slate-700 border border-slate-300 hover:bg-slate-100"
                      }`}
                    >
                      {translating && selectedLang === l.code ? (
                        <span className="flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> {l.label}</span>
                      ) : (
                        l.label
                      )}
                    </button>
                  ))}
                </div>
              </div>
              
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

      {/* Team License Inquiry Modal */}
      <LicenseModal
        isOpen={isLicenseOpen}
        onClose={() => setIsLicenseOpen(false)}
      />
    </div>
  );
}