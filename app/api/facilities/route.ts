import { NextResponse } from 'next/server';
import { fetchFacilitiesFromSupabase } from '@/lib/supabase';
import { MOCK_FACILITIES } from '@/data/facilities';

// Cache route for 1 hour (revalidate in background)
export const revalidate = 3600;

export async function GET() {
  // Primary: Supabase PostgreSQL (sub-50ms)
  try {
    const supabaseResult = await fetchFacilitiesFromSupabase();
    if (supabaseResult.facilities && supabaseResult.facilities.length > 0) {
      return NextResponse.json({
        facilities: supabaseResult.facilities,
        source: 'supabase',
        count: supabaseResult.facilities.length,
      });
    }
  } catch (err: any) {
    console.warn('Supabase fetch failed, falling back to local dataset:', err?.message);
  }

  // Resilient fallback to local dataset if offline
  return NextResponse.json({
    facilities: MOCK_FACILITIES,
    source: 'mock',
    count: MOCK_FACILITIES.length,
  });
}
