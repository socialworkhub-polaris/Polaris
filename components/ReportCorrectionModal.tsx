'use client';

import React, { useState } from 'react';
import { X, Flag, CheckCircle, Loader2 } from 'lucide-react';
import { Facility } from '@/types/facility';

interface ReportCorrectionModalProps {
  facility: Facility | null;
  isOpen: boolean;
  onClose: () => void;
}

export const ReportCorrectionModal: React.FC<ReportCorrectionModalProps> = ({
  facility,
  isOpen,
  onClose,
}) => {
  const [changes, setChanges] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !facility) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!changes.trim()) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          facilityId: facility.id,
          facilityName: facility.name,
          suggestedChanges: changes.trim(),
          contactEmail: email.trim(),
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Fehler beim Übermitteln der Korrektur.');
      }

      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setChanges('');
        setEmail('');
        onClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Etwas ist schiefgelaufen.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between p-4 border-b border-slate-100 bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-100 text-amber-700 rounded-lg">
              <Flag className="w-4 h-4" />
            </div>
            <h3 className="font-bold text-sm text-slate-900">Angaben oder Öffnungszeiten korrigieren</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="p-8 text-center space-y-3">
            <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto" />
            <h4 className="font-bold text-base text-slate-900">Vielen Dank für Ihre Mithilfe!</h4>
            <p className="text-xs text-slate-600">
              Ihre Korrektur wurde gespeichert und wird zeitnah in die Polaris-Datenbank eingepflegt.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div>
              <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Einrichtung:
              </span>
              <p className="text-xs font-bold text-slate-800 bg-slate-100 p-2.5 rounded-lg border border-slate-200">
                {facility.name} ({facility.district})
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="reportContent">
                Was hat sich geändert? <span className="text-red-500">*</span>
              </label>
              <textarea
                id="reportContent"
                required
                rows={4}
                value={changes}
                onChange={(e) => setChanges(e.target.value)}
                placeholder="z.B. Geänderte Notfallsprechzeit (jetzt Di & Do 9-12 Uhr), neue Telefonnummer oder Ansprechperson..."
                className="w-full text-xs p-3 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1" htmlFor="reportEmail">
                Ihre E-Mail für Rückfragen (optional):
              </label>
              <input
                id="reportEmail"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@traeger-berlin.de"
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            {error && (
              <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
                {error}
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-lg cursor-pointer"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                disabled={submitting || !changes.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Wird gesendet...</span>
                  </>
                ) : (
                  <span>Korrektur einreichen</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
