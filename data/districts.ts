import { BerlinDistrict } from '@/types/facility';

export const BERLIN_DISTRICTS: BerlinDistrict[] = [
  'Mitte',
  'Friedrichshain-Kreuzberg',
  'Pankow',
  'Charlottenburg-Wilmersdorf',
  'Spandau',
  'Steglitz-Zehlendorf',
  'Tempelhof-Schöneberg',
  'Neukölln',
  'Treptow-Köpenick',
  'Marzahn-Hellersdorf',
  'Lichtenberg',
  'Reinickendorf',
];

export const PRIMARY_FOCUS_OPTIONS = [
  {
    id: 'freizeit_offen',
    label: 'Freizeit & Offene Angebote',
    description: 'Offene Kinder- und Jugendarbeit, Nachbarschaftszentren, offene Treffpunkte & Tagesstruktur',
  },
  {
    id: 'betreutes_wohnen',
    label: 'Betreutes Wohnen & Notunterkunft',
    description: 'BEW, TWG, Krisenwohnungen, Notschlafstellen, Kältehilfe & § 67 SGB XII',
  },
  {
    id: 'existenzsicherung_aemter',
    label: 'Existenzsicherung & Ämter',
    description: 'Jobcenter (Bürgergeld), Jugendamt (RSD), Wohnungsamt (Wohngeld/WBS), Sozialamt',
  },
  {
    id: 'psychosozial_gesundheit',
    label: 'Psychosoziale Krisen & Gesundheit',
    description: 'Sozialpsychiatrischer Dienst (SpDi), Berliner Krisendienst, Suchtberatung & Clearing',
  },
] as const;

export const AGE_GROUP_OPTIONS = [
  { id: 'u18', label: 'U18 (Kinder & Jugendliche)', legal: 'SGB VIII' },
  { id: 'junge_erwachsene', label: '18–27 (Junge Erwachsene)', legal: '§ 41 SGB VIII' },
  { id: 'erwachsene', label: 'Erwachsene (18+)', legal: 'SGB II / XII' },
  { id: 'senioren', label: 'Senioren (65+)', legal: 'SGB XII 4. Kap.' },
] as const;

export const COMMON_LANGUAGES = [
  'Deutsch',
  'Englisch',
  'Türkisch',
  'Arabisch',
  'Russisch',
  'Ukrainisch',
  'Farsi',
  'Polnisch',
  'Französisch',
  'Spanisch',
];

// District centroid coordinates for fallback when specific address coordinates are missing
export const DISTRICT_CENTROIDS: Record<BerlinDistrict, [number, number]> = {
  'Mitte': [52.5200, 13.4050],
  'Friedrichshain-Kreuzberg': [52.5020, 13.4350],
  'Pankow': [52.5690, 13.4010],
  'Charlottenburg-Wilmersdorf': [52.5080, 13.3040],
  'Spandau': [52.5350, 13.2000],
  'Steglitz-Zehlendorf': [52.4340, 13.2590],
  'Tempelhof-Schöneberg': [52.4700, 13.3700],
  'Neukölln': [52.4810, 13.4350],
  'Treptow-Köpenick': [52.4500, 13.5700],
  'Marzahn-Hellersdorf': [52.5400, 13.5900],
  'Lichtenberg': [52.5320, 13.5000],
  'Reinickendorf': [52.5900, 13.3200],
};

/**
 * Returns the centroid coordinates for a district, or defaults to Berlin Mitte
 */
export function getDistrictCoordinates(districtStr?: string | null): [number, number] {
  if (!districtStr) return DISTRICT_CENTROIDS['Mitte'];

  const normalized = districtStr.trim().toLowerCase();
  for (const [district, coords] of Object.entries(DISTRICT_CENTROIDS)) {
    if (
      district.toLowerCase() === normalized ||
      district.toLowerCase().includes(normalized) ||
      normalized.includes(district.toLowerCase())
    ) {
      return coords as [number, number];
    }
  }

  return DISTRICT_CENTROIDS['Mitte'];
}

