'use client';

import React, { useState } from 'react';
import { Mail, CheckCircle2, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';

export function NewsletterCard() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.error || 'Fehler beim Abonnieren.');
      }

      setIsSuccess(true);
      setEmail('');
    } catch (err: any) {
      setError(err.message || 'Verbindungsfehler.');
    } finally {
      setLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-3 text-emerald-800 animate-in fade-in duration-200">
        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="text-xs">
          <p className="font-bold">Erfolgreich für den Newsletter angemeldet!</p>
          <p className="text-emerald-700 mt-0.5">
            Sie erhalten künftig wichtige Neuerungen und Fachbeiträge direkt in Ihr Postfach.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-5 bg-gradient-to-br from-slate-900 to-indigo-950 rounded-xl text-white shadow-md border border-slate-800">
      <div className="flex items-center gap-2 mb-1.5">
        <div className="p-1.5 bg-blue-600/30 text-blue-400 rounded-lg">
          <Mail className="w-4 h-4" />
        </div>
        <h4 className="text-sm font-bold tracking-tight">Social Work Hub Newsletter</h4>
      </div>
      <p className="text-xs text-slate-300 leading-relaxed mb-3">
        Monatliche Updates zu neuen Hilfsangeboten, Kältehilfe-Aktionen und Gesetzesänderungen für Berliner Fachkräfte.
      </p>

      {error && (
        <div className="mb-3 p-2 bg-red-950/60 border border-red-800 rounded-lg flex items-center gap-2 text-xs text-red-200">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Ihre Dienst- oder Privat-Mail..."
            className="w-full px-3 py-2 bg-slate-800/90 text-white placeholder-slate-400 border border-slate-700 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shadow-sm transition-all hover:shadow shrink-0 disabled:opacity-50 cursor-pointer"
        >
          {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          <span>{loading ? 'Anmelden...' : 'Abonnieren'}</span>
        </button>
      </form>

      <div className="mt-2.5 flex items-center gap-1.5 text-[10px] text-slate-400">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
        <span>100% DSGVO-konform (Brevo Frankfurt). Abmeldung jederzeit mit 1 Klick.</span>
      </div>
    </div>
  );
}

export default NewsletterCard;
