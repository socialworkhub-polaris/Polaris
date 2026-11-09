import { NextResponse } from 'next/server';
import { fetchFacilitiesFromSupabase } from '@/lib/supabase';
import { fetchFacilitiesFromNotion } from '@/lib/notion';
import { MOCK_FACILITIES } from '@/data/facilities';

// Cache route for 1 hour (revalidate in background)
export const revalidate = 3600;

export async function GET() {
  // 1. Try Supabase first (lightning fast sub-50ms PostgreSQL)
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
    console.warn('Supabase fetch failed, falling back to Notion/Mock:', err?.message);
  }

  // 2. Fallback to Notion
  try {
    const notionResult = await fetchFacilitiesFromNotion();
    if (notionResult.facilities && notionResult.facilities.length > 0) {
      return NextResponse.json(notionResult);
    }
  } catch (err: any) {
    console.warn('Notion fetch failed, using local Mock data:', err?.message);
  }

  // 3. Ultimate resilient fallback to local data
  return NextResponse.json({
    facilities: MOCK_FACILITIES,
    source: 'mock',
    count: MOCK_FACILITIES.length,
  });
}
