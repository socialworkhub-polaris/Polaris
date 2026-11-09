export type InstitutionType = 'amt' | 'traeger';

export type AccessType = 'niedrigschwellig' | 'antragspflichtig' | 'termin' ;

export type AgeGroup = 'u18' | 'junge_erwachsene' | 'erwachsene' | 'senioren';

export type PrimaryFocus =
  | 'freizeit_offen'
  | 'betreutes_wohnen'
  | 'existenzsicherung_aemter'
  | 'psychosozial_gesundheit';

export type BerlinDistrict =
  | 'Mitte'
  | 'Friedrichshain-Kreuzberg'
  | 'Pankow'
  | 'Charlottenburg-Wilmersdorf'
  | 'Spandau'
  | 'Steglitz-Zehlendorf'
  | 'Tempelhof-Schöneberg'
  | 'Neukölln'
  | 'Treptow-Köpenick'
  | 'Marzahn-Hellersdorf'
  | 'Lichtenberg'
  | 'Reinickendorf';

export interface Facility {
  id: string;
  name: string;
  subTitle: string;
  institutionType: InstitutionType; // 'amt' | 'traeger'
  accessType: AccessType; // 'niedrigschwellig' | 'antragspflichtig' | 'termin'
  primaryFocus: PrimaryFocus;
  ageGroups: AgeGroup[];
  district: BerlinDistrict;
  address: {
    street: string;
    zipCode: string;
    city: string;
  };
  coordinates: [number, number]; // [lat, lng]
  transit: {
    station: string; // e.g., "U-Bhf Karl-Marx-Straße"
    lines: string[]; // ["U7", "Bus 104"]
    walkingTime: string; // "3 Min. Fußweg"
  };
  contact: {
    phone: string;
    emergencyPhone?: string;
    email: string;
    website: string;
    intakePerson?: string;
  };
  openingHours: {
    walkIn: string; // e.g., "Mo, Di, Do: 08:30 – 12:30 Uhr (Ohne Termin)"
    appointment: string; // e.g., "Mo–Fr: nach telefonischer Vereinbarung"
    phoneHours: string; // e.g., "Mo–Do 09:00 – 15:00 Uhr"
  };
  intakeRules: {
    summary: string;
    procedure: string; // Step-by-step description of intake for social workers
    regionalJurisdiction?: string; // e.g., "Nur für gemeldete Bürger*innen im Bezirk Neukölln"
    waitingTimeEstimate?: string; // e.g., "Sofort / Keine Wartezeit" or "Ca. 2–4 Wochen"
  };
  requiredDocuments: string[]; // e.g., ["Gültiger Personalausweis oder Pass", "Aktueller Bürgergeldbescheid / SGB II", "Meldebescheinigung"]
  legalBases: string[]; // e.g., ["§ 16 SGB II", "§ 22 SGB II"]
  accessibility: {
    wheelchair: 'voll' | 'eingeschraenkt' | 'nein';
    languages: string[]; // e.g., ["Deutsch", "Englisch", "Türkisch", "Arabisch"]
    elevator: boolean;
  };
  internalWorkerNotes: string; // Practical tips for caseworkers (e.g. "Dienstags immer hoher Andrang vor 08:00 Uhr, Notfall-Clearing über Zimmer 104.")
  targetGroups?: string[];
  features?: {
    wheelchairAccessible?: boolean;
    languages?: string[];
    freeOfCharge?: boolean;
    anonymous?: boolean;
    dogsAllowed?: boolean;
    queerFriendly?: boolean;
  };
}

export interface FilterState {
  searchQuery: string;
  institutionType: 'all' | InstitutionType;
  accessType: 'all' | AccessType;
  primaryFocus: 'all' | PrimaryFocus;
  ageGroups: AgeGroup[];
  district: 'all' | BerlinDistrict;
  wheelchairOnly: boolean;
  language: 'all' | string;
}
