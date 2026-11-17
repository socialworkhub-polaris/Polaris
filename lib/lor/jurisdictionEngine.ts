import { BerlinDistrict } from '@/types/facility';

export interface StatutoryAgency {
  name: string;
  type: 'jobcenter' | 'jugendamt_rsd' | 'wohnhilfe' | 'spdi';
  title: string;
  address: string;
  phone: string;
  emergencyPhone?: string;
  emergencyHours: string;
  regularHours: string;
  statutoryBasis: string;
  internalAdvice: string;
  website?: string;
}

export interface DistrictJurisdiction {
  district: BerlinDistrict;
  postcodes: string[];
  jobcenter: StatutoryAgency;
  jugendamtRSD: StatutoryAgency;
  sozialeWohnhilfe: StatutoryAgency;
  spdi: StatutoryAgency;
}

export interface JurisdictionMatchResult {
  district: BerlinDistrict;
  matchedBy: 'zip' | 'street' | 'district_name';
  query: string;
  jobcenter: StatutoryAgency;
  jugendamtRSD: StatutoryAgency;
  sozialeWohnhilfe: StatutoryAgency;
  spdi: StatutoryAgency;
}

export const DISTRICT_JURISDICTIONS: Record<BerlinDistrict, DistrictJurisdiction> = {
  Mitte: {
    district: 'Mitte',
    postcodes: ['10115', '10117', '10119', '10178', '10179', '10551', '10553', '10555', '10557', '10559', '13347', '13349', '13351', '13353', '13355', '13357', '13359'],
    jobcenter: {
      name: 'Jobcenter Berlin Mitte',
      type: 'jobcenter',
      title: 'Jobcenter Berlin Mitte (Standort Müllerstraße & Sickingenstraße)',
      address: 'Müllerstraße 16, 13353 Berlin',
      phone: '030 5555 45 2222',
      emergencyHours: 'Mo, Di, Do, Fr: 08:00 – 12:30 Uhr (Ohne Termin bei Mittellosigkeit)',
      regularHours: 'Mo–Fr 08:00 – 12:30 Uhr, Do für Berufstätige bis 18:00 Uhr',
      statutoryBasis: 'SGB II (Bürgergeld, Grundsicherung für Arbeitsuchende)',
      internalAdvice: 'Bei akuter Mittellosigkeit am Eingang "Barauszahlung / Notfallvorsprache" verlangen. Kontoauszüge der letzten 3 Monate ungeschwärzt mitbringen.',
      website: 'https://www.berlin.de/jobcenter-mitte/',
    },
    jugendamtRSD: {
      name: 'Jugendamt Mitte – RSD',
      type: 'jugendamt_rsd',
      title: 'Bezirksamt Mitte – Regionaler Sozialdienst (RSD)',
      address: 'Karl-Marx-Allee 31, 10178 Berlin',
      phone: '030 9018 20',
      emergencyPhone: '030 344 666 (Berliner Notdienst Kinderschutz)',
      emergencyHours: 'Mo–Fr 08:00 – 18:00 Uhr (Diensthabender Krisendienst vor Ort)',
      regularHours: 'Di & Do 09:00 – 12:00 Uhr offene Sprechzeit',
      statutoryBasis: '§ 8a, §§ 27 ff. SGB VIII (Kinderschutz & Hilfen zur Erziehung)',
      internalAdvice: 'Bei § 8a Kindeswohlgefährdung direkt an den tagesaktuellen Notdienst des RSD verweisen und schriftliche Meldung faxen/mailen.',
    },
    sozialeWohnhilfe: {
      name: 'Soziale Wohnhilfe Mitte',
      type: 'wohnhilfe',
      title: 'Bezirksamt Mitte – Fachstelle Soziale Wohnhilfe & ASOG',
      address: 'Müllerstraße 146, 13353 Berlin',
      phone: '030 9018 43300',
      emergencyHours: 'Mo, Di, Do: 09:00 – 12:00 Uhr (Wohnungslosenhilfe Notfall)',
      regularHours: 'Di & Do 09:00 – 12:00 Uhr nach Nummernvergabe',
      statutoryBasis: '§ 36 SGB XII, § 22 Abs. 8 SGB II, ASOG Bln',
      internalAdvice: 'Bei Räumungsklage oder Kündigung: Mietvertragsunterlagen und Mahnungen im Original mitbringen. ASOG-Zuweisungsschein bei Obdachlosigkeit.',
    },
    spdi: {
      name: 'SpDi Mitte & Berliner Krisendienst',
      type: 'spdi',
      title: 'Sozialpsychiatrischer Dienst Bezirksamt Mitte',
      address: 'Turmstraße 21 (Haus A), 10559 Berlin',
      phone: '030 9018 33260',
      emergencyPhone: '030 390 63 10 (Berliner Krisendienst Mitte 24/7)',
      emergencyHours: '24/7 Krisen-Hotline erreichbar',
      regularHours: 'Mo–Fr 08:00 – 16:00 Uhr',
      statutoryBasis: 'Gesetz über Hilfen und Schutzmaßnahmen bei psychischen Krankheiten (PsychKG Bln)',
      internalAdvice: 'Bei akuter Eigen- oder Fremdgefährdung 24/7 Krisendienst unter 030 390 63 10 einschalten.',
    },
  },

  Neukölln: {
    district: 'Neukölln',
    postcodes: ['12043', '12045', '12047', '12049', '12051', '12053', '12055', '12057', '12059', '12351', '12353', '12355', '12357', '12359'],
    jobcenter: {
      name: 'Jobcenter Berlin Neukölln',
      type: 'jobcenter',
      title: 'Jobcenter Berlin Neukölln (Sonnenallee & Mainzer Str.)',
      address: 'Mainzer Straße 26, 12053 Berlin',
      phone: '030 5555 79 2222',
      emergencyHours: 'Mo, Di, Do, Fr: 08:00 – 12:30 Uhr (Notfall-Vorsprache)',
      regularHours: 'Mo–Fr 08:00 – 12:30 Uhr',
      statutoryBasis: 'SGB II (Bürgergeld)',
      internalAdvice: 'Hohes Besucheraufkommen ab 07:30 Uhr vor der Tür. Für Wohnungslose ohne Meldeadresse: Tagessatz-Auszahlung über Eingang B.',
      website: 'https://www.berlin.de/jobcenter-neukoelln/',
    },
    jugendamtRSD: {
      name: 'Jugendamt Neukölln – RSD',
      type: 'jugendamt_rsd',
      title: 'Bezirksamt Neukölln – Regionaler Sozialdienst',
      address: 'Karl-Marx-Straße 83, 12040 Berlin',
      phone: '030 90239 0',
      emergencyPhone: '030 344 666 (Kinderschutz-Hotline)',
      emergencyHours: 'Mo–Fr 08:30 – 18:00 Uhr (Krisendienst)',
      regularHours: 'Di & Do 09:00 – 12:00 Uhr',
      statutoryBasis: '§ 8a, §§ 27 ff. SGB VIII',
      internalAdvice: 'RSD-Region Nord (Nord-Neukölln) sitzt in der Donaustr. 89, Region Süd im Rathaus Neukölln.',
    },
    sozialeWohnhilfe: {
      name: 'Soziale Wohnhilfe Neukölln',
      type: 'wohnhilfe',
      title: 'Bezirksamt Neukölln – Fachstelle Soziale Wohnhilfe',
      address: 'Donaustraße 29, 12043 Berlin',
      phone: '030 90239 3737',
      emergencyHours: 'Mo, Di, Do: 09:00 – 11:30 Uhr (Notfall-Clearing)',
      regularHours: 'Di & Do 09:00 – 12:00 Uhr',
      statutoryBasis: '§ 36 SGB XII, ASOG',
      internalAdvice: 'Unterbringungsscheine nach ASOG werden bei Vorsprache bis 11:00 Uhr am gleichen Tag ausgestellt.',
    },
    spdi: {
      name: 'SpDi Neukölln & Krisendienst',
      type: 'spdi',
      title: 'Sozialpsychiatrischer Dienst Neukölln',
      address: 'Blaschkoallee 32, 12359 Berlin',
      phone: '030 90239 3880',
      emergencyPhone: '030 390 63 90 (Krisendienst Neukölln 24/7)',
      emergencyHours: '24/7 Krisenhotline',
      regularHours: 'Mo–Fr 08:00 – 16:00 Uhr',
      statutoryBasis: 'PsychKG Bln',
      internalAdvice: 'Krisendienst Neukölln befindet sich in der Karl-Marx-Str. 23 (Mo-Fr ab 16:00 Uhr & Wochenende rund um die Uhr).',
    },
  },

  'Friedrichshain-Kreuzberg': {
    district: 'Friedrichshain-Kreuzberg',
    postcodes: ['10243', '10245', '10247', '10249', '10961', '10963', '10965', '10967', '10969', '10997', '10999'],
    jobcenter: {
      name: 'Jobcenter Berlin Friedrichshain-Kreuzberg',
      type: 'jobcenter',
      title: 'Jobcenter Friedrichshain-Kreuzberg',
      address: 'Rudi-Dutschke-Straße 3, 10969 Berlin',
      phone: '030 5555 46 2222',
      emergencyHours: 'Mo, Di, Do, Fr: 08:00 – 12:30 Uhr (Notfallvorsprache)',
      regularHours: 'Mo–Fr 08:00 – 12:30 Uhr',
      statutoryBasis: 'SGB II',
      internalAdvice: 'Zentrale Lage nahe U Kochstraße. Bei fehlenden Kontoauszügen Online-Banking Nachweis am Smartphone möglich.',
      website: 'https://www.berlin.de/jobcenter-friedrichshain-kreuzberg/',
    },
    jugendamtRSD: {
      name: 'Jugendamt Friedrichshain-Kreuzberg',
      type: 'jugendamt_rsd',
      title: 'Regionaler Sozialdienst Friedrichshain-Kreuzberg',
      address: 'Frankfurter Allee 35/37, 10247 Berlin',
      phone: '030 90298 0',
      emergencyPhone: '030 344 666',
      emergencyHours: 'Mo–Fr 08:00 – 18:00 Uhr',
      regularHours: 'Di & Do 09:00 – 12:00 Uhr',
      statutoryBasis: '§ 8a, §§ 27 ff. SGB VIII',
      internalAdvice: 'Kreuzberg (Region Süd): Yorckstr. 4-11; Friedrichshain (Region Nord): Frankfurter Allee 35.',
    },
    sozialeWohnhilfe: {
      name: 'Soziale Wohnhilfe Friedrichshain-Kreuzberg',
      type: 'wohnhilfe',
      title: 'Fachstelle Soziale Wohnhilfe',
      address: 'Frankfurter Allee 35/37, 10247 Berlin',
      phone: '030 90298 2220',
      emergencyHours: 'Mo, Di, Do: 09:00 – 12:00 Uhr',
      regularHours: 'Di & Do 09:00 – 12:00 Uhr',
      statutoryBasis: '§ 36 SGB XII, ASOG',
      internalAdvice: 'Notfall-Einweisung nach ASOG über Zimmer 2.10.',
    },
    spdi: {
      name: 'SpDi Friedrichshain-Kreuzberg',
      type: 'spdi',
      title: 'Sozialpsychiatrischer Dienst Friedrichshain-Kreuzberg',
      address: 'Urbanstraße 24, 10961 Berlin',
      phone: '030 90298 8400',
      emergencyPhone: '030 390 63 50 (Krisendienst Fhain-Xberg 24/7)',
      emergencyHours: '24/7 Krisenhotline',
      regularHours: 'Mo–Fr 08:00 – 16:00 Uhr',
      statutoryBasis: 'PsychKG Bln',
      internalAdvice: 'Krisendienst Fhain-Xberg in der Adalbertstraße 95 B (Kreuzberg).',
    },
  },

  Pankow: {
    district: 'Pankow',
    postcodes: ['10119', '10405', '10407', '10409', '10435', '10437', '10439', '13086', '13088', '13089', '13125', '13127', '13129', '13156', '13158', '13159', '13187', '13189'],
    jobcenter: {
      name: 'Jobcenter Berlin Pankow',
      type: 'jobcenter',
      title: 'Jobcenter Berlin Pankow (Prenzlauer Berg & Weißensee)',
      address: 'Storkower Straße 133, 10407 Berlin',
      phone: '030 5555 15 2222',
      emergencyHours: 'Mo, Di, Do, Fr: 08:00 – 12:30 Uhr',
      regularHours: 'Mo–Fr 08:00 – 12:30 Uhr',
      statutoryBasis: 'SGB II',
      internalAdvice: 'Großstandort an der S-Bahn Storkower Str. Bei Neuanträgen Wartenummer im Eingangsbereich ziehen.',
      website: 'https://www.berlin.de/jobcenter-pankow/',
    },
    jugendamtRSD: {
      name: 'Jugendamt Pankow – RSD',
      type: 'jugendamt_rsd',
      title: 'Bezirksamt Pankow – RSD',
      address: 'Berliner Allee 252-260, 13088 Berlin',
      phone: '030 90295 0',
      emergencyPhone: '030 344 666',
      emergencyHours: 'Mo–Fr 08:00 – 18:00 Uhr',
      regularHours: 'Di & Do 09:00 – 12:00 Uhr',
      statutoryBasis: '§ 8a, §§ 27 ff. SGB VIII',
      internalAdvice: 'RSD Region Prenzlauer Berg sitzt in der Fröbelstr. 17 (Haus 7).',
    },
    sozialeWohnhilfe: {
      name: 'Soziale Wohnhilfe Pankow',
      type: 'wohnhilfe',
      title: 'Fachbereich Soziale Wohnhilfe Pankow',
      address: 'Fröbelstraße 17, 10405 Berlin',
      phone: '030 90295 5000',
      emergencyHours: 'Mo, Di, Do: 09:00 – 12:00 Uhr',
      regularHours: 'Di & Do 09:00 – 12:00 Uhr',
      statutoryBasis: '§ 36 SGB XII, ASOG',
      internalAdvice: 'Haus 2 im Bezirksamtskomplex Fröbelstraße.',
    },
    spdi: {
      name: 'SpDi Pankow & Krisendienst',
      type: 'spdi',
      title: 'Sozialpsychiatrischer Dienst Pankow',
      address: 'Grunowstraße 8-11, 13187 Berlin',
      phone: '030 90295 2832',
      emergencyPhone: '030 390 63 40 (Krisendienst Pankow 24/7)',
      emergencyHours: '24/7 Krisenhotline',
      regularHours: 'Mo–Fr 08:00 – 16:00 Uhr',
      statutoryBasis: 'PsychKG Bln',
      internalAdvice: 'Berliner Krisendienst Region Pankow: Mühlenstr. 48, 13187 Berlin.',
    },
  },

  'Charlottenburg-Wilmersdorf': {
    district: 'Charlottenburg-Wilmersdorf',
    postcodes: ['10585', '10587', '10589', '10623', '10625', '10627', '10629', '10707', '10709', '10711', '10713', '10715', '10717', '10719', '14050', '14052', '14053', '14055', '14057', '14059', '14193', '14197', '14199'],
    jobcenter: {
      name: 'Jobcenter Charlottenburg-Wilmersdorf',
      type: 'jobcenter',
      title: 'Jobcenter Berlin Charlottenburg-Wilmersdorf',
      address: 'Königin-Elisabeth-Straße 49, 14059 Berlin',
      phone: '030 5555 41 2222',
      emergencyHours: 'Mo, Di, Do, Fr: 08:00 – 12:30 Uhr',
      regularHours: 'Mo–Fr 08:00 – 12:30 Uhr',
      statutoryBasis: 'SGB II',
      internalAdvice: 'Zuständig für alle SGB II Leistungsbezieher im Bezirk. S-Bhf Westend.',
      website: 'https://www.berlin.de/jobcenter-charlottenburg-wilmersdorf/',
    },
    jugendamtRSD: {
      name: 'Jugendamt Charlottenburg-Wilmersdorf – RSD',
      type: 'jugendamt_rsd',
      title: 'Regionaler Sozialdienst Charlottenburg-Wilmersdorf',
      address: 'Otto-Suhr-Allee 100, 10585 Berlin',
      phone: '030 9029 10',
      emergencyPhone: '030 344 666',
      emergencyHours: 'Mo–Fr 08:00 – 18:00 Uhr',
      regularHours: 'Di & Do 09:00 – 12:00 Uhr',
      statutoryBasis: '§ 8a, §§ 27 ff. SGB VIII',
      internalAdvice: 'Rathaus Charlottenburg.',
    },
    sozialeWohnhilfe: {
      name: 'Soziale Wohnhilfe Charlottenburg-Wilmersdorf',
      type: 'wohnhilfe',
      title: 'Fachstelle Soziale Wohnhilfe',
      address: 'Otto-Suhr-Allee 100, 10585 Berlin',
      phone: '030 9029 14611',
      emergencyHours: 'Mo, Di, Do: 09:00 – 12:00 Uhr',
      regularHours: 'Di & Do 09:00 – 12:00 Uhr',
      statutoryBasis: '§ 36 SGB XII, ASOG',
      internalAdvice: 'Zimmer 114 für Notfallmeldungen Wohnungsverlust.',
    },
    spdi: {
      name: 'SpDi Charlottenburg-Wilmersdorf',
      type: 'spdi',
      title: 'Sozialpsychiatrischer Dienst Charlottenburg-Wilmersdorf',
      address: 'Hohenzollerndamm 174-177, 10713 Berlin',
      phone: '030 9029 16050',
      emergencyPhone: '030 390 63 20 (Krisendienst C-W 24/7)',
      emergencyHours: '24/7 Krisenhotline',
      regularHours: 'Mo–Fr 08:00 – 16:00 Uhr',
      statutoryBasis: 'PsychKG Bln',
      internalAdvice: 'Berliner Krisendienst C-W: Horstweg 30, 14059 Berlin.',
    },
  },

  Spandau: {
    district: 'Spandau',
    postcodes: ['13581', '13583', '13585', '13587', '13589', '13591', '13593', '13595', '13597', '13599', '14089'],
    jobcenter: {
      name: 'Jobcenter Berlin Spandau',
      type: 'jobcenter',
      title: 'Jobcenter Berlin Spandau',
      address: 'Brunsbütteler Damm 116-118, 13581 Berlin',
      phone: '030 5555 71 2222',
      emergencyHours: 'Mo, Di, Do, Fr: 08:00 – 12:30 Uhr',
      regularHours: 'Mo–Fr 08:00 – 12:30 Uhr',
      statutoryBasis: 'SGB II',
      internalAdvice: 'Bus M32 ab Bhf Spandau.',
      website: 'https://www.berlin.de/jobcenter-spandau/',
    },
    jugendamtRSD: {
      name: 'Jugendamt Spandau – RSD',
      type: 'jugendamt_rsd',
      title: 'Jugendamt Spandau Regionaler Dienst',
      address: 'Klosterstraße 36, 13581 Berlin',
      phone: '030 90279 0',
      emergencyPhone: '030 344 666',
      emergencyHours: 'Mo–Fr 08:00 – 18:00 Uhr',
      regularHours: 'Di & Do 09:00 – 12:00 Uhr',
      statutoryBasis: '§ 8a, §§ 27 ff. SGB VIII',
      internalAdvice: 'Notdiensttäglich besetzt in Klosterstr. 36.',
    },
    sozialeWohnhilfe: {
      name: 'Soziale Wohnhilfe Spandau',
      type: 'wohnhilfe',
      title: 'Soziale Wohnhilfe Bezirksamt Spandau',
      address: 'Galenstraße 14, 13597 Berlin',
      phone: '030 90279 3300',
      emergencyHours: 'Mo, Di, Do: 09:00 – 12:00 Uhr',
      regularHours: 'Di & Do 09:00 – 12:00 Uhr',
      statutoryBasis: '§ 36 SGB XII, ASOG',
      internalAdvice: 'Direkt gegenüber vom Rathaus Spandau.',
    },
    spdi: {
      name: 'SpDi Spandau & Krisendienst',
      type: 'spdi',
      title: 'Sozialpsychiatrischer Dienst Spandau',
      address: 'Klosterstraße 36, 13581 Berlin',
      phone: '030 90279 2355',
      emergencyPhone: '030 390 63 30 (Krisendienst Spandau 24/7)',
      emergencyHours: '24/7 Krisenhotline',
      regularHours: 'Mo–Fr 08:00 – 16:00 Uhr',
      statutoryBasis: 'PsychKG Bln',
      internalAdvice: 'Krisendienst Spandau befindet sich in der Charlottenstraße 13.',
    },
  },

  'Steglitz-Zehlendorf': {
    district: 'Steglitz-Zehlendorf',
    postcodes: ['12163', '12165', '12167', '12169', '12203', '12205', '12207', '12209', '14109', '14129', '14163', '14165', '14167', '14169', '14195'],
    jobcenter: {
      name: 'Jobcenter Berlin Steglitz-Zehlendorf',
      type: 'jobcenter',
      title: 'Jobcenter Steglitz-Zehlendorf',
      address: 'Birkenstraße 34, 12207 Berlin',
      phone: '030 5555 78 2222',
      emergencyHours: 'Mo, Di, Do, Fr: 08:00 – 12:30 Uhr',
      regularHours: 'Mo–Fr 08:00 – 12:30 Uhr',
      statutoryBasis: 'SGB II',
      internalAdvice: 'S-Bhf Osdorfer Straße.',
      website: 'https://www.berlin.de/jobcenter-steglitz-zehlendorf/',
    },
    jugendamtRSD: {
      name: 'Jugendamt Steglitz-Zehlendorf – RSD',
      type: 'jugendamt_rsd',
      title: 'RSD Steglitz-Zehlendorf',
      address: 'Kirchstraße 1/3, 14163 Berlin',
      phone: '030 90299 0',
      emergencyPhone: '030 344 666',
      emergencyHours: 'Mo–Fr 08:00 – 18:00 Uhr',
      regularHours: 'Di & Do 09:00 – 12:00 Uhr',
      statutoryBasis: '§ 8a, §§ 27 ff. SGB VIII',
      internalAdvice: 'Standort Zehlendorf (Kirchstr.) & Standort Steglitz (Schloßstr. 37).',
    },
    sozialeWohnhilfe: {
      name: 'Soziale Wohnhilfe Steglitz-Zehlendorf',
      type: 'wohnhilfe',
      title: 'Fachstelle Soziale Wohnhilfe',
      address: 'Hanna-Renate-Laurien-Platz 1, 12247 Berlin',
      phone: '030 90299 6350',
      emergencyHours: 'Mo, Di, Do: 09:00 – 12:00 Uhr',
      regularHours: 'Di & Do 09:00 – 12:00 Uhr',
      statutoryBasis: '§ 36 SGB XII, ASOG',
      internalAdvice: 'Rathaus Lankwitz.',
    },
    spdi: {
      name: 'SpDi Steglitz-Zehlendorf',
      type: 'spdi',
      title: 'Sozialpsychiatrischer Dienst Steglitz-Zehlendorf',
      address: 'Bergstraße 90, 12169 Berlin',
      phone: '030 90299 1520',
      emergencyPhone: '030 390 63 60 (Krisendienst S-Z 24/7)',
      emergencyHours: '24/7 Krisenhotline',
      regularHours: 'Mo–Fr 08:00 – 16:00 Uhr',
      statutoryBasis: 'PsychKG Bln',
      internalAdvice: 'Berliner Krisendienst S-Z: Schloßstraße 128.',
    },
  },

  'Tempelhof-Schöneberg': {
    district: 'Tempelhof-Schöneberg',
    postcodes: ['10777', '10779', '10781', '10783', '10823', '10825', '10827', '10829', '12099', '12101', '12103', '12105', '12107', '12109', '12157', '12159', '12161', '12277', '12279', '12305', '12307', '12309'],
    jobcenter: {
      name: 'Jobcenter Berlin Tempelhof-Schöneberg',
      type: 'jobcenter',
      title: 'Jobcenter Tempelhof-Schöneberg',
      address: 'Alarichstraße 12-17, 12105 Berlin',
      phone: '030 5555 77 2222',
      emergencyHours: 'Mo, Di, Do, Fr: 08:00 – 12:30 Uhr',
      regularHours: 'Mo–Fr 08:00 – 12:30 Uhr',
      statutoryBasis: 'SGB II',
      internalAdvice: 'U-Bhf Westphalweg. Notfallschalter im Erdgeschoss.',
      website: 'https://www.berlin.de/jobcenter-tempelhof-schoeneberg/',
    },
    jugendamtRSD: {
      name: 'Jugendamt Tempelhof-Schöneberg – RSD',
      type: 'jugendamt_rsd',
      title: 'Regionaler Sozialdienst Tempelhof-Schöneberg',
      address: 'John-F.-Kennedy-Platz, 10825 Berlin',
      phone: '030 90277 0',
      emergencyPhone: '030 344 666',
      emergencyHours: 'Mo–Fr 08:00 – 18:00 Uhr',
      regularHours: 'Di & Do 09:00 – 12:00 Uhr',
      statutoryBasis: '§ 8a, §§ 27 ff. SGB VIII',
      internalAdvice: 'Rathaus Schöneberg.',
    },
    sozialeWohnhilfe: {
      name: 'Soziale Wohnhilfe Tempelhof-Schöneberg',
      type: 'wohnhilfe',
      title: 'Fachstelle Soziale Wohnhilfe Tempelhof-Schöneberg',
      address: 'Tempelhofer Damm 165, 12099 Berlin',
      phone: '030 90277 2225',
      emergencyHours: 'Mo, Di, Do: 09:00 – 12:00 Uhr',
      regularHours: 'Di & Do 09:00 – 12:00 Uhr',
      statutoryBasis: '§ 36 SGB XII, ASOG',
      internalAdvice: 'Rathaus Tempelhof.',
    },
    spdi: {
      name: 'SpDi Tempelhof-Schöneberg',
      type: 'spdi',
      title: 'Sozialpsychiatrischer Dienst Tempelhof-Schöneberg',
      address: 'Rathausstraße 27, 12105 Berlin',
      phone: '030 90277 7575',
      emergencyPhone: '030 390 63 60 (Krisendienst 24/7)',
      emergencyHours: '24/7 Krisenhotline',
      regularHours: 'Mo–Fr 08:00 – 16:00 Uhr',
      statutoryBasis: 'PsychKG Bln',
      internalAdvice: 'Berliner Krisendienst T-S: Badensche Str. 29, 10715 Berlin.',
    },
  },

  'Treptow-Köpenick': {
    district: 'Treptow-Köpenick',
    postcodes: ['12435', '12437', '12439', '12459', '12487', '12489', '12524', '12526', '12527', '12529', '12555', '12557', '12559', '12587', '12589'],
    jobcenter: {
      name: 'Jobcenter Berlin Treptow-Köpenick',
      type: 'jobcenter',
      title: 'Jobcenter Treptow-Köpenick',
      address: 'Groß-Berliner Damm 73A, 12487 Berlin',
      phone: '030 5555 64 2222',
      emergencyHours: 'Mo, Di, Do, Fr: 08:00 – 12:30 Uhr',
      regularHours: 'Mo–Fr 08:00 – 12:30 Uhr',
      statutoryBasis: 'SGB II',
      internalAdvice: 'S-Bhf Schöneweide.',
      website: 'https://www.berlin.de/jobcenter-treptow-koepenick/',
    },
    jugendamtRSD: {
      name: 'Jugendamt Treptow-Köpenick – RSD',
      type: 'jugendamt_rsd',
      title: 'RSD Treptow-Köpenick',
      address: 'Hans-Schmidt-Straße 18, 12489 Berlin',
      phone: '030 90297 0',
      emergencyPhone: '030 344 666',
      emergencyHours: 'Mo–Fr 08:00 – 18:00 Uhr',
      regularHours: 'Di & Do 09:00 – 12:00 Uhr',
      statutoryBasis: '§ 8a, §§ 27 ff. SGB VIII',
      internalAdvice: 'Standort Adlershof.',
    },
    sozialeWohnhilfe: {
      name: 'Soziale Wohnhilfe Treptow-Köpenick',
      type: 'wohnhilfe',
      title: 'Soziale Wohnhilfe Treptow-Köpenick',
      address: 'Hans-Schmidt-Straße 18, 12489 Berlin',
      phone: '030 90297 6100',
      emergencyHours: 'Mo, Di, Do: 09:00 – 12:00 Uhr',
      regularHours: 'Di & Do 09:00 – 12:00 Uhr',
      statutoryBasis: '§ 36 SGB XII, ASOG',
      internalAdvice: 'Eingang Haus B.',
    },
    spdi: {
      name: 'SpDi Treptow-Köpenick',
      type: 'spdi',
      title: 'Sozialpsychiatrischer Dienst Treptow-Köpenick',
      address: 'Hans-Schmidt-Straße 18, 12489 Berlin',
      phone: '030 90297 3644',
      emergencyPhone: '030 390 63 70 (Krisendienst 24/7)',
      emergencyHours: '24/7 Krisenhotline',
      regularHours: 'Mo–Fr 08:00 – 16:00 Uhr',
      statutoryBasis: 'PsychKG Bln',
      internalAdvice: 'Berliner Krisendienst T-K: Spreestraße 6, 12439 Berlin.',
    },
  },

  'Marzahn-Hellersdorf': {
    district: 'Marzahn-Hellersdorf',
    postcodes: ['12619', '12621', '12623', '12627', '12629', '12679', '12681', '12683', '12685', '12687', '12689'],
    jobcenter: {
      name: 'Jobcenter Berlin Marzahn-Hellersdorf',
      type: 'jobcenter',
      title: 'Jobcenter Marzahn-Hellersdorf',
      address: 'Allee der Kosmonauten 29, 12681 Berlin',
      phone: '030 5555 65 2222',
      emergencyHours: 'Mo, Di, Do, Fr: 08:00 – 12:30 Uhr',
      regularHours: 'Mo–Fr 08:00 – 12:30 Uhr',
      statutoryBasis: 'SGB II',
      internalAdvice: 'Tram M8, 18 bis Springpfuhl.',
      website: 'https://www.berlin.de/jobcenter-marzahn-hellersdorf/',
    },
    jugendamtRSD: {
      name: 'Jugendamt Marzahn-Hellersdorf – RSD',
      type: 'jugendamt_rsd',
      title: 'RSD Marzahn-Hellersdorf',
      address: 'Riesaer Straße 94, 12627 Berlin',
      phone: '030 90293 0',
      emergencyPhone: '030 344 666',
      emergencyHours: 'Mo–Fr 08:00 – 18:00 Uhr',
      regularHours: 'Di & Do 09:00 – 12:00 Uhr',
      statutoryBasis: '§ 8a, §§ 27 ff. SGB VIII',
      internalAdvice: 'U-Bhf Hellersdorf.',
    },
    sozialeWohnhilfe: {
      name: 'Soziale Wohnhilfe Marzahn-Hellersdorf',
      type: 'wohnhilfe',
      title: 'Fachstelle Soziale Wohnhilfe',
      address: 'Riesaer Straße 94, 12627 Berlin',
      phone: '030 90293 4200',
      emergencyHours: 'Mo, Di, Do: 09:00 – 12:00 Uhr',
      regularHours: 'Di & Do 09:00 – 12:00 Uhr',
      statutoryBasis: '§ 36 SGB XII, ASOG',
      internalAdvice: 'Rathaus Hellersdorf.',
    },
    spdi: {
      name: 'SpDi Marzahn-Hellersdorf',
      type: 'spdi',
      title: 'Sozialpsychiatrischer Dienst Marzahn-Hellersdorf',
      address: 'Etkar-André-Straße 8, 12619 Berlin',
      phone: '030 90293 3711',
      emergencyPhone: '030 390 63 70 (Krisendienst 24/7)',
      emergencyHours: '24/7 Krisenhotline',
      regularHours: 'Mo–Fr 08:00 – 16:00 Uhr',
      statutoryBasis: 'PsychKG Bln',
      internalAdvice: 'Berliner Krisendienst M-H.',
    },
  },

  Lichtenberg: {
    district: 'Lichtenberg',
    postcodes: ['10315', '10317', '10318', '10319', '10365', '10367', '10369', '13051', '13053', '13055', '13057', '13059'],
    jobcenter: {
      name: 'Jobcenter Berlin Lichtenberg',
      type: 'jobcenter',
      title: 'Jobcenter Berlin Lichtenberg',
      address: 'Gotlindestraße 93, 10365 Berlin',
      phone: '030 5555 58 2222',
      emergencyHours: 'Mo, Di, Do, Fr: 08:00 – 12:30 Uhr',
      regularHours: 'Mo–Fr 08:00 – 12:30 Uhr',
      statutoryBasis: 'SGB II',
      internalAdvice: 'U-Bhf Magdalenenstraße.',
      website: 'https://www.berlin.de/jobcenter-lichtenberg/',
    },
    jugendamtRSD: {
      name: 'Jugendamt Lichtenberg – RSD',
      type: 'jugendamt_rsd',
      title: 'RSD Lichtenberg',
      address: 'Große-Leege-Straße 103, 13055 Berlin',
      phone: '030 90296 0',
      emergencyPhone: '030 344 666',
      emergencyHours: 'Mo–Fr 08:00 – 18:00 Uhr',
      regularHours: 'Di & Do 09:00 – 12:00 Uhr',
      statutoryBasis: '§ 8a, §§ 27 ff. SGB VIII',
      internalAdvice: 'Standort Hohenschönhausen.',
    },
    sozialeWohnhilfe: {
      name: 'Soziale Wohnhilfe Lichtenberg',
      type: 'wohnhilfe',
      title: 'Fachstelle Soziale Wohnhilfe Lichtenberg',
      address: 'Alt-Friedrichsfelde 60, 10315 Berlin',
      phone: '030 90296 8200',
      emergencyHours: 'Mo, Di, Do: 09:00 – 12:00 Uhr',
      regularHours: 'Di & Do 09:00 – 12:00 Uhr',
      statutoryBasis: '§ 36 SGB XII, ASOG',
      internalAdvice: 'Haus 1 im Bezirksamtsgelände.',
    },
    spdi: {
      name: 'SpDi Lichtenberg & Krisendienst',
      type: 'spdi',
      title: 'Sozialpsychiatrischer Dienst Lichtenberg',
      address: 'Alfred-Kowalke-Straße 24, 10315 Berlin',
      phone: '030 90296 7500',
      emergencyPhone: '030 390 63 70 (Krisendienst 24/7)',
      emergencyHours: '24/7 Krisenhotline',
      regularHours: 'Mo–Fr 08:00 – 16:00 Uhr',
      statutoryBasis: 'PsychKG Bln',
      internalAdvice: 'Berliner Krisendienst Ost.',
    },
  },

  Reinickendorf: {
    district: 'Reinickendorf',
    postcodes: ['13403', '13405', '13407', '13409', '13435', '13437', '13439', '13465', '13467', '13469', '13503', '13505', '13507', '13509'],
    jobcenter: {
      name: 'Jobcenter Berlin Reinickendorf',
      type: 'jobcenter',
      title: 'Jobcenter Berlin Reinickendorf',
      address: 'Inselstraße 22, 13629 Berlin',
      phone: '030 5555 76 2222',
      emergencyHours: 'Mo, Di, Do, Fr: 08:00 – 12:30 Uhr',
      regularHours: 'Mo–Fr 08:00 – 12:30 Uhr',
      statutoryBasis: 'SGB II',
      internalAdvice: 'U-Bhf Paulsternstraße.',
      website: 'https://www.berlin.de/jobcenter-reinickendorf/',
    },
    jugendamtRSD: {
      name: 'Jugendamt Reinickendorf – RSD',
      type: 'jugendamt_rsd',
      title: 'RSD Reinickendorf',
      address: 'Eichborndamm 215, 13437 Berlin',
      phone: '030 90294 0',
      emergencyPhone: '030 344 666',
      emergencyHours: 'Mo–Fr 08:00 – 18:00 Uhr',
      regularHours: 'Di & Do 09:00 – 12:00 Uhr',
      statutoryBasis: '§ 8a, §§ 27 ff. SGB VIII',
      internalAdvice: 'Rathaus Reinickendorf.',
    },
    sozialeWohnhilfe: {
      name: 'Soziale Wohnhilfe Reinickendorf',
      type: 'wohnhilfe',
      title: 'Fachstelle Soziale Wohnhilfe Reinickendorf',
      address: 'Eichborndamm 215, 13437 Berlin',
      phone: '030 90294 4040',
      emergencyHours: 'Mo, Di, Do: 09:00 – 12:00 Uhr',
      regularHours: 'Di & Do 09:00 – 12:00 Uhr',
      statutoryBasis: '§ 36 SGB XII, ASOG',
      internalAdvice: 'Rathaus Reinickendorf.',
    },
    spdi: {
      name: 'SpDi Reinickendorf & Krisendienst',
      type: 'spdi',
      title: 'Sozialpsychiatrischer Dienst Reinickendorf',
      address: 'Teichstraße 65, 13407 Berlin',
      phone: '030 90294 5010',
      emergencyPhone: '030 390 63 40 (Krisendienst 24/7)',
      emergencyHours: '24/7 Krisenhotline',
      regularHours: 'Mo–Fr 08:00 – 16:00 Uhr',
      statutoryBasis: 'PsychKG Bln',
      internalAdvice: 'Krisendienst Nord (Pankow/Reinickendorf).',
    },
  },
};

// Common Berlin streets mapped to prominent districts for instant fast lookup
export const PROMINENT_STREETS_TO_DISTRICT: Record<string, BerlinDistrict> = {
  // Neukölln
  sonnenallee: 'Neukölln',
  'karl-marx-str': 'Neukölln',
  'karl-marx-straße': 'Neukölln',
  hermannstr: 'Neukölln',
  hermannstraße: 'Neukölln',
  weserstr: 'Neukölln',
  weserstraße: 'Neukölln',
  pannierstr: 'Neukölln',
  pannierstraße: 'Neukölln',
  flughafenstr: 'Neukölln',
  flughafenstraße: 'Neukölln',
  columbiadamm: 'Neukölln',

  // Mitte
  friedrichstr: 'Mitte',
  friedrichstraße: 'Mitte',
  müllerstr: 'Mitte',
  müllerstraße: 'Mitte',
  badstr: 'Mitte',
  badstraße: 'Mitte',
  turmstr: 'Mitte',
  turmstraße: 'Mitte',
  torstr: 'Mitte',
  torstraße: 'Mitte',
  unterdenlinden: 'Mitte',
  'unter den linden': 'Mitte',
  leipzigerstr: 'Mitte',
  leipzigerstraße: 'Mitte',
  oranienburgerstr: 'Mitte',
  oranienburgerstraße: 'Mitte',

  // Friedrichshain-Kreuzberg
  oranienstr: 'Friedrichshain-Kreuzberg',
  oranienstraße: 'Friedrichshain-Kreuzberg',
  wienerstr: 'Friedrichshain-Kreuzberg',
  wienerstraße: 'Friedrichshain-Kreuzberg',
  bergmannstr: 'Friedrichshain-Kreuzberg',
  bergmannstraße: 'Friedrichshain-Kreuzberg',
  mehringdamm: 'Friedrichshain-Kreuzberg',
  kottbusserdamm: 'Friedrichshain-Kreuzberg',
  warschaustr: 'Friedrichshain-Kreuzberg',
  warschauerstraße: 'Friedrichshain-Kreuzberg',
  'simon-dach-str': 'Friedrichshain-Kreuzberg',
  'simon-dach-straße': 'Friedrichshain-Kreuzberg',
  boxhagenerstr: 'Friedrichshain-Kreuzberg',
  boxhagenerstraße: 'Friedrichshain-Kreuzberg',

  // Pankow
  schönhauserallee: 'Pankow',
  'schönhauser allee': 'Pankow',
  kastanienallee: 'Pankow',
  kollwitzstr: 'Pankow',
  kollwitzstraße: 'Pankow',
  prenzlauerallee: 'Pankow',
  'prenzlauer allee': 'Pankow',
  danzigerstr: 'Pankow',
  danzigerstraße: 'Pankow',
  berlinerallee: 'Pankow',
  'berliner allee': 'Pankow',

  // Charlottenburg-Wilmersdorf
  kurfürstendamm: 'Charlottenburg-Wilmersdorf',
  kudamm: 'Charlottenburg-Wilmersdorf',
  kantstr: 'Charlottenburg-Wilmersdorf',
  kantstraße: 'Charlottenburg-Wilmersdorf',
  wilmersdorferstr: 'Charlottenburg-Wilmersdorf',
  wilmersdorferstraße: 'Charlottenburg-Wilmersdorf',
  'otto-suhr-allee': 'Charlottenburg-Wilmersdorf',
  tauentzienstr: 'Charlottenburg-Wilmersdorf',
  tauentzienstraße: 'Charlottenburg-Wilmersdorf',

  // Spandau
  klosterstr: 'Spandau',
  klosterstraße: 'Spandau',
  brunsbüttelerdamm: 'Spandau',
  'brunsbütteler damm': 'Spandau',
  streitstr: 'Spandau',
  streitstraße: 'Spandau',

  // Steglitz-Zehlendorf
  schlossstr: 'Steglitz-Zehlendorf',
  schloßstr: 'Steglitz-Zehlendorf',
  schlossstraße: 'Steglitz-Zehlendorf',
  schloßstraße: 'Steglitz-Zehlendorf',
  clayallee: 'Steglitz-Zehlendorf',

  // Tempelhof-Schöneberg
  hauptstr: 'Tempelhof-Schöneberg',
  hauptstraße: 'Tempelhof-Schöneberg',
  tempelhoferdamm: 'Tempelhof-Schöneberg',
  'tempelhofer damm': 'Tempelhof-Schöneberg',
  potsdamerstr: 'Tempelhof-Schöneberg',
  potsdamerstraße: 'Tempelhof-Schöneberg',
};

/**
 * Resolves a Berlin postal code, street address, or district name into the exact statutory authorities.
 */
export function resolveJurisdictionByAddress(addressQuery: string): JurisdictionMatchResult | null {
  const clean = (addressQuery || '').trim().toLowerCase();
  if (!clean) return null;

  // 1. Direct Postal Code Match (5 digits)
  const zipMatch = clean.match(/\b(1\d{4})\b/);
  if (zipMatch) {
    const zip = zipMatch[1];
    for (const [districtKey, data] of Object.entries(DISTRICT_JURISDICTIONS)) {
      if (data.postcodes.includes(zip)) {
        return {
          district: districtKey as BerlinDistrict,
          matchedBy: 'zip',
          query: zip,
          jobcenter: data.jobcenter,
          jugendamtRSD: data.jugendamtRSD,
          sozialeWohnhilfe: data.sozialeWohnhilfe,
          spdi: data.spdi,
        };
      }
    }
  }

  // 2. Direct District Name Match
  for (const [districtKey, data] of Object.entries(DISTRICT_JURISDICTIONS)) {
    if (clean.includes(districtKey.toLowerCase())) {
      return {
        district: districtKey as BerlinDistrict,
        matchedBy: 'district_name',
        query: districtKey,
        jobcenter: data.jobcenter,
        jugendamtRSD: data.jugendamtRSD,
        sozialeWohnhilfe: data.sozialeWohnhilfe,
        spdi: data.spdi,
      };
    }
  }

  // 3. Street Name Substring Match
  for (const [streetKey, district] of Object.entries(PROMINENT_STREETS_TO_DISTRICT)) {
    if (clean.includes(streetKey)) {
      const data = DISTRICT_JURISDICTIONS[district];
      return {
        district,
        matchedBy: 'street',
        query: streetKey,
        jobcenter: data.jobcenter,
        jugendamtRSD: data.jugendamtRSD,
        sozialeWohnhilfe: data.sozialeWohnhilfe,
        spdi: data.spdi,
      };
    }
  }

  return null;
}
