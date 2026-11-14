'use client';

import React, { useState, useMemo } from 'react';
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
  ChevronLeft,
  ExternalLink,
  Plus,
  ShieldAlert,
  Info,
  Calendar,
  CalendarDays,
  Clock,
  Download,
  Share2,
  MessageSquare,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { useTeam } from '@/lib/TeamContext';
import { useAuth } from '@/lib/AuthContext';
import { Facility } from '@/types/facility';
import { AnnouncementPriority, NoteCategory, CalendarEventCategory, TeamCalendarEvent } from '@/types/team';
import TeamFeatureShowcaseModal from '@/components/TeamFeatureShowcaseModal';

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

const CALENDAR_CATEGORY_CONFIG: Record<
  CalendarEventCategory,
  { label: string; color: string; badge: string; icon: any }
> = {
  shift: {
    label: 'Schicht / Dienst',
    color: 'border-blue-400 bg-blue-50/60',
    badge: 'bg-blue-100 text-blue-800 border-blue-300',
    icon: Users,
  },
  handover: {
    label: 'Übergabe / Besprechung',
    color: 'border-purple-400 bg-purple-50/60',
    badge: 'bg-purple-100 text-purple-800 border-purple-300',
    icon: ClipboardList,
  },
  outreach: {
    label: 'Streetwork & Außendienst',
    color: 'border-emerald-400 bg-emerald-50/60',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    icon: Sparkles,
  },
  event: {
    label: 'Aktion & Sprechstunde',
    color: 'border-amber-400 bg-amber-50/60',
    badge: 'bg-amber-100 text-amber-800 border-amber-300',
    icon: Calendar,
  },
  deadline: {
    label: 'Frist & Deadline',
    color: 'border-rose-400 bg-rose-50/60',
    badge: 'bg-rose-100 text-rose-800 border-rose-300',
    icon: AlertTriangle,
  },
};

const MONTH_NAMES = [
  'Januar', 'Februar', 'März', 'April', 'Mai', 'Juni',
  'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'
];

export const TeamHubModal: React.FC<TeamHubModalProps> = ({
  isOpen,
  onClose,
  facilities = [],
  onSelectFacilityAndOpen,
  onOpenTeamSettings,
}) => {
  const { user } = useAuth();
  const {
    currentOrganization,
    announcements = [],
    createAnnouncement,
    deleteAnnouncement,
    togglePinAnnouncement,
    allTeamFacilityNotes = [],
    calendarEvents = [],
    createCalendarEvent,
    deleteCalendarEvent,
  } = useTeam();

  const [activeTab, setActiveTab] = useState<'pinnwand' | 'ticker' | 'calendar'>('pinnwand');

  // Pinnwand form states
  const [isPosting, setIsPosting] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<AnnouncementPriority>('important');
  const [isPinned, setIsPinned] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Calendar states
  const [calendarViewMode, setCalendarViewMode] = useState<'agenda' | 'month'>('agenda');
  const [selectedCalendarCategory, setSelectedCalendarCategory] = useState<string>('all');
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventCategory, setEventCategory] = useState<CalendarEventCategory>('shift');
  const [eventStartTime, setEventStartTime] = useState('');
  const [eventEndTime, setEventEndTime] = useState('');
  const [eventFacilityId, setEventFacilityId] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventIsCrossTeam, setEventIsCrossTeam] = useState(false);
  const [submittingEvent, setSubmittingEvent] = useState(false);
  const [calendarErrorMsg, setCalendarErrorMsg] = useState<string | null>(null);

  // Month navigation state
  const [currentMonthDate, setCurrentMonthDate] = useState(() => new Date());
  const [selectedDayFilter, setSelectedDayFilter] = useState<string | null>(null);

  // ALL HOOKS CALLED UNCONDITIONALLY AT TOP LEVEL (React Rules of Hooks)
  // 1. Facility fast lookup map
  const facilityMap = useMemo(() => {
    const map = new Map<string, Facility>();
    (facilities || []).forEach((f) => {
      if (f && f.id) map.set(f.id, f);
    });
    return map;
  }, [facilities]);

  // 2. Filtered Calendar Events
  const filteredEvents = useMemo(() => {
    return (calendarEvents || []).filter((ev) => {
      if (!ev) return false;
      if (selectedCalendarCategory !== 'all' && ev.category !== selectedCalendarCategory) {
        return false;
      }
      if (selectedDayFilter && ev.startTime) {
        try {
          const evDay = new Date(ev.startTime).toISOString().slice(0, 10);
          if (evDay !== selectedDayFilter) return false;
        } catch {
          return false;
        }
      }
      return true;
    });
  }, [calendarEvents, selectedCalendarCategory, selectedDayFilter]);

  // 3. Calendar Month Days Grid
  const calendarMonthGrid = useMemo(() => {
    const year = currentMonthDate.getFullYear();
    const month = currentMonthDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const days: { date: Date; dateStr: string; isCurrentMonth: boolean; hasEvents: TeamCalendarEvent[] }[] = [];
    const safeCalendarEvents = calendarEvents || [];

    // Prev month padding
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      const dStr = d.toISOString().slice(0, 10);
      days.push({
        date: d,
        dateStr: dStr,
        isCurrentMonth: false,
        hasEvents: safeCalendarEvents.filter((e) => e?.startTime && e.startTime.slice(0, 10) === dStr),
      });
    }

    // Current month days
    for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
      const d = new Date(year, month, day);
      const dStr = d.toISOString().slice(0, 10);
      days.push({
        date: d,
        dateStr: dStr,
        isCurrentMonth: true,
        hasEvents: safeCalendarEvents.filter((e) => e?.startTime && e.startTime.slice(0, 10) === dStr),
      });
    }

    // Next month padding to fill rows of 7
    while (days.length % 7 !== 0) {
      const d = new Date(year, month + 1, days.length - (startDayOfWeek + lastDayOfMonth.getDate()) + 1);
      const dStr = d.toISOString().slice(0, 10);
      days.push({
        date: d,
        dateStr: dStr,
        isCurrentMonth: false,
        hasEvents: safeCalendarEvents.filter((e) => e?.startTime && e.startTime.slice(0, 10) === dStr),
      });
    }

    return days;
  }, [currentMonthDate, calendarEvents]);

  // Guard: if closed, render nothing
  if (!isOpen) return null;

  const isTeamActive = !!currentOrganization && (
    currentOrganization.subscriptionStatus === 'active' ||
    (currentOrganization.subscriptionStatus === 'trialing' &&
      (!currentOrganization.trialEndsAt || new Date(currentOrganization.trialEndsAt) > new Date()))
  );

  // If no team selected or team subscription is inactive, show the showcase modal
  if (!currentOrganization || !isTeamActive) {
    return (
      <TeamFeatureShowcaseModal
        isOpen={isOpen}
        onClose={onClose}
        onOpenTeamModal={onOpenTeamSettings}
        onOpenLicenseModal={() => {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('polaris:open-license'));
          }
        }}
      />
    );
  }

  const isAdmin = currentOrganization.role === 'admin';

  // --- Handlers for Announcements ---
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

  // --- Handlers for Calendar Events ---
  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle.trim() || !eventStartTime || !eventEndTime) {
      setCalendarErrorMsg('Bitte Titel sowie Beginn und Ende angeben.');
      return;
    }

    if (new Date(eventEndTime) < new Date(eventStartTime)) {
      setCalendarErrorMsg('Das Ende des Termins kann nicht vor dem Beginn liegen.');
      return;
    }

    setSubmittingEvent(true);
    setCalendarErrorMsg(null);

    try {
      const matchedFacility = eventFacilityId ? facilityMap.get(eventFacilityId) : undefined;
      await createCalendarEvent({
        title: eventTitle.trim(),
        description: eventDescription.trim() || undefined,
        startTime: new Date(eventStartTime).toISOString(),
        endTime: new Date(eventEndTime).toISOString(),
        category: eventCategory,
        facilityId: eventFacilityId || undefined,
        facilityName: matchedFacility?.name || undefined,
        isCrossTeam: eventIsCrossTeam,
      });

      setEventTitle('');
      setEventDescription('');
      setEventStartTime('');
      setEventEndTime('');
      setEventFacilityId('');
      setEventIsCrossTeam(false);
      setIsCreatingEvent(false);
    } catch (err: any) {
      setCalendarErrorMsg(err.message || 'Fehler beim Anlegen des Termins.');
    } finally {
      setSubmittingEvent(false);
    }
  };

  // .ics Download Generator
  const downloadIcs = (event: TeamCalendarEvent) => {
    try {
      const formatDate = (isoStr: string) => {
        const d = new Date(isoStr);
        return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
      };

      const ics = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//SocialWorkHub Polaris//DE',
        'CALSCALE:GREGORIAN',
        'METHOD:PUBLISH',
        'BEGIN:VEVENT',
        `UID:${event.id}@socialworkhub.net`,
        `DTSTAMP:${formatDate(new Date().toISOString())}`,
        `DTSTART:${formatDate(event.startTime)}`,
        `DTEND:${formatDate(event.endTime)}`,
        `SUMMARY:${event.title.replace(/\n/g, ' ')}`,
        `DESCRIPTION:${(event.description || '').replace(/\n/g, '\\n')}${
          event.facilityName ? `\\nEinrichtung: ${event.facilityName}` : ''
        }`,
        event.facilityName ? `LOCATION:${event.facilityName}` : '',
        'END:VEVENT',
        'END:VCALENDAR',
      ].filter(Boolean).join('\r\n');

      const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${event.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}.ics`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('ICS generation error:', e);
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

  const formatEventDateRange = (startIso: string, endIso: string) => {
    try {
      const s = new Date(startIso);
      const e = new Date(endIso);
      const isSameDay = s.toDateString() === e.toDateString();

      const timeOpts: Intl.DateTimeFormatOptions = { hour: '2-digit', minute: '2-digit' };
      const dateOpts: Intl.DateTimeFormatOptions = { weekday: 'short', day: '2-digit', month: '2-digit', year: 'numeric' };

      if (isSameDay) {
        return `${s.toLocaleDateString('de-DE', dateOpts)} • ${s.toLocaleTimeString('de-DE', timeOpts)} – ${e.toLocaleTimeString('de-DE', timeOpts)} Uhr`;
      }
      return `${s.toLocaleDateString('de-DE', dateOpts)} ${s.toLocaleTimeString('de-DE', timeOpts)} – ${e.toLocaleDateString('de-DE', dateOpts)} ${e.toLocaleTimeString('de-DE', timeOpts)} Uhr`;
    } catch {
      return `${startIso} – ${endIso}`;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-900 text-white border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-blue-600 rounded-xl text-white shadow-sm">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-base leading-tight">
                  Team-Zentrale & Schwarzes Brett
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                  {currentOrganization.name}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Dienstübergaben, Schichtkalender & Berlinweiter Einrichtungs-Ticker
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onOpenTeamSettings}
              className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition cursor-pointer"
              title="Team-Mitglieder & Einstellungen"
            >
              Workspace-Settings
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-2 gap-3 text-xs font-semibold text-slate-600 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('pinnwand')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'pinnwand'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Pin className="w-3.5 h-3.5" />
            <span>Pinnwand & Übergabe ({(announcements || []).length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('calendar')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'calendar'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Kalender & Schichten ({(calendarEvents || []).length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ticker')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
              activeTab === 'ticker'
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Einrichtungs-Ticker Berlin ({(allTeamFacilityNotes || []).length})</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-100/60">
          
          {/* TAB 1: PINNWAND & DIENSTÜBERGABE */}
          {activeTab === 'pinnwand' && (
            <div className="space-y-4">
              {/* Top Action Bar */}
              <div className="flex items-center justify-between gap-3">
                <div className="text-xs text-slate-500">
                  Wichtige Meldungen, Schlüsselübergaben & tagesaktuelle Infos für die Schicht.
                </div>
                {!isPosting && (
                  <button
                    type="button"
                    onClick={() => setIsPosting(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs shadow-xs transition cursor-pointer shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Neuer Aushang</span>
                  </button>
                )}
              </div>

              {/* Posting Form */}
              {isPosting && (
                <form
                  onSubmit={handlePostAnnouncement}
                  className="p-4 bg-white border border-blue-200 rounded-xl shadow-xs space-y-3 animate-in fade-in duration-150"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-blue-600" />
                      Neuen Aushang für das Team erstellen
                    </h4>
                    <button
                      type="button"
                      onClick={() => setIsPosting(false)}
                      className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      Abbrechen
                    </button>
                  </div>

                  {errorMsg && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
                      {errorMsg}
                    </div>
                  )}

                  <div>
                    <input
                      type="text"
                      placeholder="Titel (z.B. Schlüssel Dienstwagen 2 / Kältebus-Team heute)"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                    />
                  </div>

                  <div>
                    <textarea
                      placeholder="Details, Übergabenotizen, Telefonnummern oder wichtige Instruktionen..."
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      required
                      rows={3}
                      className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="flex items-center justify-between flex-wrap gap-2 pt-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-500 font-medium">Priorität:</span>
                      {(['info', 'important', 'urgent'] as AnnouncementPriority[]).map((p) => {
                        const conf = PRIORITY_CONFIG[p];
                        const Icon = conf.icon;
                        const isSelected = priority === p;
                        return (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setPriority(p)}
                            className={`px-2.5 py-1 text-xs rounded-lg border flex items-center gap-1 transition cursor-pointer ${
                              isSelected
                                ? conf.badgeClass + ' ring-2 ring-blue-500/30'
                                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            <Icon className="w-3 h-3" />
                            <span>{conf.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isPinned}
                          onChange={(e) => setIsPinned(e.target.checked)}
                          className="rounded text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                        />
                        <span>Oben anheften</span>
                      </label>

                      <button
                        type="submit"
                        disabled={submitting}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-xs transition cursor-pointer disabled:opacity-50"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{submitting ? 'Veröffentliche...' : 'Aushängen'}</span>
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* Announcements List */}
              {(announcements || []).length === 0 ? (
                <div className="p-8 text-center bg-white border border-slate-200 rounded-xl shadow-xs space-y-2">
                  <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <ClipboardList className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-700">Noch keine Aushänge</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Nutze das Schwarze Brett für Schichtübergaben, wichtige Infos oder Sicherheitswarnungen in deinem Team.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(announcements || []).map((item) => {
                    const conf = PRIORITY_CONFIG[item.priority] || PRIORITY_CONFIG.info;
                    const Icon = conf.icon;
                    const canManage = isAdmin || (user && user.id === item.authorId);

                    return (
                      <div
                        key={item.id}
                        className={`p-4 border rounded-xl shadow-xs transition-all ${conf.cardClass} relative`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              className={`text-[11px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${conf.badgeClass}`}
                            >
                              <Icon className="w-3 h-3" />
                              {conf.label}
                            </span>
                            {item.isPinned && (
                              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full border bg-amber-100 text-amber-800 border-amber-300 flex items-center gap-1">
                                <Pin className="w-3 h-3" />
                                Angeheftet
                              </span>
                            )}
                            <h4 className="text-sm font-bold text-slate-900 leading-snug">
                              {item.title}
                            </h4>
                          </div>

                          {canManage && (
                            <div className="flex items-center gap-1 shrink-0">
                              <button
                                type="button"
                                onClick={() => togglePinAnnouncement(item.id, item.isPinned)}
                                title={item.isPinned ? 'Anheften aufheben' : 'Oben anheften'}
                                className={`p-1.5 rounded-lg border transition cursor-pointer ${
                                  item.isPinned
                                    ? 'bg-amber-100 text-amber-700 border-amber-300'
                                    : 'bg-white text-slate-400 hover:text-slate-700 border-slate-200'
                                }`}
                              >
                                <Pin className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteAnnouncement(item.id)}
                                title="Aushang löschen"
                                className="p-1.5 rounded-lg border bg-white text-slate-400 hover:text-rose-600 border-slate-200 transition cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>

                        <p className="text-xs text-slate-800 font-normal leading-relaxed mt-2.5 whitespace-pre-wrap">
                          {item.content}
                        </p>

                        <div className="flex items-center justify-between text-[11px] text-slate-400 mt-3 pt-2 border-t border-slate-200/60">
                          <span>
                            Verfasst von: <strong className="text-slate-600">{item.authorName}</strong>
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

          {/* TAB 2: TEAM-KALENDER & SCHICHTEN */}
          {activeTab === 'calendar' && (
            <div className="space-y-4">
              {/* Action & View Switcher Bar */}
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <div className="inline-flex rounded-xl p-1 bg-slate-200 text-xs font-semibold">
                    <button
                      type="button"
                      onClick={() => {
                        setCalendarViewMode('agenda');
                        setSelectedDayFilter(null);
                      }}
                      className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                        calendarViewMode === 'agenda'
                          ? 'bg-white text-blue-600 shadow-xs font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Agenda</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setCalendarViewMode('month')}
                      className={`px-3 py-1 rounded-lg transition cursor-pointer flex items-center gap-1.5 ${
                        calendarViewMode === 'month'
                          ? 'bg-white text-blue-600 shadow-xs font-bold'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <CalendarDays className="w-3.5 h-3.5" />
                      <span>Monat</span>
                    </button>
                  </div>

                  {selectedDayFilter && (
                    <button
                      type="button"
                      onClick={() => setSelectedDayFilter(null)}
                      className="text-xs text-blue-600 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-lg font-medium hover:bg-blue-100 transition cursor-pointer"
                    >
                      Tag-Filter zurücksetzen ({selectedDayFilter}) ✕
                    </button>
                  )}
                </div>

                {!isCreatingEvent && (
                  <button
                    type="button"
                    onClick={() => setIsCreatingEvent(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs shadow-xs transition cursor-pointer shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Termin / Schicht eintragen</span>
                  </button>
                )}
              </div>

              {/* Event Creation Form */}
              {isCreatingEvent && (
                <form
                  onSubmit={handleCreateEvent}
                  className="p-4 bg-white border border-blue-200 rounded-xl shadow-xs space-y-3 animate-in fade-in duration-150"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      Neuen Kalendereintrag oder Schicht anlegen
                    </h4>
                    <button
                      type="button"
                      onClick={() => setIsCreatingEvent(false)}
                      className="text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      Abbrechen
                    </button>
                  </div>

                  {calendarErrorMsg && (
                    <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
                      {calendarErrorMsg}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Titel / Bezeichnung *
                      </label>
                      <input
                        type="text"
                        placeholder="z.B. Kältehilfe-Nachtschicht Alex, Arztmobil am Zoo..."
                        value={eventTitle}
                        onChange={(e) => setEventTitle(e.target.value)}
                        required
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Kategorie
                      </label>
                      <select
                        value={eventCategory}
                        onChange={(e) => setEventCategory(e.target.value as CalendarEventCategory)}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        <option value="shift">🟦 Schicht / Dienst</option>
                        <option value="handover">🟪 Übergabe / Besprechung</option>
                        <option value="outreach">🟩 Streetwork & Außendienst</option>
                        <option value="event">🟨 Aktion & Sprechstunde</option>
                        <option value="deadline">🟥 Frist & Deadline</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Beginn *
                      </label>
                      <input
                        type="datetime-local"
                        value={eventStartTime}
                        onChange={(e) => setEventStartTime(e.target.value)}
                        required
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Ende *
                      </label>
                      <input
                        type="datetime-local"
                        value={eventEndTime}
                        onChange={(e) => setEventEndTime(e.target.value)}
                        required
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Verknüpfte Einrichtung (optional)
                      </label>
                      <select
                        value={eventFacilityId}
                        onChange={(e) => setEventFacilityId(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        <option value="">Keine Einrichtung verknüpfen</option>
                        {(facilities || []).slice(0, 80).map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.name} ({f.district})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Notizen / Details (DSGVO: keine Klientennamen)
                      </label>
                      <input
                        type="text"
                        placeholder="z.B. Schlüsselübergabe im Büro, 2 Personen im Dienst..."
                        value={eventDescription}
                        onChange={(e) => setEventDescription(e.target.value)}
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-slate-100">
                    <label className="flex items-center gap-2 text-xs text-slate-700 font-medium cursor-pointer">
                      <input
                        type="checkbox"
                        checked={eventIsCrossTeam}
                        onChange={(e) => setEventIsCrossTeam(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500 h-3.5 w-3.5"
                      />
                      <span>Im Träger-Netzwerk teilen (für Partner-Teams sichtbar)</span>
                    </label>

                    <button
                      type="submit"
                      disabled={submittingEvent}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-xs transition cursor-pointer disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{submittingEvent ? 'Speichere...' : 'Termin speichern'}</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Category Pills Filter */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                <button
                  type="button"
                  onClick={() => setSelectedCalendarCategory('all')}
                  className={`px-2.5 py-1 rounded-lg border font-medium transition cursor-pointer shrink-0 ${
                    selectedCalendarCategory === 'all'
                      ? 'bg-slate-900 text-white border-slate-900 font-bold'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Alle ({(calendarEvents || []).length})
                </button>
                {Object.entries(CALENDAR_CATEGORY_CONFIG).map(([catKey, conf]) => {
                  const count = (calendarEvents || []).filter((e) => e?.category === catKey).length;
                  const isSelected = selectedCalendarCategory === catKey;
                  return (
                    <button
                      key={catKey}
                      type="button"
                      onClick={() => setSelectedCalendarCategory(catKey)}
                      className={`px-2.5 py-1 rounded-lg border font-medium transition cursor-pointer shrink-0 flex items-center gap-1 ${
                        isSelected
                          ? conf.badge + ' font-bold ring-2 ring-blue-500/30'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <span>{conf.label}</span>
                      <span className="text-[10px] opacity-75">({count})</span>
                    </button>
                  );
                })}
              </div>

              {/* MONTH VIEW */}
              {calendarViewMode === 'month' && (
                <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs space-y-3">
                  {/* Month header & navigation */}
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-900">
                      {MONTH_NAMES[currentMonthDate.getMonth()]} {currentMonthDate.getFullYear()}
                    </h4>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          setCurrentMonthDate(
                            new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() - 1, 1)
                          )
                        }
                        className="p-1 text-slate-500 hover:text-slate-900 rounded hover:bg-slate-100 cursor-pointer"
                        title="Vorheriger Monat"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setCurrentMonthDate(new Date())}
                        className="px-2 py-0.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded cursor-pointer"
                      >
                        Heute
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setCurrentMonthDate(
                            new Date(currentMonthDate.getFullYear(), currentMonthDate.getMonth() + 1, 1)
                          )
                        }
                        className="p-1 text-slate-500 hover:text-slate-900 rounded hover:bg-slate-100 cursor-pointer"
                        title="Nächster Monat"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Days of week header */}
                  <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-slate-400">
                    <div>Mo</div>
                    <div>Di</div>
                    <div>Mi</div>
                    <div>Do</div>
                    <div>Fr</div>
                    <div>Sa</div>
                    <div>So</div>
                  </div>

                  {/* Grid cells */}
                  <div className="grid grid-cols-7 gap-1">
                    {calendarMonthGrid.map((dayItem, idx) => {
                      const isToday = dayItem.date.toDateString() === new Date().toDateString();
                      const isSelected = selectedDayFilter === dayItem.dateStr;

                      return (
                        <div
                          key={idx}
                          onClick={() => {
                            if (dayItem.hasEvents.length > 0 || isSelected) {
                              setSelectedDayFilter(isSelected ? null : dayItem.dateStr);
                            }
                          }}
                          className={`min-h-[64px] p-1.5 rounded-lg border transition text-left flex flex-col justify-between cursor-pointer ${
                            isSelected
                              ? 'border-blue-500 bg-blue-50/70 ring-2 ring-blue-500/20'
                              : dayItem.isCurrentMonth
                              ? 'bg-white border-slate-200 hover:border-slate-300'
                              : 'bg-slate-50/50 border-slate-100 text-slate-400 opacity-60'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center ${
                                isToday ? 'bg-blue-600 text-white' : 'text-slate-700'
                              }`}
                            >
                              {dayItem.date.getDate()}
                            </span>
                            {dayItem.hasEvents.length > 0 && (
                              <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-1 rounded-full">
                                {dayItem.hasEvents.length}
                              </span>
                            )}
                          </div>

                          {/* Mini event pill indicator */}
                          <div className="space-y-0.5 mt-1 overflow-hidden">
                            {dayItem.hasEvents.slice(0, 2).map((ev) => {
                              const conf = CALENDAR_CATEGORY_CONFIG[ev.category] || CALENDAR_CATEGORY_CONFIG.event;
                              return (
                                <div
                                  key={ev.id}
                                  title={ev.title}
                                  className={`text-[9px] font-semibold truncate px-1 py-0.5 rounded border ${conf.badge}`}
                                >
                                  {ev.title}
                                </div>
                              );
                            })}
                            {dayItem.hasEvents.length > 2 && (
                              <div className="text-[9px] text-slate-400 pl-1">
                                +{dayItem.hasEvents.length - 2} weitere
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* AGENDA / EVENT LIST */}
              {filteredEvents.length === 0 ? (
                <div className="p-8 text-center bg-white border border-slate-200 rounded-xl shadow-xs space-y-2">
                  <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-700">Keine Termine gefunden</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    {selectedDayFilter
                      ? `Für den ${selectedDayFilter} sind keine Einträge hinterlegt.`
                      : 'Trage Schichten, Fristen oder Kältehilfe-Einsätze ein, um sie mit deinem Team zu teilen.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredEvents.map((ev) => {
                    const conf = CALENDAR_CATEGORY_CONFIG[ev.category] || CALENDAR_CATEGORY_CONFIG.event;
                    const Icon = conf.icon;
                    const canManage = isAdmin || (user && user.id === ev.authorId);
                    const matchedFac = ev.facilityId ? facilityMap.get(ev.facilityId) : undefined;

                    return (
                      <div
                        key={ev.id}
                        className={`p-4 border rounded-xl shadow-xs transition-all bg-white hover:border-slate-300 relative ${conf.color}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span
                                className={`text-[11px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${conf.badge}`}
                              >
                                <Icon className="w-3 h-3" />
                                {conf.label}
                              </span>

                              {ev.isCrossTeam && (
                                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full border bg-emerald-100 text-emerald-800 border-emerald-300 flex items-center gap-1">
                                  <Share2 className="w-3 h-3" />
                                  Träger-Netzwerk
                                </span>
                              )}

                              <h4 className="text-sm font-bold text-slate-900">
                                {ev.title}
                              </h4>
                            </div>

                            <p className="text-xs font-semibold text-slate-600 flex items-center gap-1.5 pt-0.5">
                              <Clock className="w-3.5 h-3.5 text-blue-600" />
                              <span>{formatEventDateRange(ev.startTime, ev.endTime)}</span>
                            </p>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {/* ICS Export button */}
                            <button
                              type="button"
                              onClick={() => downloadIcs(ev)}
                              title="In Kalender übernehmen (.ics Datei herunterladen)"
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-600 hover:text-slate-900 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5 text-blue-600" />
                              <span className="hidden sm:inline">.ics</span>
                            </button>

                            {canManage && (
                              <button
                                type="button"
                                onClick={() => deleteCalendarEvent(ev.id)}
                                title="Termin löschen"
                                className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Description */}
                        {ev.description && (
                          <p className="text-xs text-slate-800 font-normal leading-relaxed mt-2 whitespace-pre-wrap pl-2.5 border-l-2 border-blue-400 bg-slate-50/70 p-2 rounded-r-lg">
                            {ev.description}
                          </p>
                        )}

                        {/* Linked Facility Card Jump */}
                        {matchedFac && (
                          <div className="mt-2.5 p-2 bg-blue-50/70 border border-blue-200 rounded-lg flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 text-xs text-blue-900">
                              <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
                              <div>
                                <span className="font-bold">{matchedFac.name}</span>
                                <span className="text-[11px] text-blue-700 ml-1.5">
                                  ({matchedFac.district})
                                </span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                onSelectFacilityAndOpen(matchedFac);
                              }}
                              className="text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-500 px-2 py-1 rounded-md transition flex items-center gap-1 shrink-0 cursor-pointer"
                            >
                              <span>Auf Karte</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2.5 pt-1.5 border-t border-slate-200/50">
                          <span>
                            Eingetragen von: <strong className="text-slate-600">{ev.authorName}</strong>
                          </span>
                          <span>{formatTimestamp(ev.createdAt)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: EINRICHTUNGS-TICKER BERLIN */}
          {activeTab === 'ticker' && (
            <div className="space-y-4">
              <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-600 flex items-center justify-between gap-2">
                <span>
                  Chronologischer Feed aller vertraulichen Notizen, die dein Team zu Berliner Einrichtungen verfasst hat.
                </span>
                <span className="font-bold text-slate-900 shrink-0">
                  {(allTeamFacilityNotes || []).length} Notizen gesamt
                </span>
              </div>

              {(allTeamFacilityNotes || []).length === 0 ? (
                <div className="p-8 text-center bg-white border border-slate-200 rounded-xl shadow-xs space-y-2">
                  <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-700">Noch keine Notizen erfasst</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Öffne eine beliebige Einrichtung auf der Karte und hinterlege im Bereich „Team-Wissen“ vertrauliche Notizen für deine Kolleg*innen.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {(allTeamFacilityNotes || []).map((note) => {
                    const cat = NOTE_CATEGORY_LABELS[note.category] || NOTE_CATEGORY_LABELS.general;
                    const matchedFac = facilityMap.get(note.facilityId);

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
                                  {matchedFac.address?.street || 'Berlin'}, {matchedFac.district}
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
