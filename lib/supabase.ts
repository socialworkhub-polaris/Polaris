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
    id: String(row.id || ''),
    name: String(row.name || ''),
    subTitle: String(row.sub_title || ''),
    institutionType: row.institution_type || 'traeger',
    accessType: row.access_type || 'niedrigschwellig',
    primaryFocus: row.primary_focus || 'psychosozial_gesundheit',
    ageGroups: Array.isArray(row.age_groups) ? row.age_groups : [],
    district: (row.district || 'Berlin') as any,
    address: {
      street: String(row.address?.street || ''),
      zipCode: String(row.address?.zipCode || ''),
      city: String(row.address?.city || 'Berlin'),
    },
    coordinates: Array.isArray(row.coordinates) && row.coordinates.length === 2 && typeof row.coordinates[0] === 'number' && typeof row.coordinates[1] === 'number' && !isNaN(row.coordinates[0]) && !isNaN(row.coordinates[1])
      ? [row.coordinates[0], row.coordinates[1]] 
      : [52.5200, 13.4050],
    transit: {
      station: String(row.transit?.station || ''),
      lines: Array.isArray(row.transit?.lines) ? row.transit.lines : [],
      walkingTime: String(row.transit?.walkingTime || ''),
    },
    contact: {
      phone: String(row.contact?.phone || ''),
      email: String(row.contact?.email || ''),
      website: String(row.contact?.website || ''),
      emergencyPhone: row.contact?.emergencyPhone ? String(row.contact.emergencyPhone) : undefined,
    },
    openingHours: {
      walkIn: String(row.opening_hours?.walkIn || ''),
      appointment: String(row.opening_hours?.appointment || ''),
      phoneHours: String(row.opening_hours?.phoneHours || ''),
    },
    intakeRules: {
      summary: String(row.intake_rules?.summary || ''),
      procedure: String(row.intake_rules?.procedure || ''),
      regionalJurisdiction: String(row.intake_rules?.regionalJurisdiction || ''),
    },
    requiredDocuments: reqDocs,
    legalBases: Array.isArray(row.legal_bases) ? row.legal_bases : [],
    accessibility: {
      wheelchair: features.wheelchairAccessible ? 'voll' : 'nein',
      languages: Array.isArray(features.languages) && features.languages.length > 0 ? features.languages : ['Deutsch'],
      elevator: Boolean(features.wheelchairAccessible),
    },
    internalWorkerNotes: String(row.internal_worker_notes || ''),
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
