'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  ClipboardList,
  Building2,
  Users,
  Calendar,
  Lock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
  CreditCard,
  KeyRound,
  FileText,
  Mail,
  Check,
  Clock,
  Compass,
  Lightbulb,
  PhoneCall,
  ChevronRight,
} from 'lucide-react';
import { useTeam } from '@/lib/TeamContext';
import { useAuth } from '@/lib/AuthContext';

interface TeamFeatureShowcaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenLicenseModal?: () => void;
  onOpenTeamModal?: () => void;
  initialTab?: 'bulletin' | 'notes' | 'triage' | 'calendar';
}

export const TeamFeatureShowcaseModal: React.FC<TeamFeatureShowcaseModalProps> = ({
  isOpen,
  onClose,
  onOpenLicenseModal,
  onOpenTeamModal,
  initialTab = 'bulletin',
}) => {
  const { user } = useAuth();
  const { currentOrganization, startStripeCheckout } = useTeam();
  const [activeTab, setActiveTab] = useState<'bulletin' | 'notes' | 'triage' | 'calendar'>(initialTab);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Sync initial tab when opened
  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isCurrentTeamInactive =
    !!currentOrganization &&
    currentOrganization.subscriptionStatus !== 'active' &&
    currentOrganization.subscriptionStatus !== 'trialing' &&
    currentOrganization.plan !== 'pro';

  const handleStartCheckout = async () => {
    if (!user) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('polaris:open-auth'));
      }
      return;
    }

    if (onOpenLicenseModal) {
      onClose();
      onOpenLicenseModal();
      return;
    }

    setCheckoutLoading(true);
    setCheckoutError(null);
    try {
      if (currentOrganization) {
        await startStripeCheckout(currentOrganization.id);
      } else {
        await startStripeCheckout({ teamName: 'Mein Sozialarbeits-Team' });
      }
    } catch (err: any) {
      setCheckoutError(err.message || 'Fehler beim Starten des Zahlungsvorgangs.');
      setCheckoutLoading(false);
    }
  };

  const handleStartTrial = () => {
    if (!user) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('polaris:open-auth'));
      }
      return;
    }
    onClose();
    if (onOpenLicenseModal) {
      onOpenLicenseModal();
    } else if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('polaris:open-license'));
    }
  };

  const handleJoinTeam = () => {
    onClose();
    if (onOpenTeamModal) {
      onOpenTeamModal();
    } else if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('polaris:open-team'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="relative px-6 py-5 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 shadow-inner">
                <ClipboardList className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                    Träger- & Team-Paket
                  </span>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    14 Tage gratis testen
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white mt-1">
                  Schwarzes Brett & Team-Zentrale
                </h2>
                <p className="text-xs text-slate-400">
                  Nahtlose Schichtübergaben, geteiltes Einrichtungs-Wissen und unbegrenzte KI-Triage für dein Team.
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors shrink-0"
              aria-label="Schließen"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Context Banner if current team is inactive */}
          {isCurrentTeamInactive && (
            <div className="mt-3 p-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-xs text-amber-200">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>
                  Du bist im Team <strong>{currentOrganization?.name}</strong>. Die Team-Lizenz ist derzeit inaktiv.
                </span>
              </div>
              <button
                onClick={handleStartTrial}
                className="px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-bold text-[11px] border border-amber-400/30 transition cursor-pointer"
              >
                14 Tage aktivieren
              </button>
            </div>
          )}
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-slate-300 text-sm">
          
          {/* Feature Showcase Tabs */}
          <div>
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-950/80 border border-slate-800 overflow-x-auto text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('bulletin')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all shrink-0 cursor-pointer ${
                  activeTab === 'bulletin'
                    ? 'bg-indigo-600 text-white shadow-sm font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <ClipboardList className="w-4 h-4" />
                <span>Schwarzes Brett</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('notes')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all shrink-0 cursor-pointer ${
                  activeTab === 'notes'
                    ? 'bg-indigo-600 text-white shadow-sm font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Lightbulb className="w-4 h-4" />
                <span>Geteiltes Wissen</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('triage')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all shrink-0 cursor-pointer ${
                  activeTab === 'triage'
                    ? 'bg-indigo-600 text-white shadow-sm font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Sparkles className="w-4 h-4" />
                <span>Unbegrenzte KI-Triage</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('calendar')}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all shrink-0 cursor-pointer ${
                  activeTab === 'calendar'
                    ? 'bg-indigo-600 text-white shadow-sm font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Dienstkalender</span>
              </button>
            </div>

            {/* Tab Preview Box */}
            <div className="mt-4 p-4 sm:p-5 rounded-xl bg-slate-950 border border-slate-800 relative overflow-hidden">
              {activeTab === 'bulletin' && (
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>📋 Verlustfreie Schicht- & Dienstübergaben</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                          Live im Team
                        </span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Dringende Warnungen anpinnen, Übergaben zwischen Früh- und Spätdienst dokumentieren.
                      </p>
                    </div>
                  </div>

                  {/* Mock Cards */}
                  <div className="space-y-2.5">
                    <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-500/30 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-rose-300 flex items-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                          ⚠️ Dringend: Kältehilfe Notübernachtung Franklinstr.
                        </span>
                        <span className="text-[11px] text-slate-400">Heute, 14:15 Uhr</span>
                      </div>
                      <p className="text-xs text-slate-300">
                        Aufnahmestopp für heute Nacht erreicht. Bitte Klienten direkt an das Ausweichquartier in Kreuzberg verweisen.
                      </p>
                    </div>

                    <div className="p-3 rounded-lg bg-slate-900 border border-indigo-500/30 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-indigo-300 flex items-center gap-1.5">
                          <span>📌 Schichtübergabe Frühdienst (Streetwork Zoo)</span>
                        </span>
                        <span className="text-[11px] text-slate-400">Gestern, 18:30 Uhr</span>
                      </div>
                      <p className="text-xs text-slate-300">
                        Klientin Fr. S. wurde erfolgreich zur Clearingstelle begleitet. Folge-Termin mit RSD Charlottenburg für Montag vereinbart.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'notes' && (
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>💡 Geteiltes Einrichtungs-Wissen direkt an den Institutionen</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                          Exklusiv für dein Team
                        </span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Ein Kollege entdeckt einen neuen Ansprechpartner oder Klingelcode? Das ganze Team hat es sofort auf dem Schirm.
                      </p>
                    </div>
                  </div>

                  {/* Mock Note Card */}
                  <div className="p-3.5 rounded-lg bg-slate-900 border border-amber-500/30 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">Notübernachtung & Krisenwohnung Neukölln</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Aufnahme-Tipp
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">Vor 2 Tagen</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      "Klingeln bei Aufgang B (Code: 4821). Sozialarbeiter Hr. Weber ist Mo & Do ab 8:30 Uhr direkt vor Ort erreichbar. Schnelle Aufnahme bei Vorlage der Zuweisung nach § 67 SGB XII möglich."
                    </p>
                    <div className="text-[11px] text-slate-400 flex items-center gap-1.5 pt-1 border-t border-slate-800">
                      <Users className="w-3 h-3 text-indigo-400" />
                      <span>Hinterlegt von Kollegin Sarah für das Team</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'triage' && (
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>⚡ Unbegrenzte KI-Smart-Triagen</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300">
                          Kein Monatslimit
                        </span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Während das kostenlose Einzelkonto auf 3 Abfragen/Monat begrenzt ist, triagiert dein Team unlimitiert.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5">
                      <div className="font-bold text-slate-300 flex items-center gap-1.5">
                        <span>Gratiskonto</span>
                      </div>
                      <div className="text-2xl font-black text-slate-400">3 / Monat</div>
                      <p className="text-[11px] text-slate-500">
                        Ausreichend für gelegentliche Einzelrecherchen.
                      </p>
                    </div>

                    <div className="p-3 rounded-lg bg-indigo-950/40 border border-indigo-500/40 space-y-1.5">
                      <div className="font-bold text-indigo-300 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Team-Lizenz (Träger)</span>
                      </div>
                      <div className="text-2xl font-black text-indigo-200">Unbegrenzt ∞</div>
                      <p className="text-[11px] text-indigo-300/80">
                        Für alle 10 Fachkräfte. Sekundenschnelle Klärung von Zuständigkeiten (§ 67 SGB XII, BGB, SGB II, AsylbLG).
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'calendar' && (
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <span>📅 Gemeinsamer Dienst- & Außendienstkalender</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                          Synchronisiert
                        </span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Streetwork-Routen, Begleitungen zum Amt und interne Fallberatungen gemeinsam koordinieren.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <span className="w-2 h-2 rounded-full bg-blue-400" />
                        <div>
                          <div className="font-bold text-slate-200">Streetwork Außeneinsatz: Bahnhof Lichtenberg</div>
                          <div className="text-[11px] text-slate-400">Heute, 16:00 - 20:00 Uhr • Team Ost</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded">Schicht</span>
                    </div>

                    <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <span className="w-2 h-2 rounded-full bg-amber-400" />
                        <div>
                          <div className="font-bold text-slate-200">Klientenbegleitung: Bürgeramt Friedrichshain</div>
                          <div className="text-[11px] text-slate-400">Morgen, 10:00 - 11:30 Uhr • Begleitung Klient D.</div>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded">Termin</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Comparison Matrix: Free Individual vs. Team License */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Der Unterschied: Einzelkonto vs. Team-Lizenz
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Free Account Card */}
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex items-baseline justify-between border-b border-slate-800 pb-2.5">
                  <div>
                    <h4 className="font-bold text-white text-sm">Gratiskonto (Einzelkraft)</h4>
                    <p className="text-[11px] text-slate-400">Für individuelle Recherche im Außendienst</p>
                  </div>
                  <span className="text-xs font-bold text-slate-400">0 € dauerhaft</span>
                </div>

                <ul className="space-y-2 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Favoriten & Merklisten speichern</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Persönliche vertrauliche Notizen</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>3 KI-Smart-Triagen pro Monat</span>
                  </li>
                  <li className="flex items-center gap-2 text-slate-500">
                    <X className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                    <span>Kein Schwarzes Brett & Schichtübergaben</span>
                  </li>
                  <li className="flex items-center gap-2 text-slate-500">
                    <X className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                    <span>Kein geteiltes Wissen an Einrichtungen</span>
                  </li>
                </ul>
              </div>

              {/* Team License Card (Highlighted) */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-950/60 to-slate-900 border border-indigo-500/40 space-y-3 relative shadow-lg">
                <div className="flex items-baseline justify-between border-b border-indigo-500/20 pb-2.5">
                  <div>
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 text-[10px] font-bold mb-1">
                      <Sparkles className="w-3 h-3 text-indigo-400" />
                      <span>Empfohlen für Träger & Teams</span>
                    </div>
                    <h4 className="font-bold text-white text-sm">Team-Lizenz (Träger-Paket)</h4>
                    <p className="text-[11px] text-slate-400">10 Fachkraft-Zugänge inklusive</p>
                  </div>
                  <div className="text-right">
                    <div className="text-base font-black text-white">89 €</div>
                    <div className="text-[10px] text-slate-400">/ Monat (zzgl. USt.)</div>
                  </div>
                </div>

                <ul className="space-y-2 text-xs text-slate-200">
                  <li className="flex items-center gap-2 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span><strong>Gemeinsames Schwarzes Brett</strong> & Warnmeldungen</span>
                  </li>
                  <li className="flex items-center gap-2 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span><strong>Geteiltes Einrichtungs-Wissen</strong> & Insidertipps</span>
                  </li>
                  <li className="flex items-center gap-2 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span><strong>Unbegrenzte KI-Triagen</strong> für alle 10 Kolleg*innen</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span>Dienst- & Außendienstkalender synchronisiert</span>
                  </li>
                  <li className="flex items-center gap-2 text-slate-300">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>DSGVO-AVV Vertrag nach § 35 SGB I (Hosting in DE)</span>
                  </li>
                </ul>

                <div className="pt-1 flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1 text-emerald-400">
                    <RotateCcw className="w-3 h-3" />
                    Monatlich kündbar
                  </span>
                  <span>Weitere Plätze: +7,90 € / Monat</span>
                </div>
              </div>

            </div>
          </div>

          {/* Checkout Error if present */}
          {checkoutError && (
            <div className="p-3 rounded-lg bg-rose-950/50 border border-rose-500/40 text-xs text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{checkoutError}</span>
            </div>
          )}

          {/* Action CTAs */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-950 to-indigo-950/40 border border-indigo-500/30 space-y-3.5 shadow-xl">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Bereit, dein Team zu verbinden?</span>
                </h4>
                <p className="text-xs text-slate-400">
                  Schalte das Schwarze Brett, geteiltes Wissen und unbegrenzte KI-Triagen für bis zu 10 Fachkräfte frei – monatlich kündbar.
                </p>
              </div>

              {/* Action Button Group */}
              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                {/* Direct Buy Button */}
                <button
                  type="button"
                  onClick={handleStartCheckout}
                  disabled={checkoutLoading}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition-all hover:shadow-lg cursor-pointer shrink-0 disabled:opacity-50"
                >
                  <CreditCard className="w-4 h-4 text-emerald-200" />
                  <span>{checkoutLoading ? 'Verbinde...' : 'Team-Lizenz buchen (89 € / Monat)'}</span>
                </button>
              </div>
            </div>

            {/* Sub-actions / Team join helper */}
            <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-400">
              <button
                type="button"
                onClick={handleJoinTeam}
                className="hover:text-indigo-300 transition-colors inline-flex items-center gap-1.5 cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
                <span>Code von Kolleg*innen erhalten? <strong>Team beitreten</strong></span>
              </button>

              <button
                type="button"
                onClick={handleStartTrial}
                className="hover:text-slate-200 transition-colors inline-flex items-center gap-1.5 cursor-pointer text-[11px]"
              >
                <FileText className="w-3.5 h-3.5 text-slate-400" />
                <span>Kauf auf Rechnung für Träger / Behörde</span>
              </button>
            </div>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">100% datenschutzkonform nach DSGVO & § 35 SGB I</span>
            <span className="sm:hidden">DSGVO & § 35 SGB I</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer font-medium"
          >
            Schließen
          </button>
        </div>

      </div>
    </div>
  );
};

export default TeamFeatureShowcaseModal;
