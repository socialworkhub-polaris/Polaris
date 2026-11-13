'use client';

import React, { useState, useEffect } from 'react';
import { Lock, FileText, Check, Loader2, Save, User } from 'lucide-react';
import { usePersonalNotes } from '@/lib/usePersonalNotes';
import { useAuth } from '@/lib/AuthContext';

interface PersonalNotesSectionProps {
  facilityId: string;
  facilityName: string;
  onOpenAuth?: () => void;
}

export const PersonalNotesSection: React.FC<PersonalNotesSectionProps> = ({
  facilityId,
  facilityName,
  onOpenAuth,
}) => {
  const { user } = useAuth();
  const { getNoteForFacility, saveNoteForFacility, loading } = usePersonalNotes();

  const [content, setContent] = useState('');
  const [initialLoaded, setInitialLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    if (user && facilityId) {
      setInitialLoaded(false);
      getNoteForFacility(facilityId).then((text) => {
        if (isMounted) {
          setContent(text);
          setInitialLoaded(true);
        }
      });
    } else {
      setContent('');
      setInitialLoaded(true);
    }
    return () => {
      isMounted = false;
    };
  }, [user, facilityId, getNoteForFacility]);

  const handleSave = async () => {
    if (!user) {
      if (onOpenAuth) onOpenAuth();
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await saveNoteForFacility(facilityId, content);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } catch (err: any) {
      setError(err.message || 'Fehler beim Speichern der Notiz.');
    } finally {
      setIsSaving(false);
    }
  };

  // State 1: Unauthenticated user
  if (!user) {
    return (
      <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-slate-600" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Meine persönliche Notiz
            </h4>
          </div>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-200/80 px-2 py-0.5 rounded-full">
            <Lock className="w-3 h-3" />
            <span>Konto erforderlich</span>
          </span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Erstelle ein kostenloses Fachkraft-Konto, um private Ansprechpartner, Klingel-Codes und Erfahrungen zu dieser Einrichtung dauerhaft zu hinterlegen.
        </p>
        <button
          type="button"
          onClick={onOpenAuth}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <User className="w-3.5 h-3.5" />
          <span>Kostenlos anmelden</span>
        </button>
      </div>
    );
  }

  // State 2: Authenticated user
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2.5 shadow-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-600" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Meine persönliche Notiz
          </h4>
        </div>
        <span className="text-[11px] font-medium text-slate-400">
          Nur für dich sichtbar
        </span>
      </div>

      <div className="relative">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Private Notizen, interne Kontakte oder Notizen für deine Fälle (z.B. 'Frau Müller dienstags ab 14 Uhr erreichbar')..."
          rows={3}
          className="w-full text-xs text-slate-800 bg-slate-50/50 border border-slate-200 rounded-lg p-2.5 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-slate-400 resize-y"
        />
      </div>

      {error && <p className="text-xs text-rose-600">{error}</p>}

      <div className="flex items-center justify-between">
        <span className="text-[11px] text-slate-400">
          {savedSuccess && (
            <span className="inline-flex items-center gap-1 text-emerald-600 font-semibold animate-in fade-in">
              <Check className="w-3.5 h-3.5" />
              <span>Gespeichert</span>
            </span>
          )}
        </span>

        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
        >
          {isSaving ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Speichern...</span>
            </>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              <span>Notiz speichern</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
