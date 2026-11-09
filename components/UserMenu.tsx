'use client';

import React, { useState } from 'react';
import { useAuth } from '../lib/AuthContext';
import { LogIn, LogOut, User as UserIcon, X } from 'lucide-react';

export default function UserMenu() {
  const { user, loading, signInWithGoogle, signInWithEmail, signUpWithEmail, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
        await signUpWithEmail(email, password);
      } else {
        await signInWithEmail(email, password);
      }
      setIsOpen(false);
      setEmail('');
      setPassword('');
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

  if (!user) {
    return (
      <>
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 text-white hover:bg-slate-800 text-xs font-medium transition shadow-sm"
        >
          <LogIn className="w-3.5 h-3.5" />
          <span>Anmelden</span>
        </button>

        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="relative w-full max-w-sm rounded-xl bg-white p-6 shadow-xl border border-slate-200">
              <button
                onClick={() => {
                  setIsOpen(false);
                  setError(null);
                }}
                className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>

              <h2 className="text-base font-semibold text-slate-900 mb-1">
                {isRegister ? 'Konto für Polaris erstellen' : 'Bei Polaris anmelden'}
              </h2>
              <p className="text-xs text-slate-500 mb-4">
                Speichere Notizen und verwalte Einrichtungs-Favoriten.
              </p>

              {error && (
                <div className="mb-3 rounded bg-red-50 p-2 text-xs text-red-600 border border-red-200">
                  {error}
                </div>
              )}

              {/* Google Button */}
              <button
                type="button"
                onClick={handleGoogleAuth}
                className="w-full flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 transition shadow-sm mb-4"
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
                <span className="bg-white px-2 text-[10px] uppercase text-slate-400 absolute">
                  oder mit E-Mail
                </span>
              </div>

              {/* Email/Password Form */}
              <form onSubmit={handleEmailAuth} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
                    E-Mail
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
                  <label className="block text-[11px] font-medium text-slate-600 mb-1">
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
                  className="w-full mt-2 rounded-lg bg-slate-900 py-1.5 text-xs font-medium text-white hover:bg-slate-800 disabled:opacity-50 transition"
                >
                  {submitting
                    ? 'Verarbeite...'
                    : isRegister
                    ? 'Registrieren'
                    : 'Anmelden'}
                </button>
              </form>

              <div className="mt-3 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsRegister(!isRegister);
                    setError(null);
                  }}
                  className="text-[11px] text-slate-500 hover:text-slate-800 underline"
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

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-50 border border-slate-200">
        {user.photoURL ? (
          <img
            src={user.photoURL}
            alt={user.displayName || 'Profil'}
            className="h-6 w-6 rounded-full object-cover border border-slate-200"
          />
        ) : (
          <div className="h-6 w-6 rounded-full bg-slate-800 text-white flex items-center justify-center text-[10px] font-semibold">
            {user.email ? user.email.charAt(0).toUpperCase() : <UserIcon className="w-3 h-3" />}
          </div>
        )}
        <span className="text-xs text-slate-700 font-medium max-w-[120px] truncate">
          {user.displayName || user.email}
        </span>
      </div>

      <button
        onClick={() => logout()}
        title="Abmelden"
        className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 transition"
      >
        <LogOut className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}