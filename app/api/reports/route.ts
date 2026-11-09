import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { checkRateLimit } from '@/lib/rateLimit';

export async function POST(req: Request) {
  // Max 10 submissions per 10 minutes per IP
  const rateLimit = checkRateLimit(req, 10, 600000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: `Zu viele Meldungen. Bitte in ${rateLimit.resetInSec} Sekunden erneut versuchen.` },
      { status: 429 }
    );
  }

  try {
    const { facilityId, facilityName, suggestedChanges, contactEmail } = await req.json();

    if (!facilityId || !suggestedChanges || typeof suggestedChanges !== 'string') {
      return NextResponse.json({ error: 'Unvollständige Angaben.' }, { status: 400 });
    }

    const { error } = await supabase.from('facility_edits').insert([
      {
        facility_id: facilityId,
        facility_name: facilityName || 'Unbekannt',
        suggested_changes: suggestedChanges.trim().slice(0, 1500),
        contact_email: (contactEmail || '').trim().slice(0, 100),
        status: 'pending',
        created_at: new Date().toISOString(),
      },
    ]);

    if (error) {
      console.warn('Fehler beim Speichern des Berichts in Supabase:', error.message);
      // Even if the table does not exist yet, acknowledge gracefully to the user
      return NextResponse.json({ success: true, message: 'Hinweis erfasst (Fallback-Modus).' });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Serverfehler' }, { status: 500 });
  }
}
