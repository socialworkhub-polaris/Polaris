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
      // Deduplicate facilities by name (prioritizing richer 'notion-' records)
      const seen = new Map<string, any>();
      supabaseResult.facilities.forEach((f) => {
        const key = f.name.trim().toLowerCase();
        if (!seen.has(key) || f.id.startsWith('notion-')) {
          seen.set(key, f);
        }
      });
      const uniqueFacilities = Array.from(seen.values());

      return NextResponse.json({
        facilities: uniqueFacilities,
        source: 'supabase',
        count: uniqueFacilities.length,
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
