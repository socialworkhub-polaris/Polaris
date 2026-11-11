import { createClient } from '@supabase/supabase-js';
import { Facility } from '@/types/facility';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL oder Anon Key fehlen in .env.local!');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Transforms a raw Supabase PostgreSQL row into the application Facility model
 */
export function mapSupabaseRowToFacility(row: any): Facility {
  const reqDocs = Array.isArray(row.intake_rules?.requiredDocuments)
    ? row.intake_rules.requiredDocuments
    : [];

  const features = row.features || {};

  return {
    id: row.id,
    name: row.name || '',
    subTitle: row.sub_title || '',
    institutionType: row.institution_type || 'traeger',
    accessType: row.access_type || 'niedrigschwellig',
    primaryFocus: row.primary_focus || 'psychosozial_gesundheit',
    ageGroups: Array.isArray(row.age_groups) ? row.age_groups : [],
    district: row.district || 'Berlin',
    address: row.address || { street: '', zipCode: '', city: 'Berlin' },
    coordinates: Array.isArray(row.coordinates) && row.coordinates.length === 2 
      ? [row.coordinates[0], row.coordinates[1]] 
      : [52.5200, 13.4050],
    transit: row.transit || { station: '', lines: [], walkingTime: '' },
    contact: row.contact || { phone: '', email: '', website: '' },
    openingHours: row.opening_hours || { walkIn: '', appointment: '', phoneHours: '' },
    intakeRules: row.intake_rules || { summary: '', procedure: '', regionalJurisdiction: '' },
    requiredDocuments: reqDocs,
    legalBases: [],
    accessibility: {
      wheelchair: features.wheelchairAccessible ? 'voll' : 'nein',
      languages: Array.isArray(features.languages) ? features.languages : ['Deutsch'],
      elevator: Boolean(features.wheelchairAccessible),
    },
    internalWorkerNotes: '',
    targetGroups: Array.isArray(row.target_groups) ? row.target_groups : [],
    features: features,
  };
}

/**
 * Transforms a Facility object into a Supabase PostgreSQL row
 */
export function mapFacilityToSupabaseRow(fac: Facility): any {
  return {
    id: fac.id,
    name: fac.name,
    sub_title: fac.subTitle || '',
    institution_type: fac.institutionType,
    access_type: fac.accessType,
    primary_focus: fac.primaryFocus,
    age_groups: fac.ageGroups || [],
    district: fac.district,
    address: fac.address || {},
    coordinates: fac.coordinates || [],
    transit: fac.transit || {},
    contact: fac.contact || {},
    opening_hours: fac.openingHours || {},
    intake_rules: fac.intakeRules || {},
    target_groups: fac.targetGroups || [],
    features: fac.features || {},
    updated_at: new Date().toISOString(),
  };
}

/**
 * Fetches all facilities directly from Supabase
 */
export async function fetchFacilitiesFromSupabase(): Promise<{ facilities: Facility[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('facilities')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      return { facilities: [], error: error.message };
    }

    if (!data || data.length === 0) {
      return { facilities: [] };
    }

    const facilities = data.map(mapSupabaseRowToFacility);
    return { facilities };
  } catch (err: any) {
    return { facilities: [], error: err.message || 'Verbindungsfehler zu Supabase' };
  }
}
