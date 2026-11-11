import fs from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';
import { fetchFacilitiesFromSupabase } from '@/lib/supabase';
import { MOCK_FACILITIES } from '@/data/facilities';
import { Facility } from '@/types/facility';

// Cache route for 1 hour (revalidate in background)
export const revalidate = 3600;

export async function GET() {
  // 1. Primary: Supabase PostgreSQL (sub-50ms)
  try {
    const supabaseResult = await fetchFacilitiesFromSupabase();
    if (supabaseResult.facilities && supabaseResult.facilities.length > 0) {
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
    console.warn('Supabase fetch failed, checking ingested snapshot:', err?.message);
  }

  // 2. Secondary: Check local ingested snapshot from daten.berlin.de (298+ records)
  try {
    const snapshotPath = path.join(process.cwd(), 'data', 'ingested-facilities.json');
    if (fs.existsSync(snapshotPath)) {
      const raw = fs.readFileSync(snapshotPath, 'utf8');
      const parsed: Facility[] = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return NextResponse.json({
          facilities: parsed,
          source: 'open_data_snapshot',
          count: parsed.length,
        });
      }
    }
  } catch (err: any) {
    console.warn('Snapshot read failed, using mock data:', err?.message);
  }

  // 3. Tertiary: Resilient fallback to mock dataset
  return NextResponse.json({
    facilities: MOCK_FACILITIES,
    source: 'mock',
    count: MOCK_FACILITIES.length,
  });
}
