import { NextRequest, NextResponse } from 'next/server';
import { IngestionEngine } from '@/lib/ingestion/engine';

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow up to 60s for ingestion

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    const apiKey = req.headers.get('x-ingestion-key');
    const secret = process.env.INGESTION_SECRET || process.env.CRON_SECRET;

    // Secure authentication check
    if (secret) {
      const token = authHeader?.replace(/^Bearer\s+/i, '');
      if (token !== secret && apiKey !== secret) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const { searchParams } = new URL(req.url);
    const dryRun = searchParams.get('dryRun') !== 'false';

    const engine = new IngestionEngine();
    const result = await engine.run({ dryRun });

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Ingestion failed' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  // Preview route for health check & stats
  return NextResponse.json({
    status: 'ready',
    adapters: [
      'berlin-service-portal (Official Ämter: Sozialamt, Wohnungsamt, Jugendamt)',
      'berlin-ckan-places (Open Data Berlin: Freie Träger & Jugend/Familien-Zentren)',
    ],
    timestamp: new Date().toISOString(),
  });
}
