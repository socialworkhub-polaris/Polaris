'use client';

import React, { useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { useTeam } from '../lib/TeamContext';
import { LogIn, LogOut, User as UserIcon, X, Building2, Briefcase, MapPin, Check, Edit2, Users, Mail, CheckCircle2, RotateCw, ArrowRight } from 'lucide-react';
import { BERLIN_DISTRICTS } from '@/data/districts';
import { TeamModal } from './TeamModal';
import { useLanguage } from '@/lib/LanguageContext';

const WORK_AREAS = [
  'Keine Angabe / Prefer not to share',
  'Kinder- & Jugendhilfe (SGB VIII)',
  'Wohnungslosenhilfe & Kältehilfe (§ 67 SGB XII)',
  'Existenzsicherung & Beratung (SGB II / XII)',
  'Sucht- & Drogenhilfe',
  'Flucht, Asyl & Migration',
  'Sozialpsychiatrie & Krisenintervention',
  'Sonstiges / Other',
];

export default function UserMenu() {
  const { user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, resendVerificationEmail, updateProfile, logout } = useAuth();
  const { currentOrganization } = useTeam();
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [facility, setFacility] = useState('');
  const [workArea, setWorkArea] = useState('Keine Angabe / Prefer not to share');
  const [district, setDistrict] = useState('Keine Angabe / Prefer not to share');
  const [newsletterOptIn, setNewsletterOptIn] = useState(true);

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [confirmationSentEmail, setConfirmationSentEmail] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [unconfirmedEmail, setUnconfirmedEmail] = useState<string | null>(null);

  React.useEffect(() => {
    const handleOpenAuth = () => {
      setIsOpen(true);
      setIsRegister(true);
    };
    window.addEventListener('polaris:open-auth', handleOpenAuth);
    return () => window.removeEventListener('polaris:open-auth', handleOpenAuth);
  }, []);

  if (loading) {
    return (
      <div className="h-8 w-8 rounded-full bg-slate-200 animate-pulse border border-slate-300" />
    );
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setResendSuccess(false);
    setUnconfirmedEmail(null);
    setSubmitting(true);
    try {
      if (isRegister) {
        const { user: registeredUser, session } = await signUpWithEmail(email, password, {
          full_name: fullName.trim() || undefined,
          facility: facility.trim() || 'Keine Angabe',
          work_area: workArea,
          district: district,
          newsletter_opt_in: newsletterOptIn,
          newsletter_opt_in_at: newsletterOptIn ? new Date().toISOString() : undefined,
        });

        if (newsletterOptIn) {
          fetch('/api/newsletter/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: email.trim().toLowerCase(),
              name: fullName.trim() || undefined,
              attributes: {
                FACILITY: facility.trim() || undefined,
                WORK_AREA: workArea,
                DISTRICT: district,
                SOURCE: 'signup_opt_in',
              },
            }),
          }).catch((err) => console.warn('Newsletter subscribe on signup failed:', err));
        }

        // Check if an email confirmation is required:
        if (!session) {
          if (registeredUser && registeredUser.identities && registeredUser.identities.length === 0) {
            setError('Diese E-Mail-Adresse ist bereits registriert. Bitte melde dich an.');
            setIsRegister(false);
            return;
          }
          setConfirmationSentEmail(email);
          return;
        }

        // If session exists immediately (email confirmation disabled in Supabase)
        setIsOpen(false);
        setEmail('');
        setPassword('');
        setFullName('');
        setFacility('');
      } else {
        await signInWithEmail(email, password);
        setIsOpen(false);
        setEmail('');
        setPassword('');
      }
    } catch (err: any) {
      const msg = err.message || '';
      if (msg.toLowerCase().includes('email not confirmed')) {
        setError('Deine E-Mail-Adresse wurde noch nicht bestätigt. Bitte klicke auf den Bestätigungslink in deiner E-Mail.');
        setUnconfirmedEmail(email);
      } else if (msg.toLowerCase().includes('invalid login credentials')) {
        setError('Ungültige E-Mail-Adresse oder Passwort. Bitte überprüfe deine Eingaben.');
      } else if (msg.toLowerCase().includes('user already registered')) {
        setError('Diese E-Mail-Adresse ist bereits registriert. Bitte melde dich an.');
        setIsRegister(false);
      } else if (msg.toLowerCase().includes('password should be at least')) {
        setError('Das Passwort muss mindestens 6 Zeichen lang sein.');
      } else {
        setError(msg || 'Authentifizierungsfehler');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendConfirmation = async (targetEmail: string) => {
    if (!targetEmail) return;
    setResending(true);
    setError(null);
    try {
      await resendVerificationEmail(targetEmail);
      setResendSuccess(true);
      setTimeout(() => setResendSuccess(false), 6000);
    } catch (err: any) {
      setError(err.message || 'Fehler beim erneuten Senden der Bestätigungs-E-Mail.');
    } finally {
      setResending(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError(null);
    try {
      await signInWithGoogle();
      setIsOpen(false);
    } catch (err: any) {
      setError(err.message || 'Fehler bei Google Anmeldung');
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await updateProfile({
        full_name: fullName.trim() || undefined,
        facility: facility.trim() || 'Keine Angabe',
        work_area: workArea,
        district: district,
        newsletter_opt_in: newsletterOptIn,
        newsletter_opt_in_at: newsletterOptIn ? (user?.user_metadata?.newsletter_opt_in_at || new Date().toISOString()) : undefined,
      });

      if (newsletterOptIn && user?.email) {
        fetch('/api/newsletter/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: user.email,
            name: fullName.trim() || undefined,
            attributes: {
              FACILITY: facility.trim() || undefined,
              WORK_AREA: workArea,
              DISTRICT: district,
              SOURCE: 'profile_update',
            },
          }),
        }).catch((err) => console.warn('Newsletter subscribe failed:', err));
      }

      setSuccessMsg('Profil erfolgreich gespeichert!');
      setTimeout(() => {
        setSuccessMsg(null);
        setIsProfileModalOpen(false);
      }, 1000);
    } catch (err: any) {
      setError(err.message || 'Fehler beim Speichern');
    } finally {
      setSubmitting(false);
    }
  };

  const openProfileEdit = () => {
    if (user?.user_metadata) {
      setFullName(user.user_metadata.full_name || '');
      setFacility(user.user_metadata.facility || '');
      setWorkArea(user.user_metadata.work_area || 'Keine Angabe / Prefer not to share');
      setDistrict(user.user_metadata.district || 'Keine Angabe / Prefer not to share');
      setNewsletterOptIn(!!user.user_metadata.newsletter_opt_in);
    } else {
      setNewsletterOptIn(false);
    }
    setError(null);
    setSuccessMsg(null);
    setIsProfileModalOpen(true);
  };

  if (!user) {
    return (
      <>
        <button
          onClick={() => {
            setIsOpen(true);
            setError(null);
            setConfirmationSentEmail(null);
            setUnconfirmedEmail(null);
            setResendSuccess(false);
          }}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white text-slate-900 hover:bg-slate-100 text-xs font-semibold transition-all shadow-sm hover:shadow cursor-pointer shrink-0"
        >
          <LogIn className="w-3.5 h-3.5 text-blue-600" />
          <span>{t.signIn}</span>
        </button>

        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
            <div className="relative w-full max-w-md rounded-xl bg-white p-6 shadow-2xl border border-slate-200 my-8">
              <button
                onClick={() => {
                  setIsOpen(false);
                  setError(null);
                  setConfirmationSentEmail(null);
                  setUnconfirmedEmail(null);
                  setResendSuccess(false);
                }}
                className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {confirmationSentEmail ? (
                <div className="text-center py-2">
                  <div className="mx-auto w-12 h-12 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center mb-3">
                    <Mail className="w-6 h-6 text-blue-600" />
                  </div>

                  <h2 className="text-base font-bold text-slate-900 mb-1">
                    Bestätigungs-E-Mail gesendet!
                  </h2>
                  <p className="text-xs text-slate-600 mb-4 max-w-sm mx-auto">
                    Wir haben einen Aktivierungslink an <strong className="text-slate-900 font-semibold">{confirmationSentEmail}</strong> gesendet.
                    Bitte klicke auf den Link in der E-Mail, um dein Fachkraft-Konto freizuschalten.
                  </p>

                  <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 text-[11px] text-slate-600 mb-4 text-left">
                    <p className="font-semibold text-slate-800 mb-1">Keine E-Mail angekommen?</p>
                    <ul className="list-disc list-inside space-y-0.5 text-slate-500">
                      <li>Bitte überprüfe auch deinen <strong>Spam- oder Junk-Ordner</strong>.</li>
                      <li>Manche Träger-Server filtern neue Absender kurz vor der Zustellung.</li>
                    </ul>
                  </div>

                  {resendSuccess && (
                    <div className="mb-3 rounded-lg bg-emerald-50 p-2.5 text-xs text-emerald-700 border border-emerald-200 flex items-center justify-center gap-1.5 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Bestätigungslink wurde erneut gesendet!</span>
                    </div>
                  )}

                  {error && (
                    <div className="mb-3 rounded-lg bg-red-50 p-2.5 text-xs text-red-600 border border-red-200">
                      {error}
                    </div>
                  )}

                  <div className="space-y-2 pt-1">
                    <button
                      type="button"
                      disabled={resending || resendSuccess}
                      onClick={() => handleResendConfirmation(confirmationSentEmail)}
                      className="w-full flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition disabled:opacity-50 cursor-pointer shadow-xs"
                    >
                      <RotateCw className={`w-3.5 h-3.5 ${resending ? 'animate-spin' : ''}`} />
                      <span>{resending ? 'Sende erneut...' : 'E-Mail erneut senden'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setConfirmationSentEmail(null);
                        setIsRegister(false);
                        setError(null);
                        setUnconfirmedEmail(null);
                      }}
                      className="w-full flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white hover:bg-slate-800 transition shadow-sm cursor-pointer"
                    >
                      <span>Bereits bestätigt? Zum Login</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="text-base font-bold text-slate-900 mb-1">
                    {isRegister ? 'Fachkraft-Konto für Polaris erstellen' : 'Bei Polaris anmelden'}
                  </h2>
                  <p className="text-xs text-slate-500 mb-4">
                    Verwalte Favoriten, synchronisiere Notizen und nutze Triage im Team.
                  </p>

                  {resendSuccess && (
                    <div className="mb-3 rounded-lg bg-emerald-50 p-2.5 text-xs text-emerald-700 border border-emerald-200 flex items-center gap-1.5 font-medium">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Bestätigungs-E-Mail wurde erfolgreich erneut gesendet!</span>
                    </div>
                  )}

                  {error && (
                    <div className="mb-3 rounded-lg bg-red-50 p-2.5 text-xs text-red-600 border border-red-200">
                      {error}
                    </div>
                  )}

              {/* Google Button */}
              <button
                type="button"
                onClick={handleGoogleAuth}
                className="w-full flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-xs mb-4"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Mit Google fortfahren</span>
              </button>

              <div className="relative mb-4 flex items-center justify-center">
                <div className="w-full border-t border-slate-200" />
                <span className="bg-white px-2 text-[10px] uppercase font-bold text-slate-400 absolute">
                  oder mit E-Mail
                </span>
              </div>

              {/* Form */}
              <form onSubmit={handleEmailAuth} className="space-y-3">
                {isRegister && (
                  <>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                        Name / Pseudonym <span className="text-slate-400 font-normal">(optional)</span>
                      </label>
                      <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="z.B. Alex M."
                        className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                        Einrichtung / Träger <span className="text-slate-400 font-normal">(optional)</span>
                      </label>
                      <input
                        type="text"
                        value={facility}
                        onChange={(e) => setFacility(e.target.value)}
                        placeholder="z.B. Caritas, Diakonie, Jugendamt..."
                        className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                          Arbeitsbereich
                        </label>
                        <select
                          value={workArea}
                          onChange={(e) => setWorkArea(e.target.value)}
                          className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-[11px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                        >
                          {WORK_AREAS.map((wa) => (
                            <option key={wa} value={wa}>{wa}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                          Bezirk / Region
                        </label>
                        <select
                          value={district}
                          onChange={(e) => setDistrict(e.target.value)}
                          className="w-full rounded-md border border-slate-300 px-2 py-1.5 text-[11px] text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                        >
                          <option value="Keine Angabe / Prefer not to share">Keine Angabe / Prefer not to share</option>
                          <option value="Überbezirklich / Ganz Berlin">Überbezirklich / Ganz Berlin</option>
                          {BERLIN_DISTRICTS.map((d) => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                    Dienstliche oder private E-Mail
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@traeger.de"
                    className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-0.5">
                    Passwort
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-md border border-slate-300 px-2.5 py-1.5 text-xs text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900"
                  />
                </div>

                {isRegister && (
                  <div className="pt-1">
                    <label className="flex items-start gap-2.5 cursor-pointer text-slate-700 select-none">
                      <input
                        type="checkbox"
                        checked={newsletterOptIn}
                        onChange={(e) => setNewsletterOptIn(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <div className="text-[11px] leading-tight">
                        <span className="font-semibold text-slate-800">
                          Newsletter für Soziale Arbeit abonnieren
                        </span>
                        <p className="text-[10px] text-slate-500 mt-0.5 leading-normal">
                          Monatliche Updates zu Kältehilfe, neuen Hilfsangeboten & SGB-Rechtsänderungen in Berlin. Jederzeit mit 1 Klick abbestellbar.
                        </p>
                      </div>
                    </label>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full mt-2 rounded-lg bg-slate-900 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50 transition shadow-sm cursor-pointer"
                >
                  {submitting
                    ? 'Verarbeite...'
                    : isRegister
                    ? 'Kostenlos registrieren'
                    : 'Anmelden'}
                </button>

                {unconfirmedEmail && (
                  <div className="pt-1 text-center">
                    <button
                      type="button"
                      disabled={resending}
                      onClick={() => handleResendConfirmation(unconfirmedEmail)}
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                    >
                      <RotateCw className={`w-3 h-3 ${resending ? 'animate-spin' : ''}`} />
                      <span>{resending ? 'Sende erneut...' : 'Bestätigungs-E-Mail jetzt erneut senden'}</span>
                    </button>
                  </div>
                )}
              </form>

              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(!isRegister);
                    setError(null);
                    setUnconfirmedEmail(null);
                    setResendSuccess(false);
                  }}
                  className="text-xs text-slate-600 hover:text-slate-900 font-medium underline cursor-pointer"
                >
                  {isRegister
                    ? 'Bereits registriert? Hier anmelden'
                    : 'Noch kein Konto? Jetzt registrieren'}
                </button>
              </div>
            </>
          )}
            </div>
          </div>
        )}
      </>
    );
  }

  const avatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture;
  const displayName = user.user_metadata?.full_name || user.user_metadata?.name || user.email;
  const userFacility = user.user_metadata?.facility;
  const userWorkArea = user.user_metadata?.work_area;

  return (
    <>
      <div className="flex items-center gap-1.5">
        <button
          onClick={openProfileEdit}
          title="Fachkraft-Profil bearbeiten"
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-200 transition text-xs cursor-pointer group"
        >
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt={displayName || 'Profil'}
              className="h-5 w-5 rounded-full object-cover border border-slate-500"
            />
          ) : (
            <div className="h-5 w-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px] font-bold">
              {user.email ? user.email.charAt(0).toUpperCase() : <UserIcon className="w-3 h-3" />}
            </div>
          )}
          <span className="font-medium max-w-[110px] truncate text-slate-100">
            {displayName}
          </span>
          <Edit2 className="w-3 h-3 text-slate-400 group-hover:text-blue-300 ml-0.5" />
        </button>

        <button
          onClick={() => logout()}
          title="Abmelden"
          className="p-1.5 text-slate-400 hover:text-red-400 rounded-md hover:bg-slate-800 transition cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Edit Profile Modal */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-md rounded-xl bg-slate-900 border border-slate-700 p-6 shadow-2xl text-slate-200">
            <button
              onClick={() => setIsProfileModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>

            <h3 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <UserIcon className="w-4 h-4 text-blue-400" />
              <span>Fachkraft-Profil anpassen</span>
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Angemeldet als <strong className="text-slate-200">{user.email}</strong>. Alle Angaben sind freiwillig.
            </p>

            {error && (
              <div className="mb-3 rounded bg-red-950/50 border border-red-800 p-2 text-xs text-red-300">
                {error}
              </div>
            )}
            {successMsg && (
              <div className="mb-3 rounded bg-emerald-950/50 border border-emerald-800 p-2 text-xs text-emerald-300 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                <span>{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveProfile} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Name / Anzeigename
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="z.B. Alex M."
                  className="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Einrichtung / Träger
                </label>
                <input
                  type="text"
                  value={facility}
                  onChange={(e) => setFacility(e.target.value)}
                  placeholder="z.B. Caritas, Diakonie, Freie Praxis..."
                  className="w-full rounded-md bg-slate-800 border border-slate-700 px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Arbeitsbereich / Fachfeld
                </label>
                <select
                  value={workArea}
                  onChange={(e) => setWorkArea(e.target.value)}
                  className="w-full rounded-md bg-slate-800 border border-slate-700 px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  {WORK_AREAS.map((wa) => (
                    <option key={wa} value={wa}>{wa}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Hauptarbeitsbezirk
                </label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full rounded-md bg-slate-800 border border-slate-700 px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="Keine Angabe / Prefer not to share">Keine Angabe / Prefer not to share</option>
                  <option value="Überbezirklich / Ganz Berlin">Überbezirklich / Ganz Berlin</option>
                  {BERLIN_DISTRICTS.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="pt-1">
                <label className="flex items-start gap-2.5 cursor-pointer text-slate-300 select-none bg-slate-800/60 p-2.5 rounded-lg border border-slate-700">
                  <input
                    type="checkbox"
                    checked={newsletterOptIn}
                    onChange={(e) => setNewsletterOptIn(e.target.checked)}
                    className="mt-0.5 h-4 w-4 rounded border-slate-600 bg-slate-900 text-blue-500 focus:ring-blue-500 cursor-pointer"
                  />
                  <div className="text-[11px] leading-tight">
                    <span className="font-semibold text-white">
                      Social Work Hub Newsletter abonnieren
                    </span>
                    <p className="text-[10px] text-slate-400 mt-0.5 leading-normal">
                      Monatliche Fachinfos, Kältehilfe-Updates und Neuerungen in Berlin. Jederzeit abbestellbar.
                    </p>
                  </div>
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsProfileModalOpen(false)}
                  className="px-3 py-1.5 text-xs rounded-lg text-slate-400 hover:text-white"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition disabled:opacity-50"
                >
                  {submitting ? 'Speichere...' : 'Speichern'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
