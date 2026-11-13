'use client';

import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  ShieldCheck,
  FileText,
  Mail,
  Printer,
  Building2,
  Users,
  CreditCard,
  Sparkles,
  Loader2,
  KeyRound,
  Check,
  RotateCcw,
  ArrowRight,
  HelpCircle,
  Clock,
} from 'lucide-react';
import { useTeam } from '@/lib/TeamContext';
import { useAuth } from '@/lib/AuthContext';

interface LicenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenTeamModal?: () => void;
}

export default function LicenseModal({ isOpen, onClose, onOpenTeamModal }: LicenseModalProps) {
  const { user } = useAuth();
  const { currentOrganization, startStripeCheckout, redeemTrialCode } = useTeam();

  const [teamNameInput, setTeamNameInput] = useState('');
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);

  // Trial code state
  const [showCodeInput, setShowCodeInput] = useState(false);
  const [trialCode, setTrialCode] = useState('');
  const [redeemLoading, setRedeemLoading] = useState(false);
  const [redeemMsg, setRedeemMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const mailSubjectInquiry = encodeURIComponent('Frage zu Funktionen, Preisen oder Kauf auf Rechnung (Polaris)');
  const mailBodyInquiry = encodeURIComponent(
`Hallo SocialWorkHub-Team,

wir interessieren uns für die Polaris Team-Lizenz und haben folgende Fragen:

Träger / Einrichtung: 
Fachbereich (z.B. Jugendhilfe, RSD, Wohnungsnotfallhilfe): 
Ansprechpartner*in: 
Telefon: 

Unsere Frage / Gewünschte Information:
[ ] Frage zu speziellen Funktionen oder Berliner Bezirksdaten
[ ] Angebot / Kauf auf Rechnung nach § 14 UStG mit Zahlungsziel (30 Tage)
[ ] Träger-Rahmenvertrag für mehrere Einrichtungen / Standorte

Nachricht:


Mit freundlichen Grüßen,
`
  );

  const mailSubjectTrial = encodeURIComponent('Anfrage 14-Tage Testphase Polaris (Team-Pilot)');
  const mailBodyTrial = encodeURIComponent(
`Hallo SocialWorkHub-Team,

wir möchten Polaris gerne 14 Tage unverbindlich im Team testen:

Träger / Einrichtung: 
Fachbereich (z.B. Jugendhilfe, RSD, Streetwork): 
Teamgröße (Anzahl Fachkräfte): 
Ansprechpartner*in: 
Telefon / Diensthandy: 

Bitte sendet uns einen 14-Tage-Aktivierungscode für unser Team zu.

Mit freundlichen Grüßen,
`
  );

  const inquiryMailto = `mailto:kontakt@socialworkhub.net?subject=${mailSubjectInquiry}&body=${mailBodyInquiry}`;
  const trialMailto = `mailto:kontakt@socialworkhub.net?subject=${mailSubjectTrial}&body=${mailBodyTrial}`;

  const handleOnlineCheckout = async () => {
    if (!user) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('polaris:open-auth'));
      }
      setCheckoutError('Bitte melde dich zuerst an oder erstelle kurz ein Fachkraft-Konto, um das Team anzulegen.');
      return;
    }

    setCheckoutLoading(true);
    setCheckoutError(null);
    try {
      if (currentOrganization) {
        await startStripeCheckout(currentOrganization.id);
      } else {
        const trimmed = teamNameInput.trim();
        if (!trimmed) {
          setCheckoutError('Bitte gib den Namen deiner Einrichtung oder deines Teams ein.');
          setCheckoutLoading(false);
          return;
        }
        await startStripeCheckout({ teamName: trimmed });
      }
    } catch (err: any) {
      setCheckoutError(err.message || 'Fehler beim Starten des Zahlungsvorgangs.');
      setCheckoutLoading(false);
    }
  };

  const handleRedeemCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trialCode.trim()) return;

    if (!user) {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('polaris:open-auth'));
      }
      setRedeemMsg({ type: 'error', text: 'Bitte zuerst anmelden.' });
      return;
    }

    if (!currentOrganization) {
      setRedeemMsg({ type: 'error', text: 'Bitte wähle zuerst ein Team aus oder erstelle eines im Team-Menü.' });
      return;
    }

    setRedeemLoading(true);
    setRedeemMsg(null);
    try {
      const res = await redeemTrialCode(currentOrganization.id, trialCode.trim());
      setRedeemMsg({ type: 'success', text: res.message || '14 Tage Testphase erfolgreich freigeschaltet!' });
      setTrialCode('');
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      setRedeemMsg({ type: 'error', text: err.message || 'Code ungültig oder abgelaufen.' });
    } finally {
      setRedeemLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                Team-Lizenz für Fachkräfte & Träger
              </h2>
              <p className="text-xs text-slate-400">
                Arbeitsplatzausstattung für Beratungsstellen, Jugendhilfe, Ämter und Krisendienste
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Schließen"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-300 text-sm">
          
          {/* Main Pricing Box */}
          <div className="p-5 rounded-xl bg-gradient-to-br from-slate-800/90 to-slate-800/40 border border-slate-700/80 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-700/60">
              <div>
                <span className="text-xs uppercase tracking-wider font-semibold text-emerald-400">
                  Standard Träger-Paket
                </span>
                <div className="text-2xl font-black text-white mt-0.5 flex items-baseline gap-2">
                  <span>89 €</span>
                  <span className="text-xs font-normal text-slate-400">/ Monat (zzgl. USt.)</span>
                </div>
                {/* PROMINENT MONTHLY TERMINATION BADGE */}
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-400/30 text-blue-300 text-[11px] font-bold mt-2">
                  <RotateCcw className="w-3 h-3 text-blue-400" />
                  <span>Monatlich kündbar • Keine Mindestvertragslaufzeit</span>
                </div>
              </div>
              <div className="text-left sm:text-right space-y-1">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-semibold">
                  <Users className="w-4 h-4" />
                  <span>10 Fachkraft-Zugänge inklusive</span>
                </div>
                {/* EXTRA SEATS PRICE */}
                <div className="text-xs text-slate-300 font-medium">
                  Zusatzplätze flexibel: <span className="text-emerald-400 font-bold">+7,90 €</span> / Monat je weiterem Platz
                </div>
              </div>
            </div>

            {/* Included Value Points */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Unbegrenzte KI-Smart-Triagen</strong> für das gesamte Team</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Geteilte Team-Notizen</strong> & interne Kontaktdaten</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Team-Hub</strong> mit Ankündigungen & Übergabe-Kalender</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>DSGVO-Auftragsverarbeitung (AVV nach Art. 28) & § 35 SGB I</span>
              </div>
            </div>
          </div>

          {/* ========================================================================= */}
          {/* PATH 1: 14-DAY FREE PILOT (HIGH VISIBILITY / PROMINENT HERO CARD) */}
          {/* ========================================================================= */}
          <div className="relative overflow-hidden p-5 bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-slate-800/60 border-2 border-amber-500/40 rounded-xl space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-300">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-extrabold text-white tracking-wide">
                  14 Tage kostenlos im Team testen
                </h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider">
                Empfohlen für neue Teams
              </span>
            </div>

            <p className="text-xs text-amber-100/90 leading-relaxed">
              Erprobe alle Team-Features (unbegrenzte Triagen, Team-Notizen & Hub) unverbindlich in deinem Arbeitsalltag mit bis zu 10 Kolleg*innen.
            </p>

            <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold text-amber-300">
              <span className="inline-flex items-center gap-1">
                <Check className="w-3.5 h-3.5 text-amber-400" />
                Keine Zahlungsdaten erforderlich
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                Endet automatisch (kein Abo)
              </span>
            </div>

            <div className="pt-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <a
                href={trialMailto}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs transition-colors shadow-sm text-center"
              >
                <Mail className="w-4 h-4" />
                <span>Kostenlosen Pilot-Code anfordern (E-Mail)</span>
              </a>

              <button
                type="button"
                onClick={() => setShowCodeInput(!showCodeInput)}
                className="px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-semibold transition-colors text-center"
              >
                <KeyRound className="w-3.5 h-3.5 inline mr-1 text-amber-400" />
                <span>{showCodeInput ? 'Feld schließen' : 'Code einlösen'}</span>
              </button>
            </div>

            {/* Code Redemption Input */}
            {showCodeInput && (
              <form onSubmit={handleRedeemCode} className="pt-2 space-y-2 animate-in fade-in">
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    value={trialCode}
                    onChange={(e) => setTrialCode(e.target.value)}
                    placeholder="z.B. TEST-PILOT-2026"
                    className="flex-1 uppercase font-mono text-xs px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white outline-none focus:border-amber-400"
                  />
                  <button
                    type="submit"
                    disabled={redeemLoading || !trialCode.trim()}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg disabled:opacity-50 transition-colors"
                  >
                    {redeemLoading ? '...' : 'Aktivieren'}
                  </button>
                </div>
                {redeemMsg && (
                  <p className={`text-[11px] font-semibold ${redeemMsg.type === 'success' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {redeemMsg.text}
                  </p>
                )}
              </form>
            )}
          </div>

          {/* ========================================================================= */}
          {/* PATH 2: INSTANT SELF-SERVE PURCHASE (BUY RIGHT AWAY VIA STRIPE) */}
          {/* ========================================================================= */}
          <div className="p-5 bg-slate-800/70 border border-slate-700/80 rounded-xl space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                  <CreditCard className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                    Direkt online starten (Sofortige Freischaltung)
                  </h4>
                  <p className="text-[11px] text-slate-400">
                    Abrechnung bequem per Firmenkreditkarte oder SEPA-Lastschrift
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md">
                Monatlich kündbar
              </span>
            </div>

            {/* Team input if no team is selected yet */}
            {!currentOrganization && (
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-200">
                  Name deiner Einrichtung oder deines Teams:
                </label>
                <input
                  type="text"
                  value={teamNameInput}
                  onChange={(e) => setTeamNameInput(e.target.value)}
                  placeholder="z.B. Jugendwohngruppe Neukölln oder Krisenteam Mitte"
                  className="w-full text-xs px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white outline-none focus:border-emerald-500 transition-colors placeholder:text-slate-500"
                />
              </div>
            )}

            {currentOrganization && (
              <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-700/60 text-xs flex items-center justify-between">
                <span className="text-slate-300">
                  Lizenz für Team: <strong className="text-white">{currentOrganization.name}</strong>
                </span>
                <span className="text-[10px] font-mono text-slate-400">Code: {currentOrganization.inviteCode}</span>
              </div>
            )}

            {checkoutError && (
              <div className="p-3 bg-red-950/40 border border-red-800/60 text-red-300 rounded-lg text-xs">
                {checkoutError}
              </div>
            )}

            <button
              type="button"
              onClick={handleOnlineCheckout}
              disabled={checkoutLoading}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-lg transition-all cursor-pointer disabled:opacity-50"
            >
              {checkoutLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Öffne sichere Kasse...</span>
                </>
              ) : (
                <>
                  <CreditCard className="w-4 h-4" />
                  <span>Team-Lizenz jetzt buchen (89 € / Monat)</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
            <p className="text-[10px] text-slate-400 text-center">
              🔒 Verschlüsselte Zahlung über Stripe • Automatische Rechnungsstellung mit USt-Ausweis • Jederzeit zum Monatsende kündbar
            </p>
          </div>

          {/* ========================================================================= */}
          {/* PATH 3: QUESTIONS ABOUT FUNCTIONS & B2B INVOICE PROCUREMENT */}
          {/* ========================================================================= */}
          <div className="p-4 bg-slate-800/40 border border-slate-700/60 rounded-xl space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
              <HelpCircle className="w-4 h-4 text-blue-400" />
              <span>Fragen zu Funktionen, Träger-Rahmenverträgen oder Kauf auf Rechnung</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Du hast Fragen zur Einbindung, benötigst ein offizielles Angebot für deinen Fachbereich oder möchtest per Überweisung mit 30 Tagen Zahlungsziel bestellen?
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 pt-1">
              <a
                href={inquiryMailto}
                className="flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold transition-colors text-center"
              >
                <Mail className="w-3.5 h-3.5 text-blue-400" />
                <span>Frage stellen / Angebot anfordern (E-Mail)</span>
              </a>
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-xs font-semibold transition-colors text-center"
              >
                <Printer className="w-3.5 h-3.5 text-slate-400" />
                <span>Beschaffungsantrag (PDF)</span>
              </button>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-900 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
          >
            Schließen
          </button>
        </div>

      </div>
    </div>
  );
}
