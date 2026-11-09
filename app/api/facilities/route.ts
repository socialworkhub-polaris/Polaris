import { NextResponse } from 'next/server';
import { fetchFacilitiesFromNotion } from '@/lib/notion';

export async function GET() {
  const result = await fetchFacilitiesFromNotion();
  return NextResponse.json(result);
}