import { Facility } from '@/types/facility';
import { FacilityTeamNote } from '@/types/team';

export interface AdmissionStatus {
  status: 'open_admission' | 'opens_later' | 'night_admission' | 'clearing_recommended' | 'day_center';
  badge: string;
  detail: string;
  color: 'emerald' | 'blue' | 'indigo' | 'amber';
}

export const KAELTEHILFE_HOTLINES = [
  {
    name: 'Kältebus Berlin (Stadtmission)',
    phone: '0178 523 58 38',
    hours: 'Täglich 20:30 – 02:00 Uhr',
    note: 'Fährt hilfebedürftige Personen auf der Straße an und vermittelt in Notübernachtungen.',
  },
  {
    name: 'Wärmebus (DRK Berlin)',
    phone: '030 600 300 1010',
    hours: 'Täglich 18:00 – 24:00 Uhr',
    note: 'Versorgung mit Heißgetränken, Schlafsäcken und warmem Transport.',
  },
  {
    name: 'Kältehilfe-Clearingstelle (GEBEWO)',
    phone: '030 34 39 70 37',
    hours: 'Täglich 19:00 – 23:00 Uhr',
    note: 'Zentrale Abfrage freier Notübernachtungsbetten in ganz Berlin.',
  },
];

/**
 * Parses facility walk-in opening hours and determines current operational admission status.
 * Never displays a misleading blanket "Red / Full", ensuring caseworkers always have discretion.
 */
export function getAdmissionStatus(facility: Facility, date: Date = new Date()): AdmissionStatus {
  const walkIn = (facility.openingHours?.walkIn || '').toLowerCase();
  const name = (facility.name || '').toLowerCase();
  const sub = (facility.subTitle || '').toLowerCase();
  const currentHour = date.getHours();
  const currentMinute = date.getMinutes();
  const currentTimeDec = currentHour + currentMinute / 60;

  const isDayCenter =
    walkIn.includes('tages') ||
    name.includes('tages') ||
    name.includes('suppe') ||
    sub.includes('tagesstätte') ||
    sub.includes('wärmestube');

  const isNightEmergency =
    walkIn.includes('notübernachtung') ||
    walkIn.includes('18:') ||
    walkIn.includes('19:') ||
    walkIn.includes('20:') ||
    name.includes('notübernachtung') ||
    name.includes('nachtcafé') ||
    name.includes('sleep-in');

  // Case 1: Day centers (Tagesstätten / Suppenküchen)
  if (isDayCenter && !isNightEmergency) {
    if (currentTimeDec >= 8.5 && currentTimeDec <= 16.5) {
      return {
        status: 'open_admission',
        badge: 'Tagesstätte geöffnet',
        detail: 'Aufenthalt & warme Versorgung möglich',
        color: 'emerald',
      };
    }
    return {
      status: 'day_center',
      badge: 'Tagesbetrieb (Vormittags geöffnet)',
      detail: 'Reguläre Öffnung morgen früh',
      color: 'blue',
    };
  }

  // Case 2: Night emergency shelters (Notübernachtungen / Nachtcafés)
  if (isNightEmergency) {
    // Regular intake window: usually 18:00 / 19:00 to 22:00
    if (currentTimeDec >= 18.0 && currentTimeDec < 22.0) {
      return {
        status: 'open_admission',
        badge: 'Jetzt regulärer Einlass',
        detail: 'Pforte & Einlass bis ca. 22:00 Uhr geöffnet',
        color: 'emerald',
      };
    }

    // Late night intake: 22:00 to 06:00 next morning (clearing/emergency backdoor/Kältebus)
    if (currentTimeDec >= 22.0 || currentTimeDec < 7.0) {
      return {
        status: 'night_admission',
        badge: 'Nachtbetrieb / Notfallpforte',
        detail: 'Einlass via Notklingel, Kältebus oder Notdienst',
        color: 'indigo',
      };
    }

    // Daytime: between 07:00 and 18:00 (closed for cleaning/rest, opens in the evening)
    return {
      status: 'opens_later',
      badge: 'Einlass ab 18:00 Uhr',
      detail: 'Öffnet heute Abend zur Nachtruhe',
      color: 'blue',
    };
  }

  // Case 3: Requires clearing / consultation
  if (
    facility.accessType === 'antragspflichtig' ||
    facility.accessType === 'termin' ||
    name.includes('frauen') ||
    name.includes('jugend')
  ) {
    return {
      status: 'clearing_recommended',
      badge: 'Telefonisches Clearing empfohlen',
      detail: 'Vorab-Klärung der Aufnahmebedingungen',
      color: 'amber',
    };
  }

  // Default baseline
  return {
    status: 'open_admission',
    badge: 'Offene Sprechzeit beachten',
    detail: facility.openingHours?.walkIn || 'Sprechzeiten laut Aushang',
    color: 'emerald',
  };
}

/**
 * Evaluates whether a team warning note is still fresh for the current shift.
 * Enforces a strict 12-hour TTL (Time-To-Live) that automatically resets at 08:00 AM.
 * Prevents stale notes from persisting when caseworkers go on vacation or change shifts.
 */
export function getActiveNightWarning(
  notes: FacilityTeamNote[] = [],
  now: Date = new Date()
): { activeWarning: FacilityTeamNote | null; isExpired: boolean; formattedAge: string } {
  const warningNotes = notes.filter((n) => n.category === 'warning');
  if (warningNotes.length === 0) {
    return { activeWarning: null, isExpired: false, formattedAge: '' };
  }

  // Sort newest first
  const latestWarning = [...warningNotes].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )[0];

  const noteTime = new Date(latestWarning.createdAt).getTime();
  const nowTime = now.getTime();
  const diffHours = (nowTime - noteTime) / (1000 * 60 * 60);

  // Expiration Rule:
  // 1. More than 12 hours old -> EXPIRED
  // 2. OR Note was created yesterday evening and current time is past 08:00 AM today -> EXPIRED
  const isPastEightAm = now.getHours() >= 8;
  const isCreatedYesterday = new Date(latestWarning.createdAt).getDate() !== now.getDate();
  const isShiftExpired = diffHours > 12 || (isCreatedYesterday && isPastEightAm);

  if (isShiftExpired) {
    return { activeWarning: null, isExpired: true, formattedAge: '' };
  }

  const minutesAgo = Math.round((nowTime - noteTime) / (1000 * 60));
  let formattedAge = '';
  if (minutesAgo < 60) {
    formattedAge = `vor ${minutesAgo} Min.`;
  } else {
    const hours = Math.floor(minutesAgo / 60);
    formattedAge = `vor ${hours} Std.`;
  }

  return {
    activeWarning: latestWarning,
    isExpired: false,
    formattedAge,
  };
}
