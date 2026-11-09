import { NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rateLimit';

export async function POST(req: Request) {
  // Rate limit: max 20 searches per 10 minutes per IP
  const rateLimit = checkRateLimit(req, 20, 600000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: `Zu viele Suchanfragen. Bitte in ${rateLimit.resetInSec} Sekunden erneut versuchen.` },
      { status: 429 }
    );
  }

  try {
    const { query } = await req.json();

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Ein Suchbegriff ist erforderlich.' },
        { status: 400 }
      );
    }

    const apiKey = process.env.EXA_API_KEY;

    if (!apiKey) {
      return NextResponse.json(
        { error: 'EXA_API_KEY ist in der .env.local nicht hinterlegt.' },
        { status: 500 }
      );
    }

    // Exa Neural Web Search API
    const response = await fetch('https://api.exa.ai/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
      },
      body: JSON.stringify({
        query: query.trim(),
        numResults: 5,
        type: 'neural',
        useAutoprompt: true,
        contents: {
          text: {
            maxCharacters: 500,
          },
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return NextResponse.json(
        { error: `Exa-API Fehler: ${errText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json({ results: data.results || [] });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Interner Serverfehler' },
      { status: 500 }
    );
  }
}
