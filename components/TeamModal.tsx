'use client';

import React, { useState } from 'react';
import {
  X,
  Users,
  UserPlus,
  Copy,
  Check,
  Building2,
  Shield,
  Trash2,
  LogOut,
  Sparkles,
  Share2,
  CheckCircle2,
  AlertCircle,
  Plus,
  CreditCard,
  Loader2,
  ArrowUpRight,
  ShieldCheck,
  Info,
} from 'lucide-react';
import { useTeam } from '@/lib/TeamContext';
import { useAuth } from '@/lib/AuthContext';
import { useLanguage } from '@/lib/LanguageContext';

interface TeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialCode?: string;
}

export const TeamModal: React.FC<TeamModalProps> = ({
  isOpen,
  onClose,
  initialCode = '',
}) => {
  const { user } = useAuth();
  const {
    organizations,
    currentOrganization,
    setCurrentOrganization,
    createTeam,
    joinTeamByCode,
    leaveTeam,
    members,
    removeMember,
    updateMemberRole,
    updateSeats,
    openBillingPortal,
    startStripeCheckout,
  } = useTeam();
  const [billingLoading, setBillingLoading] = useState(false);
  const [seatLoading, setSeatLoading] = useState(false);
  const [roleLoadingId, setRoleLoadingId] = useState<string | null>(null);
  const { t } = useLanguage();

  const [tab, setTab] = useState<'overview' | 'invite' | 'create' | 'join'>('overview');
  const [newTeamName, setNewTeamName] = useState('');
  const [joinCodeInput, setJoinCodeInput] = useState(initialCode);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://polaris-socialworkhub.net';
  const joinLink = currentOrganization
    ? `${origin}/?join=${currentOrganization.inviteCode}`
    : '';

  const handleCopyCode = async () => {
    if (!currentOrganization) return;
    try {
      await navigator.clipboard.writeText(currentOrganization.inviteCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (e) {
      console.warn('Copy failed', e);
    }
  };

  const handleCopyLink = async () => {
    if (!joinLink) return;
    try {
      await navigator.clipboard.writeText(joinLink);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (e) {
      console.warn('Copy failed', e);
    }
  };

  const handleShareWhatsApp = () => {
    if (!currentOrganization) return;
    const msg = `Hallo Team! Hier ist der Einladungslink für unseren Team-Space "${currentOrganization.name}" in Polaris:\n\n${joinLink}\n\nTeam-Code: ${currentOrganization.inviteCode}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;

    setErrorMsg(null);
    setSubmitting(true);
    try {
      const created = await createTeam(newTeamName);
      setSuccessMsg(`Team "${created.name}" erfolgreich erstellt!`);
      setNewTeamName('');
      setTimeout(() => {
        setSuccessMsg(null);
        setTab('invite');
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Fehler beim Erstellen des Teams.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;

    setErrorMsg(null);
    setSubmitting(true);
    try {
      const joined = await joinTeamByCode(joinCodeInput);
      setSuccessMsg(`Erfolgreich dem Team "${joined.name}" beigetreten!`);
      setJoinCodeInput('');
      setTimeout(() => {
        setSuccessMsg(null);
        setTab('overview');
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err.message || 'Ungültiger Team-Code.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLeaveCurrentTeam = async () => {
    if (!currentOrganization) return;
    if (!confirm(`Möchtest du das Team "${currentOrganization.name}" wirklich verlassen?`)) return;

    try {
      await leaveTeam(currentOrganization.id);
      setTab('overview');
    } catch (err: any) {
      alert('Fehler beim Verlassen des Teams: ' + err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-900 text-white">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600 rounded-xl">
              <Users className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">
                {currentOrganization ? currentOrganization.name : 'Team-Workspaces & Träger'}
              </h3>
              <p className="text-xs text-slate-400">
                Gemeinsame Notizen, Ansprechpartner & Aufnahmestopps
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2 gap-2 text-xs font-semibold text-slate-600 overflow-x-auto">
          <button
            onClick={() => { setTab('overview'); setErrorMsg(null); }}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              tab === 'overview'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Übersicht</span>
          </button>

          {currentOrganization && (
            <button
              onClick={() => { setTab('invite'); setErrorMsg(null); }}
              className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
                tab === 'invite'
                  ? 'border-blue-600 text-blue-600 font-bold'
                  : 'border-transparent hover:text-slate-900'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Kolleg*innen einladen</span>
            </button>
          )}

          <button
            onClick={() => { setTab('join'); setErrorMsg(null); }}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              tab === 'join'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Team beitreten</span>
          </button>

          <button
            onClick={() => { setTab('create'); setErrorMsg(null); }}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              tab === 'create'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Neues Team</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* TAB 1: OVERVIEW & TEAM SWITCHER */}
          {tab === 'overview' && (
            <div className="space-y-4">
              {/* Active Organization Switcher */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">
                  Aktiver Workspace:
                </label>
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setCurrentOrganization(null)}
                    className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                      currentOrganization === null
                        ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900">👤 Persönlicher Modus</div>
                      <div className="text-[11px] text-slate-500">Nur eigene Lesezeichen, keine geteilten Team-Notizen</div>
                    </div>
                    {currentOrganization === null && <Check className="w-4 h-4 text-blue-600" />}
                  </button>

                  {organizations.map((org) => {
                    const isSelected = currentOrganization?.id === org.id;
                    const isAdmin = org.role === 'admin';
                    return (
                      <button
                        key={org.id}
                        type="button"
                        onClick={() => setCurrentOrganization(org)}
                        className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                          isSelected
                            ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-500/20'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                            <Building2 className="w-3.5 h-3.5 text-blue-600" />
                            <span>{org.name}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold bg-slate-100 text-slate-600 border border-slate-200">
                              {org.inviteCode}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Deine Rolle: <span className="font-semibold text-slate-700 capitalize">{isAdmin ? 'Team-Admin' : 'Mitglied'}</span>
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-blue-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* If team is selected: Member List */}
              {currentOrganization && (
                <>
                  <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-slate-600" />
                        Team-Mitglieder ({members.length} von {currentOrganization.seatLimit || 10} Plätzen belegt)
                      </span>
                      {members.length >= (currentOrganization.seatLimit || 10) && (
                        <span className="text-[10px] text-amber-700 font-semibold mt-0.5">
                          ⚠️ Kontingent voll belegt
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => setTab('invite')}
                      className="text-xs font-bold text-blue-600 hover:underline inline-flex items-center gap-1"
                    >
                      <UserPlus className="w-3 h-3" />
                      <span>Einladen</span>
                    </button>
                  </div>

                  <div className="divide-y divide-slate-200 max-h-48 overflow-y-auto">
                    {members.map((m) => {
                      const isMe = m.userId === user?.id;
                      const isTeamAdmin = currentOrganization.role === 'admin';
                      return (
                        <div key={m.id} className="py-2 flex items-center justify-between text-xs">
                          <div>
                            <span className="font-semibold text-slate-900">
                              {m.userName} {isMe && '(Du)'}
                            </span>
                            <span className="text-slate-400 block text-[10px]">{m.userEmail}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 text-[10px] rounded-full font-semibold ${
                                m.role === 'admin'
                                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                  : 'bg-slate-200 text-slate-700'
                              }`}
                            >
                              {m.role === 'admin' ? 'Admin' : 'Mitglied'}
                            </span>
                            {isTeamAdmin && !isMe && (
                              <div className="flex items-center gap-1">
                                {m.role !== 'admin' && (
                                  <button
                                    type="button"
                                    disabled={roleLoadingId === m.userId}
                                    onClick={async () => {
                                      if (confirm(`Möchtest du ${m.userName} zum Team-Admin ernennen?`)) {
                                        setRoleLoadingId(m.userId);
                                        setErrorMsg(null);
                                        try {
                                          await updateMemberRole(currentOrganization.id, m.userId, 'admin');
                                          setSuccessMsg(`${m.userName} ist jetzt Team-Admin.`);
                                        } catch (err: any) {
                                          setErrorMsg(err.message || 'Fehler beim Ändern der Rolle.');
                                        } finally {
                                          setRoleLoadingId(null);
                                        }
                                      }
                                    }}
                                    className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors"
                                    title="Zum Team-Admin ernennen"
                                  >
                                    <ShieldCheck className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => removeMember(m.id)}
                                  className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                                  title="Mitglied entfernen"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Seat optimization helper banner for admins */}
                  {currentOrganization.role === 'admin' && (currentOrganization.seatLimit || 10) > 10 && (currentOrganization.seatLimit || 10) > members.length && (
                    <div className="p-2.5 rounded-lg bg-blue-50 border border-blue-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs text-blue-900">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <Info className="w-4 h-4 text-blue-600 shrink-0" />
                        <span>
                          <strong>{(currentOrganization.seatLimit || 10) - members.length} ungenutzte bezahlte Plätze.</strong>
                        </span>
                      </div>
                      <button
                        type="button"
                        disabled={seatLoading}
                        onClick={async () => {
                          const target = Math.max(10, members.length);
                          if (confirm(`Möchtest du die bezahlten Plätze auf ${target} reduzieren? Die Monatsgebühr in Stripe wird sofort herabgestuft.`)) {
                            setSeatLoading(true);
                            setErrorMsg(null);
                            try {
                              await updateSeats(currentOrganization.id, target);
                              setSuccessMsg(`Plätze erfolgreich auf ${target} angepasst.`);
                            } catch (err: any) {
                              setErrorMsg(err.message || 'Fehler beim Anpassen der Plätze.');
                            } finally {
                              setSeatLoading(false);
                            }
                          }
                        }}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-bold cursor-pointer transition shrink-0"
                      >
                        Auf {Math.max(10, members.length)} Plätze anpassen
                      </button>
                    </div>
                  )}

                  <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                    {currentOrganization.role === 'admin' ? (
                      <button
                        type="button"
                        disabled={seatLoading}
                        onClick={async () => {
                          const currentLimit = currentOrganization.seatLimit || 10;
                          const nextLimit = currentLimit + 1;
                          if (confirm(`Möchtest du 1 zusätzlichen Platz für dieses Team freischalten? Die monatlichen Kosten erhöhen sich um 7,90 € (inkl. MwSt.).`)) {
                            setSeatLoading(true);
                            setErrorMsg(null);
                            try {
                              await updateSeats(currentOrganization.id, nextLimit);
                              setSuccessMsg(`Team-Plätze erfolgreich auf ${nextLimit} erhöht.`);
                            } catch (err: any) {
                              setErrorMsg(err.message || 'Fehler beim Anpassen der Plätze.');
                            } finally {
                              setSeatLoading(false);
                            }
                          }
                        }}
                        className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 disabled:opacity-50 cursor-pointer"
                      >
                        {seatLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                        <span>+ Weiteren Platz zubuchen (+7,90 € / Monat inkl. MwSt.)</span>
                      </button>
                    ) : (
                      <span className="text-[11px] text-slate-400">Team-Limit: {currentOrganization.seatLimit || 10} Plätze</span>
                    )}

                    <button
                      type="button"
                      onClick={handleLeaveCurrentTeam}
                      className="text-[11px] font-medium text-red-600 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <LogOut className="w-3 h-3" />
                      <span>Team verlassen</span>
                    </button>
                  </div>
                </div>

                {/* Team Billing & License Card for Admins */}
                {currentOrganization.role === 'admin' && (
                  <div className="border border-slate-200 rounded-xl p-4 bg-slate-900 text-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-4 h-4 text-emerald-400" />
                        <span className="text-xs font-bold text-white uppercase tracking-wider">
                          Abrechnung & Lizenzstatus
                        </span>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        currentOrganization.subscriptionStatus === 'active'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : currentOrganization.subscriptionStatus === 'trialing' && (!currentOrganization.trialEndsAt || new Date(currentOrganization.trialEndsAt) > new Date())
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}>
                        {currentOrganization.subscriptionStatus === 'active'
                          ? '● Team-Lizenz Aktiv'
                          : currentOrganization.subscriptionStatus === 'trialing' && (!currentOrganization.trialEndsAt || new Date(currentOrganization.trialEndsAt) > new Date())
                          ? '● 14-Tage Testphase'
                          : '○ Inaktiv'}
                      </span>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed">
                      {currentOrganization.subscriptionStatus === 'active'
                        ? 'Dein Team nutzt die volle Polaris Team-Lizenz mit unbegrenzten KI-Triagen und geteiltem Wissen.'
                        : 'Aktiviere die Team-Lizenz oder verwalte deine Rechnungsdaten und SEPA-Lastschriften.'}
                    </p>

                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {currentOrganization.stripeCustomerId ? (
                        <button
                          type="button"
                          disabled={billingLoading}
                          onClick={async () => {
                            setBillingLoading(true);
                            setErrorMsg(null);
                            try {
                              await openBillingPortal(currentOrganization.id);
                            } catch (err: any) {
                              setErrorMsg(err.message || 'Fehler beim Öffnen des Stripe Portals.');
                            } finally {
                              setBillingLoading(false);
                            }
                          }}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {billingLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CreditCard className="w-3.5 h-3.5 text-blue-400" />}
                          <span>Rechnungen & Zahlungsart (Stripe)</span>
                          <ArrowUpRight className="w-3 h-3 text-slate-400" />
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={billingLoading}
                          onClick={async () => {
                            setBillingLoading(true);
                            setErrorMsg(null);
                            try {
                              await startStripeCheckout(currentOrganization.id);
                            } catch (err: any) {
                              setErrorMsg(err.message || 'Fehler beim Starten des Checkouts.');
                            } finally {
                              setBillingLoading(false);
                            }
                          }}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {billingLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CreditCard className="w-3.5 h-3.5" />}
                          <span>Team-Lizenz aktivieren (89 € / Monat)</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

          {/* TAB 2: INVITE COLLEAGUES */}
          {tab === 'invite' && currentOrganization && (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
                <span className="text-xs font-bold text-blue-900 block">
                  Einladungs-Code für {currentOrganization.name}
                </span>
                <p className="text-xs text-blue-800 leading-relaxed">
                  Teile diesen Code oder Link mit Kolleg*innen. Nach der Anmeldung können sie dem Team mit 1 Klick beitreten.
                </p>
              </div>

              {/* 6-char Code Box */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Team-Code (6-stellig):
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 px-4 py-3 bg-slate-100 border border-slate-300 rounded-xl font-mono text-lg font-extrabold tracking-widest text-slate-900 text-center select-all">
                    {currentOrganization.inviteCode}
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="px-4 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedCode ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedCode ? 'Kopiert!' : 'Code'}</span>
                  </button>
                </div>
              </div>

              {/* Direct Join Link */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Direkter 1-Klick Einladungs-Link:
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={joinLink}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-600 select-all"
                  />
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    <span>{copiedLink ? 'Kopiert!' : 'Link'}</span>
                  </button>
                </div>
              </div>

              {/* 1-Tap WhatsApp / Messenger Share */}
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <Share2 className="w-4 h-4" />
                <span>In Team-Chat (WhatsApp / Signal) teilen</span>
              </button>
            </div>
          )}

          {/* TAB 3: JOIN TEAM BY CODE */}
          {tab === 'join' && (
            <form onSubmit={handleJoinTeam} className="space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 leading-relaxed">
                Hast du einen 6-stelligen Team-Code von Kolleg*innen erhalten (z.B. <code className="font-bold text-slate-900 bg-white px-1.5 py-0.5 rounded border border-slate-300">CAR72K</code>)? Gib ihn hier ein, um dem Workspace beizutreten.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Team-Code:
                </label>
                <input
                  type="text"
                  required
                  placeholder="z.B. GANG72"
                  value={joinCodeInput}
                  onChange={(e) => setJoinCodeInput(e.target.value.toUpperCase())}
                  maxLength={10}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-xl text-sm font-mono font-bold tracking-widest text-slate-900 uppercase focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting || !joinCodeInput.trim()}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs shadow-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>{submitting ? 'Beitreten...' : 'Team jetzt beitreten'}</span>
              </button>
            </form>
          )}

          {/* TAB 4: CREATE NEW TEAM */}
          {tab === 'create' && (
            <form onSubmit={handleCreateTeam} className="space-y-4">
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900 leading-relaxed">
                Erstelle einen neuen Workspace für dein Streetwork- oder Beratungsteam (z.B. Caritas Mitte, Gangway Kreuzberg, AWO Spandau). Du wirst automatisch Team-Admin.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Name der Einrichtung oder des Teams:
                </label>
                <input
                  type="text"
                  required
                  placeholder="z.B. Caritas Mitte – Streetwork"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting || !newTeamName.trim()}
                className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs shadow-sm transition-colors disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                <Building2 className="w-4 h-4 text-amber-400" />
                <span>{submitting ? 'Erstelle Team...' : 'Team-Workspace erstellen'}</span>
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold rounded-xl text-xs transition-colors cursor-pointer"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};
