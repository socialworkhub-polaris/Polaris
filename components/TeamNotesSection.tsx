'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Building2,
  Pin,
  Trash2,
  Send,
  Plus,
  AlertTriangle,
  Lightbulb,
  UserCheck,
  FileText,
  Loader2,
  Lock,
} from 'lucide-react';
import { useTeam } from '@/lib/TeamContext';
import { useAuth } from '@/lib/AuthContext';
import { FacilityTeamNote, NoteCategory } from '@/types/team';

interface TeamNotesSectionProps {
  facilityId: string;
  facilityName: string;
  onOpenTeamModal: () => void;
}

const CATEGORY_CONFIG: Record<
  NoteCategory,
  { label: string; icon: any; color: string; bg: string; border: string }
> = {
  contact_person: {
    label: 'Ansprechpartner*in',
    icon: UserCheck,
    color: 'text-blue-700',
    bg: 'bg-blue-50',
    border: 'border-blue-200',
  },
  intake_tip: {
    label: 'Aufnahme-Tipp',
    icon: Lightbulb,
    color: 'text-amber-800',
    bg: 'bg-amber-50',
    border: 'border-amber-200',
  },
  warning: {
    label: 'Achtung / Kapazität',
    icon: AlertTriangle,
    color: 'text-rose-700',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
  },
  general: {
    label: 'Allgemeiner Vermerk',
    icon: FileText,
    color: 'text-slate-700',
    bg: 'bg-slate-100',
    border: 'border-slate-200',
  },
};

export const TeamNotesSection: React.FC<TeamNotesSectionProps> = ({
  facilityId,
  facilityName,
  onOpenTeamModal,
}) => {
  const { user } = useAuth();
  const {
    currentOrganization,
    fetchNotesForFacility,
    addNoteForFacility,
    deleteNote,
    togglePinNote,
  } = useTeam();

  const [notes, setNotes] = useState<FacilityTeamNote[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<NoteCategory>('intake_tip');
  const [content, setContent] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadNotes = useCallback(async () => {
    if (!currentOrganization) {
      setNotes([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const data = await fetchNotesForFacility(facilityId);
      setNotes(data);
    } catch (err) {
      console.warn('Error loading notes:', err);
    } finally {
      setLoading(false);
    }
  }, [currentOrganization, facilityId, fetchNotesForFacility]);

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setSubmitting(true);
    setErrorMsg(null);
    try {
      const newNote = await addNoteForFacility(facilityId, selectedCategory, content);
      setNotes((prev) => [newNote, ...prev]);
      setContent('');
      setIsAdding(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Fehler beim Speichern der Notiz.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (noteId: string) => {
    if (!confirm('Möchtest du diese Notiz für das Team wirklich löschen?')) return;
    try {
      await deleteNote(noteId);
      setNotes((prev) => prev.filter((n) => n.id !== noteId));
    } catch (err: any) {
      alert('Fehler beim Löschen: ' + err.message);
    }
  };

  const handleTogglePin = async (noteId: string, currentPin: boolean) => {
    try {
      await togglePinNote(noteId, currentPin);
      setNotes((prev) =>
        prev
          .map((n) => (n.id === noteId ? { ...n, isPinned: !currentPin } : n))
          .sort((a, b) => Number(b.isPinned) - Number(a.isPinned))
      );
    } catch (err: any) {
      alert('Fehler beim Pinnen: ' + err.message);
    }
  };

  const formatTimestamp = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateStr;
    }
  };

  // State 1: User not logged in or no team selected
  if (!currentOrganization) {
    return (
      <div className="border border-blue-200 bg-gradient-to-r from-blue-50/60 to-indigo-50/60 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-700" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900">
              Team-Wissen & Interne Vermerke
            </h4>
          </div>
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-full border border-blue-200">
            <Lock className="w-3 h-3" />
            <span>Geschützt</span>
          </span>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed">
          Teile vertrauliche Ansprechpartner, Klingelanweisungen, Urlaubsvertretungen und Aufnahmestopps exklusiv mit deinem Streetwork- oder Träger-Team.
        </p>

        <button
          type="button"
          onClick={onOpenTeamModal}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-sm transition-colors cursor-pointer"
        >
          <Users className="w-3.5 h-3.5" />
          <span>Team beitreten oder erstellen</span>
        </button>
      </div>
    );
  }

  // State 2: Active team workspace
  const isAdmin = currentOrganization.role === 'admin';

  return (
    <div className="border border-indigo-200 bg-indigo-50/30 rounded-xl p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-indigo-700" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-950">
            Team-Wissen ({currentOrganization.name})
          </h4>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenTeamModal}
            className="text-[11px] font-semibold text-indigo-700 hover:underline"
            title="Team wechseln oder verwalten"
          >
            Workspace verwalten
          </button>
        </div>
      </div>

      {/* Action Bar */}
      {!isAdding && (
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className="w-full py-2 px-3 bg-white hover:bg-slate-50 border border-indigo-200 hover:border-indigo-300 rounded-lg text-xs font-semibold text-indigo-800 flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Interne Notiz für {currentOrganization.name} verfassen</span>
        </button>
      )}

      {/* Add Note Form */}
      {isAdding && (
        <form onSubmit={handleAddNote} className="bg-white p-3.5 rounded-xl border border-indigo-200 shadow-sm space-y-3 animate-in fade-in duration-150">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800">
              Neue Team-Notiz hinzufügen
            </span>
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="text-xs text-slate-400 hover:text-slate-600"
            >
              Abbrechen
            </button>
          </div>

          {/* Category Selector Pills */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1.5">
              Kategorie:
            </label>
            <div className="grid grid-cols-2 gap-1.5">
              {(Object.keys(CATEGORY_CONFIG) as NoteCategory[]).map((cat) => {
                const conf = CATEGORY_CONFIG[cat];
                const Icon = conf.icon;
                const isSelected = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setSelectedCategory(cat)}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border text-left transition-all ${
                      isSelected
                        ? `${conf.bg} ${conf.color} ${conf.border} ring-1 ring-blue-400/50 font-bold`
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-3 h-3 shrink-0" />
                    <span className="truncate">{conf.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Content Input */}
          <div>
            <textarea
              required
              rows={3}
              placeholder="z.B. 'Fr. Becker ist zuständig für U25. Bitte dienstags vor 11 Uhr anrufen, da danach Teamsitzung.'"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full p-2.5 text-xs text-slate-800 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {errorMsg && (
            <p className="text-xs text-red-600">{errorMsg}</p>
          )}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={submitting || !content.trim()}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold shadow-xs transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>Speichern</span>
            </button>
          </div>
        </form>
      )}

      {/* Notes List */}
      {loading ? (
        <div className="py-4 flex items-center justify-center text-xs text-slate-400 gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
          <span>Lade Team-Wissen...</span>
        </div>
      ) : notes.length === 0 ? (
        <div className="py-3 px-3 text-center bg-white/60 border border-slate-200/80 rounded-lg">
          <p className="text-xs text-slate-500">
            Noch keine internen Notizen für diese Einrichtung hinterlegt.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {notes.map((note) => {
            const conf = CATEGORY_CONFIG[note.category] || CATEGORY_CONFIG.general;
            const Icon = conf.icon;
            const isAuthor = note.authorId === user?.id;
            const canManage = isAuthor || isAdmin;

            return (
              <div
                key={note.id}
                className={`p-3 bg-white rounded-xl border transition-all ${
                  note.isPinned
                    ? 'border-indigo-300 shadow-sm ring-1 ring-indigo-200'
                    : 'border-slate-200'
                }`}
              >
                {/* Meta header */}
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${conf.bg} ${conf.color} border ${conf.border}`}
                    >
                      <Icon className="w-2.5 h-2.5" />
                      <span>{conf.label}</span>
                    </span>
                    <span className="text-[11px] font-semibold text-slate-800">
                      {note.authorName}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      • {formatTimestamp(note.createdAt)}
                    </span>
                  </div>

                  {/* Actions: Pin & Delete */}
                  {canManage && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleTogglePin(note.id, note.isPinned)}
                        className={`p-1 rounded hover:bg-slate-100 transition-colors ${
                          note.isPinned ? 'text-indigo-600' : 'text-slate-400'
                        }`}
                        title={note.isPinned ? 'Notiz lösen' : 'Notiz oben anpinnen'}
                      >
                        <Pin className="w-3 h-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(note.id)}
                        className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Notiz löschen"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Content */}
                <p className="text-xs text-slate-800 leading-relaxed font-normal whitespace-pre-wrap">
                  {note.content}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
