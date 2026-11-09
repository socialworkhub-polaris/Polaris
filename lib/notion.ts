import { Facility, InstitutionType, AccessType, PrimaryFocus, BerlinDistrict, AgeGroup } from '@/types/facility';
import { BERLIN_DISTRICTS, getDistrictCoordinates } from '@/data/districts';
import { MOCK_FACILITIES } from '@/data/facilities';

// ─────────────────────────────────────────────────
// Low-level fetch helper (no SDK version issues)
// ─────────────────────────────────────────────────
async function notionFetchDatabaseQuery(
  apiKey: string,
  databaseId: string,
  startCursor?: string
): Promise<any> {
  const body: Record<string, any> = { page_size: 100 };
  if (startCursor) body.start_cursor = startCursor;

  const res = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    cache: 'no-store',
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Notion API error ${res.status}`);
  }

  return res.json();
}

// ─────────────────────────────────────────────────
// Safe property extractors
// ─────────────────────────────────────────────────
function getTitle(prop: any): string {
  if (!prop?.title) return '';
  return prop.title.map((t: any) => t.plain_text || '').join('').trim();
}

function getSelect(prop: any): string {
  return prop?.select?.name?.trim() || '';
}

function getMultiSelect(prop: any): string[] {
  if (prop?.multi_select) return prop.multi_select.map((m: any) => m.name || '').filter(Boolean);
  if (prop?.select?.name) return [prop.select.name];
  return [];
}

function getRichText(prop: any): string {
  if (prop?.rich_text) return prop.rich_text.map((t: any) => t.plain_text || '').join('').trim();
  if (prop?.title) return getTitle(prop);
  return '';
}

function getNumber(prop: any): number | null {
  if (prop?.type === 'number' && typeof prop.number === 'number') return prop.number;
  return null;
}

// Find a property by trying several possible names (case-insensitive)
function findProp(properties: Record<string, any>, ...names: string[]): any {
  const keys = Object.keys(properties);
  for (const name of names) {
    const key = keys.find((k) => k.trim().toLowerCase() === name.toLowerCase());
    if (key) return properties[key];
  }
  return undefined;
}

// ─────────────────────────────────────────────────
// Domain mapping helpers
// ─────────────────────────────────────────────────
function mapInstitutionType(raw: string): InstitutionType {
  const t = raw.toLowerCase();
  if (t.includes('amt') || t.includes('behörde') || t.includes('öffentlich')) return 'amt';
  return 'traeger';
}

function mapDistrict(raw: string): BerlinDistrict {
  const norm = raw.trim().toLowerCase();
  for (const d of BERLIN_DISTRICTS) {
    if (d.toLowerCase() === norm || d.toLowerCase().includes(norm) || norm.includes(d.toLowerCase())) {
      return d;
    }
  }
  return 'Mitte';
}

function mapPrimaryFocus(rawTags: string[]): PrimaryFocus {
  const text = rawTags.join(' ').toLowerCase();
  if (text.includes('wohnen') || text.includes('bew') || text.includes('twg') || text.includes('notübernachtung') || text.includes('kältehilfe')) return 'betreutes_wohnen';
  if (text.includes('existenz') || text.includes('jobcenter') || text.includes('bürgergeld') || text.includes('jugendamt') || text.includes('rsd') || text.includes('wohnungsamt') || text.includes('ämter')) return 'existenzsicherung_aemter';
  if (text.includes('psycho') || text.includes('krise') || text.includes('gesund') || text.includes('sucht') || text.includes('spdi')) return 'psychosozial_gesundheit';
  return 'freizeit_offen';
}

function mapAgeGroups(tags: string[]): AgeGroup[] {
  const groups = new Set<AgeGroup>();
  for (const tag of tags) {
    const t = tag.toLowerCase();
    if (t.includes('u18') || t.includes('kind') || t.includes('jugend')) groups.add('u18');
    if (t.includes('18-27') || t.includes('18–27') || t.includes('jung') || t.includes('volljährig')) groups.add('junge_erwachsene');
    if (t.includes('erwachsen') || t.includes('18+') || t.includes('sgb ii')) groups.add('erwachsene');
    if (t.includes('senior') || t.includes('65+') || t.includes('rente')) groups.add('senioren');
  }
  if (groups.size === 0) return ['erwachsene'];
  return Array.from(groups);
}

function mapAccessType(zugang: string[]): AccessType {
  const text = zugang.join(' ').toLowerCase();
  if (text.includes('antrag') || text.includes('kostenübernahme') || text.includes('bescheid')) return 'antragspflichtig';
  return 'niedrigschwellig';
}

function parseAddress(raw: string) {
  const zipMatch = raw.match(/\b(1\d{4})\b/);
  return {
    street: raw.trim() || 'Berlin',
    zipCode: zipMatch?.[1] || '10115',
    city: 'Berlin',
  };
}

function parseTransit(raw: string) {
  if (!raw) return { station: 'ÖPNV-Haltestelle in der Nähe', lines: ['U/S-Bahn'], walkingTime: 'Ca. 5 Min. Fußweg' };
  const walkMatch = raw.match(/(\d+\s*Min[^.,;)]*)/i);
  const linesMatch = raw.match(/\(([^)]+)\)/);
  return {
    station: raw.split('(')[0].trim() || raw.trim(),
    lines: linesMatch ? linesMatch[1].split(/[,/]/).map((l) => l.trim()) : ['ÖPNV'],
    walkingTime: walkMatch ? walkMatch[1].trim() : 'Ca. 5 Min. Fußweg',
  };
}

function parseContact(raw: string) {
  const phoneMatch = raw.match(/(030[\s\d\/-]{4,}|01[567]\d[\s\d\/-]{5,}|\+49[\s\d\/-]{6,})/);
  const emailMatch = raw.match(/([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/);
  const urlMatch = raw.match(/(https?:\/\/[^\s,]+)/);
  return {
    phone: phoneMatch?.[1]?.trim() || '030 9000 0000',
    email: emailMatch?.[1]?.trim() || 'info@berlin.de',
    website: urlMatch?.[1]?.trim() || 'https://www.berlin.de',
  };
}

function parseDocuments(raw: string): string[] {
  if (!raw) return ['Gültiger Personalausweis oder Reisepass'];
  const items = raw.split(/[\n;•]+/).map((s) => s.replace(/^\d+[.)]\s*/, '').trim()).filter((s) => s.length > 2);
  return items.length > 0 ? items : ['Gültiger Personalausweis oder Reisepass'];
}

// ─────────────────────────────────────────────────
// Map a raw Notion page to Facility
// ─────────────────────────────────────────────────
function mapPageToFacility(page: any, index: number): Facility {
  const p = page.properties;

  const name = getTitle(findProp(p, 'Name', 'Titel', 'Title')) || `Einrichtung #${index + 1}`;

  // Type — Notion property is "Type" in this database
  const rawTyp = getSelect(findProp(p, 'Type', 'Typ', 'Trägertyp'));
  const institutionType = mapInstitutionType(rawTyp);

  const rawBezirk = getSelect(findProp(p, 'Bezirk', 'District'));
  const district = mapDistrict(rawBezirk);

  // Schwerpunkte is a multi_select in this DB
  const schwerpunktTags = getMultiSelect(findProp(p, 'Schwerpunkte', 'Schwerpunkt', 'Focus'));
  const primaryFocus = mapPrimaryFocus(schwerpunktTags);

  const zielgruppeTags = getMultiSelect(findProp(p, 'Zielgruppe', 'Target Group', 'Alter'));
  const ageGroups = mapAgeGroups(zielgruppeTags);

  const zugangTags = getMultiSelect(findProp(p, 'Zugang', 'Access'));
  const accessType = mapAccessType(zugangTags);

  const legalTags = getMultiSelect(findProp(p, 'Tags', 'Rechtsgrundlage', 'SGB'));
  const legalBases = legalTags.length > 0 ? legalTags : ['SGB'];

  const rawAdresse = getRichText(findProp(p, 'Adresse', 'Address', 'Standort'));
  const address = parseAddress(rawAdresse);

  const rawOepnv = getRichText(findProp(p, 'ÖPNV', 'OEPNV', 'Transit'));
  const transit = parseTransit(rawOepnv);

  const rawKontakt = getRichText(findProp(p, 'Kontakt', 'Contact', 'Telefon'));
  const contact = parseContact(rawKontakt);

  const rawUnterlagen = getRichText(findProp(p, 'Unterlagen', 'Dokumente', 'Documents'));
  const requiredDocuments = parseDocuments(rawUnterlagen);

  // Coordinates with district centroid fallback
  const lat = getNumber(findProp(p, 'Latitude', 'Lat', 'Breitengrad'));
  const lng = getNumber(findProp(p, 'Longitude', 'Lng', 'Längengrad'));

  const coordinates: [number, number] =
    lat !== null && lng !== null && lat > 50 && lat < 55 && lng > 12 && lng < 15
      ? [lat, lng]
      : getDistrictCoordinates(district);

  const isNiedrigschwellig = zugangTags.some((t) => t.toLowerCase().includes('walk') || t.toLowerCase().includes('offen'));

  return {
    id: page.id || `notion-${index}`,
    name,
    subTitle: `${institutionType === 'amt' ? 'Behörde / Amt' : 'Freier Träger'} – ${district}`,
    institutionType,
    accessType,
    primaryFocus,
    ageGroups,
    district,
    address,
    coordinates,
    transit,
    contact,
    openingHours: {
      walkIn: isNiedrigschwellig
        ? 'Offener Zugang / Sprechzeit vor Ort (kein Termin nötig)'
        : 'Nach Terminvereinbarung / Antragstellung',
      appointment: 'Terminvereinbarung telefonisch oder per Mail',
      phoneHours: 'Werktags zu den üblichen Geschäftszeiten',
    },
    intakeRules: {
      summary: `Zugangsmodus: ${accessType === 'niedrigschwellig' ? 'Niedrigschwellig & offen' : 'Antragspflichtig (Kostenübernahme/SGB erforderlich)'}.`,
      procedure: 'Vorsprache vor Ort oder telefonische Kontaktaufnahme zur Klärung der Zuständigkeit.',
      regionalJurisdiction: `Bezirk ${district} (bzw. berlinweit nach Absprache).`,
    },
    requiredDocuments,
    legalBases,
    accessibility: { wheelchair: 'voll', languages: ['Deutsch', 'Englisch'], elevator: true },
    internalWorkerNotes: `Datensatz aus Notion-Datenbank synchronisiert (ID: ${page.id.slice(0, 8)}...).`,
  };
}

// ─────────────────────────────────────────────────
// Main public function
// ─────────────────────────────────────────────────
export interface FetchResult {
  facilities: Facility[];
  source: 'notion' | 'mock';
  error?: string;
  totalNotionRecords?: number;
}

export async function fetchFacilitiesFromNotion(): Promise<FetchResult> {
  const apiKey = process.env.NOTION_API_KEY?.trim();
  const databaseId = process.env.NOTION_DATABASE_ID?.trim();

  const isPlaceholder = (v?: string) => !v || v.includes('YOUR_') || v.length < 10;

  if (isPlaceholder(apiKey) || isPlaceholder(databaseId)) {
    return {
      facilities: MOCK_FACILITIES,
      source: 'mock',
      error: 'Notion-Zugangsdaten fehlen oder enthalten Platzhalter. Mock-Daten werden verwendet.',
    };
  }

  try {
    const pages: any[] = [];
    let hasMore = true;
    let cursor: string | undefined = undefined;

    while (hasMore) {
      const data = await notionFetchDatabaseQuery(apiKey!, databaseId!, cursor);
      pages.push(...(data.results || []));
      hasMore = data.has_more;
      cursor = data.next_cursor;
    }

    if (pages.length === 0) {
      return {
        facilities: MOCK_FACILITIES,
        source: 'mock',
        error: 'Die Notion-Datenbank enthält keine Einträge. Mock-Daten werden verwendet.',
      };
    }

    const facilities: Facility[] = pages.map((page, i) => mapPageToFacility(page, i));

    return { facilities, source: 'notion', totalNotionRecords: facilities.length };
  } catch (err: any) {
    console.error('Notion API Fehler:', err?.message || err);
    return {
      facilities: MOCK_FACILITIES,
      source: 'mock',
      error: `Notion-Fehler: ${err?.message || 'Verbindung fehlgeschlagen'}. Mock-Daten werden verwendet.`,
    };
  }
}
