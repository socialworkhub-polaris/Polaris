'use client';

import React, { useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { useTeam } from '../lib/TeamContext';
import { LogIn, LogOut, User as UserIcon, X, Building2, Briefcase, MapPin, Check, Edit2, Users } from 'lucide-react';
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
  const { user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, updateProfile, logout } = useAuth();
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

  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
    setSubmitting(true);
    try {
      if (isRegister) {
        await signUpWithEmail(email, password, {
          full_name: fullName.trim() || undefined,
          facility: facility.trim() || 'Keine Angabe',
          work_area: workArea,
          district: district,
        });
      } else {
        await signInWithEmail(email, password);
      }
      setIsOpen(false);
      setEmail('');
      setPassword('');
      setFullName('');
      setFacility('');
    } catch (err: any) {
      setError(err.message || 'Authentifizierungsfehler');
    } finally {
      setSubmitting(false);
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
      });
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
    }
    setError(null);
    setSuccessMsg(null);
    setIsProfileModalOpen(true);
  };

  if (!user) {
    return (
      <>
        <button
          onClick={() => setIsOpen(true)}
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
                }}
                className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>

              <h2 className="text-base font-bold text-slate-900 mb-1">
                {isRegister ? 'Fachkraft-Konto für Polaris erstellen' : 'Bei Polaris anmelden'}
              </h2>
              <p className="text-xs text-slate-500 mb-4">
                Verwalte Favoriten, synchronisiere Notizen und nutze Triage im Team.
              </p>

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

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full mt-2 rounded-lg bg-slate-900 py-2 text-xs font-semibold text-white hover:bg-slate-800 disabled:opacity-50 transition shadow-sm"
                >
                  {submitting
                    ? 'Verarbeite...'
                    : isRegister
                    ? 'Kostenlos registrieren'
                    : 'Anmelden'}
                </button>
              </form>

              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(!isRegister);
                    setError(null);
                  }}
                  className="text-xs text-slate-600 hover:text-slate-900 font-medium underline"
                >
                  {isRegister
                    ? 'Bereits registriert? Hier anmelden'
                    : 'Noch kein Konto? Jetzt registrieren'}
                </button>
              </div>
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
        {/* Active Team Workspace Button */}
        <button
          type="button"
          onClick={() => setIsTeamModalOpen(true)}
          title="Team-Workspaces & Träger-Notizen"
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition border cursor-pointer ${
            currentOrganization
              ? 'bg-indigo-950/70 text-indigo-300 border-indigo-700/60 hover:bg-indigo-900/80 shadow-xs'
              : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white hover:bg-slate-700'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-indigo-400" />
          <span className="max-w-[110px] truncate">
            {currentOrganization ? currentOrganization.name : 'Team beitreten'}
          </span>
        </button>

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
          className="p-1.5 text-slate-400 hover:text-red-400 rounded-md hover:bg-slate-800 transition"
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

      {/* Team Spaces Modal */}
      <TeamModal
        isOpen={isTeamModalOpen}
        onClose={() => setIsTeamModalOpen(false)}
      />
    </>
  );
}
