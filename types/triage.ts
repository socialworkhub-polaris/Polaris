import { Facility } from './facility';

export type HousingStatus = 
  | 'homeless'           // Akut obdachlos / Straße
  | 'rent_threatened'    // Zur Miete (Rückstände / Kündigung / Räumungsklage)
  | 'parental_home'      // Im elterlichen Haushalt
  | 'sheltered'          // Wohnheim / Notunterkunft / Hostel
  | 'precarious'         // Prekär / Bei Bekannten / Couchsurfing
  | 'institutional_exit';// Aus Entlassung (Klinik / JVA / Maßregelvollzug)

export type UrgencyLevel = 'acute' | 'high' | 'medium' | 'low';
export type LegalResidenceStatus = 'german' | 'eu_citizen' | 'third_country' | 'unclear';
export type BenefitStatus = 'none' | 'buergergeld' | 'sozialamt' | 'asylblg' | 'employed' | 'unknown';

export interface TriageInput {
  clientAge?: number;
  district?: string;
  housingStatus: HousingStatus;
  urgency: UrgencyLevel;
  residenceStatus: LegalResidenceStatus;
  benefitStatus: BenefitStatus;

  // Praktische Barrieren & Status
  hasIdOrPassport: boolean;
  hasPostalAddress: boolean;
  hasBankAccount: boolean;
  hasHealthInsurance: boolean;
  hasPet: boolean;
  hasMobilityImpairment: boolean;

  // Schulden & Finanzen
  hasDebtIssues: boolean;

  // Schutzbedarfe
  hasChildrenInHousehold: boolean;
  isPregnant: boolean;
  isDomesticViolenceVictim: boolean;
  needsSubstanceOrMentalSupport: boolean;

  notes: string;
}

export interface TriageStep {
  phase: 'sofort' | 'behoerde' | 'beratung';
  title: string;
  action: string;
  requiredDocs?: string[];
  matchedFacilities?: Facility[]; // <-- NEU: Gematchte Einrichtungen
}

export interface TriageResponse {
  summary: string;
  legalContext: string[];
  steps: TriageStep[];
}