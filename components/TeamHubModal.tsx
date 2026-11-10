'use client';

import React, { useState } from 'react';
import {
  X,
  ClipboardList,
  Pin,
  Trash2,
  Send,
  AlertTriangle,
  Lightbulb,
  Building2,
  Users,
  MapPin,
  ChevronRight,
  ExternalLink,
  Plus,
  ShieldAlert,
  Info,
  Calendar,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { useTeam } from '@/lib/TeamContext';
import { useAuth } from '@/lib/AuthContext';
import { Facility } from '@/types/facility';
import { AnnouncementPriority, NoteCategory } from '@/types/team';

interface TeamHubModalProps {
  isOpen: boolean;
  onClose: () => void;
  facilities: Facility[];
  onSelectFacilityAndOpen: (facility: Facility) => void;
  onOpenTeamSettings: () => void;
}

const PRIORITY_CONFIG: Record<
  AnnouncementPriority,
  { label: string; icon: any; badgeClass: string; cardClass: string }
> = {
  urgent: {
    label: 'Eilige Warnung',
    icon: AlertTriangle,
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-300 font-bold',
    cardClass: 'border-rose-300 bg-rose-50/40 shadow-xs ring-1 ring-rose-200',
  },
  important: {
    label: 'Wichtig',
    icon: Pin,
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300 font-bold',
    cardClass: 'border-amber-300 bg-amber-50/30',
  },
  info: {
    label: 'Info & Übergabe',
    icon: Info,
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-200',
    cardClass: 'border-slate-200 bg-white',
  },
};

const NOTE_CATEGORY_LABELS: Record<NoteCategory, { label: string; color: string }> = {
  contact_person: { label: 'Ansprechpartner*in', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  intake_tip: { label: 'Aufnahme-Tipp', color: 'bg-amber-100 text-amber-800 border-amber-200' },
  warning: { label: 'Achtung / Kapazität', color: 'bg-rose-100 text-rose-800 border-rose-200' },
  general: { label: 'Allgemein', color: 'bg-slate-100 text-slate-700 border-slate-200' },
};

export const TeamHubModal: React.FC<TeamHubModalProps> = ({
  isOpen,
  onClose,
  facilities,
  onSelectFacilityAndOpen,
  onOpenTeamSettings,
}) => {
  const { user } = useAuth();
  const {
    currentOrganization,
    announcements,
    createAnnouncement,
    deleteAnnouncement,
    togglePinAnnouncement,
    allTeamFacilityNotes,
  } = useTeam();

  const [activeTab, setActiveTab] = useState<'pinnwand' | 'ticker'>('pinnwand');
  const [isPosting, setIsPosting] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<AnnouncementPriority>('important');
  const [isPinned, setIsPinned] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen || !currentOrganization) return null;

  const isAdmin = currentOrganization.role === 'admin';

  const handlePostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setSubmitting(true);
    setErrorMsg(null);
    try {
      await createAnnouncement(title, content, priority, isPinned);
      setTitle('');
      setContent('');
      setIsPinned(false);
      setIsPosting(false);
    } catch (err: any) {
      setErrorMsg(err.message || 'Fehler beim Erstellen der Ankündigung.');
    } finally {
      setSubmitting(false);
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-600 rounded-xl text-white shadow-sm">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base leading-tight">
                  Schwarzes Brett & Dienstübergabe
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  {currentOrganization.name}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Zentrale Übergaben, Eilmeldungen & Berlinweiter Einrichtungs-Ticker
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenTeamSettings}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
              title="Team-Mitglieder & Einstellungen"
            >
              Workspace-Settings
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2 gap-3 text-xs font-semibold text-slate-600">
          <button
            type="button"
            onClick={() => setActiveTab('pinnwand')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'pinnwand'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Pin className="w-3.5 h-3.5" />
            <span>Pinnwand & Dienstübergabe ({announcements.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ticker')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'ticker'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Einrichtungs-Ticker Berlin ({allTeamFacilityNotes.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {/* TAB 1: PINNWAND & DIENSTÜBERGABE */}
          {activeTab === 'pinnwand' && (
            <div className="space-y-4">
              {/* Action Button: Post new announcement */}
              {!isPosting && (
                <button
                  type="button"
                  onClick={() => setIsPosting(true)}
                  className="w-full py-2.5 px-4 bg-blue-50/70 hover:bg-blue-100/80 border border-blue-200 text-blue-800 rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-2xs transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Neue Dienstübergabe oder Team-Ankündigung erfassen</span>
                </button>
              )}

              {/* Posting Form */}
              {isPosting && (
                <form
                  onSubmit={handlePostAnnouncement}
                  className="p-4 bg-slate-50 border border-slate-300 rounded-xl space-y-3 shadow-xs animate-in fade-in duration-150"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">
                      Neue Dienstübergabe verfassen
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsPosting(false)}
                      className="text-xs text-slate-400 hover:text-slate-600"
                    >
                      Abbrechen
                    </button>
                  </div>

                  {errorMsg && (
                    <div className="p-2 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
                      {errorMsg}
                    </div>
                  )}

                  {/* Priority Selector */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Dringlichkeit:
                    </label>
                    <div className="flex gap-2">
                      {(Object.keys(PRIORITY_CONFIG) as AnnouncementPriority[]).map((p) => {
                        const conf = PRIORITY_CONFIG[p];
                        const Icon = conf.icon;
                        const isSelected = priority === p;
                        return (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setPriority(p)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                              isSelected
                                ? `${conf.badgeClass} ring-1 ring-blue-500`
                                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <Icon className="w-3 h-3" />
                            <span>{conf.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Title */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                      Betreff / Titel:
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="z.B. 'Dienstwagen-Schlüssel auf Platz 3', 'Kältebus-Telefonnummer aktualisiert'"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  {/* Content */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">
                      Nachricht / Details:
                    </label>
                    <textarea
                      required
                      rows={3}
                      placeholder="Wichtige Hinweise für die Kolleg*innen der nächsten Schicht..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>

                  {/* Pin Checkbox */}
                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isPinned}
                        onChange={(e) => setIsPinned(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span>Ganz oben auf dem Schwarzen Brett anpinnen</span>
                    </label>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setIsPosting(false)}
                        className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-900 rounded-lg"
                      >
                        Abbrechen
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold shadow-xs transition disabled:opacity-50 flex items-center gap-1.5"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{submitting ? 'Speichere...' : 'Anpinnen'}</span>
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* Feed of Announcements */}
              {announcements.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <div className="p-3 bg-white w-10 h-10 rounded-full mx-auto shadow-xs flex items-center justify-center text-slate-400">
                    <ClipboardList className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm">
                    Noch keine Einträge auf der Pinnwand
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Nutze dieses Board für die Schichtübergabe, Teambesprechungen oder wichtige Adressänderungen.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {announcements.map((item) => {
                    const conf = PRIORITY_CONFIG[item.priority] || PRIORITY_CONFIG.info;
                    const Icon = conf.icon;
                    const isAuthor = item.authorId === user?.id;
                    const canManage = isAuthor || isAdmin;

                    return (
                      <div
                        key={item.id}
                        className={`p-4 rounded-xl border transition-all ${conf.cardClass} ${
                          item.isPinned ? 'ring-2 ring-indigo-400/40 shadow-sm' : ''
                        }`}
                      >
                        {/* Meta Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] border ${conf.badgeClass}`}
                            >
                              <Icon className="w-3 h-3" />
                              <span>{conf.label}</span>
                            </span>

                            {item.isPinned && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
                                <Pin className="w-2.5 h-2.5" />
                                <span>Angepinnt</span>
                              </span>
                            )}

                            <span className="text-xs font-bold text-slate-900">
                              {item.title}
                            </span>
                          </div>

                          {/* Actions */}
                          {canManage && (
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => togglePinAnnouncement(item.id, item.isPinned)}
                                className={`p-1 rounded hover:bg-slate-200 transition ${
                                  item.isPinned ? 'text-indigo-600' : 'text-slate-400'
                                }`}
                                title={item.isPinned ? 'Lösen' : 'Oben anpinnen'}
                              >
                                <Pin className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm('Ankündigung wirklich löschen?')) {
                                    deleteAnnouncement(item.id);
                                  }
                                }}
                                className="p-1 text-slate-400 hover:text-red-600 rounded transition"
                                title="Löschen"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <p className="text-xs text-slate-800 mt-2 leading-relaxed whitespace-pre-wrap font-normal">
                          {item.content}
                        </p>

                        {/* Author & Timestamp Footer */}
                        <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
                          <span className="font-semibold text-slate-700">
                            Von: {item.authorName}
                          </span>
                          <span>{formatTimestamp(item.createdAt)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: EINRICHTUNGS-TICKER (BERLINWEIT) */}
          {activeTab === 'ticker' && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900 leading-relaxed">
                Hier siehst du alle vertraulichen Notizen und Praxistipps, die Kolleg*innen deines Teams zu Einrichtungen in Berlin erfasst haben. Klicke auf eine Notiz, um direkt zur Einrichtung auf der Karte zu springen.
              </div>

              {allTeamFacilityNotes.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <div className="p-3 bg-white w-10 h-10 rounded-full mx-auto shadow-xs flex items-center justify-center text-slate-400">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-slate-800 text-sm">
                    Noch keine Einrichtungs-Notizen hinterlegt
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Öffne eine beliebige Einrichtung auf der Karte und trage unter &quot;Team-Wissen&quot; interne Ansprechpartner oder Aufnahmestopps ein.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {allTeamFacilityNotes.map((note) => {
                    const matchedFac = facilities.find((f) => f.id === note.facilityId);
                    const cat = NOTE_CATEGORY_LABELS[note.category] || NOTE_CATEGORY_LABELS.general;

                    return (
                      <div
                        key={note.id}
                        className="p-4 bg-white border border-slate-200 hover:border-blue-300 rounded-xl shadow-xs transition-all space-y-2"
                      >
                        {/* Facility Title & District */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded border ${cat.color}`}
                              >
                                {cat.label}
                              </span>
                              <h4 className="text-xs font-bold text-slate-900">
                                {matchedFac?.name || note.facilityId}
                              </h4>
                            </div>
                            {matchedFac && (
                              <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3" />
                                <span>
                                  {matchedFac.address.street}, {matchedFac.district}
                                </span>
                              </p>
                            )}
                          </div>

                          {matchedFac && (
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                onSelectFacilityAndOpen(matchedFac);
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-blue-600 hover:text-white bg-blue-50 hover:bg-blue-600 border border-blue-200 hover:border-blue-600 rounded-lg transition-colors shrink-0 cursor-pointer"
                            >
                              <span>Zur Einrichtung</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>

                        {/* Note text */}
                        <p className="text-xs text-slate-800 font-normal leading-relaxed whitespace-pre-wrap pl-2 border-l-2 border-indigo-300 bg-slate-50/60 p-2 rounded-r-lg">
                          {note.content}
                        </p>

                        {/* Author & Timestamp */}
                        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                          <span>Erfasst von: <strong className="text-slate-600">{note.authorName}</strong></span>
                          <span>{formatTimestamp(note.createdAt)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            🔒 Nur für Mitglieder von <strong>{currentOrganization.name}</strong> sichtbar
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-semibold rounded-xl text-xs transition cursor-pointer"
          >
            Schließen
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeamHubModal;
