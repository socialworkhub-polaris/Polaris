import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { TriageInput, TriageResponse, TriageStep } from '@/types/triage';
import { Facility } from '@/types/facility';
import { MOCK_FACILITIES } from '@/data/facilities';
import { supabase, fetchFacilitiesFromSupabase } from '@/lib/supabase';
import { checkRateLimit } from '@/lib/rateLimit';
import { executeStructuredPrompt } from '@/lib/ai/gateway';
import {
  prefilterRelevantFacilities,
  generateDeterministicTriage,
  sanitizeNotes,
} from '@/lib/triage/engine';

// ---------------------------------------------------------------------
// GET /api/triage: Check current user's monthly quota status
// ---------------------------------------------------------------------
export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  if (!token) {
    return NextResponse.json({
      authenticated: false,
      allowed: false,
      unlimited: false,
      used: 0,
      max: 3,
    });
  }

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData?.user) {
    return NextResponse.json({
      authenticated: false,
      allowed: false,
      unlimited: false,
      used: 0,
      max: 3,
    });
  }

  const currentMonth = new Date().toISOString().slice(0, 7);
  try {
    const userClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      {
        global: { headers: { Authorization: `Bearer ${token}` } },
      }
    );

    const { data: statusData, error: statusErr } = await userClient.rpc('get_triage_status', {
      p_month_year: currentMonth,
      p_max_allowed: 3,
    });

    if (!statusErr && statusData) {
      return NextResponse.json(statusData);
    }

    // Direct fallback query
    const { data: row } = await userClient
      .from('user_triage_usage')
      .select('count')
      .eq('user_id', userData.user.id)
      .eq('month_year', currentMonth)
      .maybeSingle();

    const used = row?.count || 0;
    return NextResponse.json({
      authenticated: true,
      allowed: used < 3,
      unlimited: false,
      used,
      max: 3,
    });
  } catch {
    return NextResponse.json({
      authenticated: true,
      allowed: true,
      unlimited: false,
      used: 0,
      max: 3,
    });
  }
}

// ---------------------------------------------------------------------
// POST /api/triage: AI Inference with Auth & Quota Enforcement
// ---------------------------------------------------------------------
export async function POST(req: Request) {
  // 1. IP rate limiting
  const rateLimit = checkRateLimit(req, 20, 600000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: `Zu viele Triage-Anfragen. Bitte in ${rateLimit.resetInSec} Sekunden erneut versuchen.` },
      { status: 429 }
    );
  }

  // 2. Authentication & Quota check (Graceful Fallback instead of lockout)
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  let isDeterministicFallback = false;
  let fallbackReason: 'AUTH_REQUIRED' | 'LIMIT_REACHED' | undefined;
  let fallbackMessage = '';
  const currentMonth = new Date().toISOString().slice(0, 7);
  let usageInfo = { allowed: true, unlimited: false, used: 0, max: 3 };

  if (!token) {
    isDeterministicFallback = true;
    fallbackReason = 'AUTH_REQUIRED';
    fallbackMessage = 'Deterministischer 0-Token Stufenplan aktiv. Melde dich kostenfrei an für erweitertes KI-Clearing (Mistral EU).';
  } else {
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) {
      isDeterministicFallback = true;
      fallbackReason = 'AUTH_REQUIRED';
      fallbackMessage = 'Sitzung abgelaufen. Deterministischer 0-Token Stufenplan aktiv. Bitte erneut anmelden für KI-Funktionen.';
    } else {
      // 3. Monthly Triage Quota Check (Max 3 / Month for free users)
      try {
        const userClient = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL || '',
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
          {
            global: { headers: { Authorization: `Bearer ${token}` } },
          }
        );

        const { data: limitData, error: limitErr } = await userClient.rpc('check_and_increment_triage', {
          p_month_year: currentMonth,
          p_max_allowed: 3,
        });

        if (limitErr) {
          console.warn('RPC check_and_increment_triage fallback:', limitErr.message);
          const { data: row } = await userClient
            .from('user_triage_usage')
            .select('count')
            .eq('user_id', userData.user.id)
            .eq('month_year', currentMonth)
            .maybeSingle();

          const currentCount = row?.count || 0;
          if (currentCount >= 3) {
            isDeterministicFallback = true;
            fallbackReason = 'LIMIT_REACHED';
            fallbackMessage = 'Du hast deine 3 kostenlosen KI-Triagen für diesen Monat aufgebraucht. Deterministischer 0-Token Stufenplan aktiv (unbegrenzt nutzbar).';
            usageInfo = { allowed: false, unlimited: false, used: currentCount, max: 3 };
          } else {
            await userClient.from('user_triage_usage').upsert(
              {
                user_id: userData.user.id,
                month_year: currentMonth,
                count: currentCount + 1,
                updated_at: new Date().toISOString(),
              },
              { onConflict: 'user_id,month_year' }
            );
            usageInfo = { allowed: true, unlimited: false, used: currentCount + 1, max: 3 };
          }
        } else if (limitData) {
          if (!limitData.allowed) {
            isDeterministicFallback = true;
            fallbackReason = 'LIMIT_REACHED';
            fallbackMessage = 'Du hast deine 3 kostenlosen KI-Triagen für diesen Monat aufgebraucht. Deterministischer 0-Token Stufenplan aktiv (unbegrenzt nutzbar).';
          }
          usageInfo = limitData;
        }
      } catch (err) {
        console.warn('Could not verify triage quota:', err);
      }
    }
  }

  let input: TriageInput;
  try {
    input = await req.json();
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage' }, { status: 400 });
  }

  // Load facilities: try Supabase first, fallback to MOCK_FACILITIES
  let allFacilities: Facility[] = MOCK_FACILITIES || [];
  try {
    const sb = await fetchFacilitiesFromSupabase();
    if (sb.facilities && sb.facilities.length > 0) {
      allFacilities = sb.facilities;
    }
  } catch {
    // silently keep mock data
  }

  // 1. Deterministic Pre-Filter (0 Tokens)
  const candidateFacilities = prefilterRelevantFacilities(input, allFacilities);

  const citywideFallback = allFacilities.filter((f: any) => {
    const d = (f.district || '').toLowerCase();
    return d.includes('berlinweit') || d === 'berlin';
  });

  const activeCandidates = candidateFacilities.length > 0
    ? candidateFacilities
    : citywideFallback.slice(0, 6);

  // If deterministic fallback is active (unauthenticated or quota reached)
  if (isDeterministicFallback) {
    const fallbackPlan = generateDeterministicTriage(input, activeCandidates);
    return NextResponse.json({
      ...fallbackPlan,
      usage: usageInfo,
      isDeterministicFallback: true,
      fallbackReason,
      message: fallbackMessage,
    });
  }

  // Compact manifest for LLM prompt
  const miniFacilities = activeCandidates.map((f: any) => ({
    id: f.id,
    name: f.name,
    typ: f.institutionType,
    schwerpunkt: f.primaryFocus,
    bezirk: f.district || 'berlinweit',
  }));

  try {
    const isMinor = input.clientAge !== undefined && input.clientAge < 18;
    const isYoungAdult = input.clientAge !== undefined && input.clientAge >= 18 && input.clientAge <= 21;
    const isEuCitizenWithoutJob = input.residenceStatus === 'eu_citizen' && (input.benefitStatus === 'none' || input.benefitStatus === 'unknown');
    const cleanNotes = sanitizeNotes(input.notes);

    const systemPrompt = `
Du bist ein erfahrener Berliner Sozialarbeiter und Triage-Experte. Erstelle einen präzisen, sozialrechtlich fundierten 2-3 stufigen Handlungsplan als valides JSON-Objekt.

WICHTIGE FACHLICHE REGELN:
1. MINDERJÄHRIGE (< 18 Jahre):
   - Zuständigkeit liegt AUSSCHLIESSLICH im SGB VIII (Kinder- und Jugendhilfe, RSD/Jugendamt, Erziehungsberatung).
   - NIEMALS Obdachlosenunterkünfte, § 67 SGB XII oder Jobcenter für Minderjährige vorschlagen!
2. JUNGE VOLLJÄHRIGE (18–21 Jahre):
   - Vorrangig Hilfen für junge Volljährige (§ 41 SGB VIII) und jugendspezifische Notaufnahmen / Sleep-Ins prüfen. Nicht ungefiltert in reguläre Erwachsenen-Männerunterkünfte vermitteln.
3. EU-BÜRGER OHNE LEISTUNGSBEZUG / ERWERBSTÄTIGKEIT:
   - § 7 Abs. 1 Satz 2 SGB II schließt Bürgergeld ohne Arbeitnehmerfreizügigkeit aus (kein Jobcenter-Erstgang!).
   - Vorrangig Überbrückungsleistungen nach § 23 Abs. 3 SGB XII beim Sozialamt für bis zu 1 Monat, Rückreisehilfen (§ 23 Abs. 3a SGB XII), Kältehilfeschutz via ASOG und Europaberatung.
4. FEHLENDE POSTALISCHE ERREICHBARKEIT:
   - Fehlt eine Melde-/Postadresse: Zwingend als Vorbedingung oder Schritt 1 die Einrichtung einer postalischen Erreichbarkeitsanschrift (z. B. Diakonie, Caritas, Tagesstätte) festlegen, da Anträge sonst nach §§ 60 ff. SGB I unwirksam bleiben.
5. HÄUSLICHE GEWALT:
   - Bei häuslicher Gewalt hat der Schutz Vorrang: Immer Notfallkontakt BIG Hotline (030 611 03 00) oder Frauenkrisentelefon nennen.
6. AKUTE OBDACHLOSIGKEIT & KÄLTEHILFE (LOGISTIK):
   - Wegen häufiger Vollbelegung: Zur Bettenabfrage immer auf die Kältehilfe-Clearingstelle der GEBEWO (030 34 39 70 37, 19–23 Uhr) oder den Kältebus (0178 523 58 38) verweisen.
   - Bei Haustieren (Hunden): Ausdrücklich darauf hinweisen, dass Hundehaltung nur in sehr wenigen Einrichtungen (z.B. Franklinstraße) erlaubt ist.
7. GESICHERTER WOHNRAUM:
   - Bei vorhandenem Wohnraum keine Notunterkünfte zuweisen.
8. BEHÖRDEN-ZUGANG:
   - Bei Ämtern (Jobcenter, Jugendamt, Sozialamt) immer darauf hinweisen: "Offene Notfallsprechstunde (Terminvereinbarung empfohlen)".
9. ZUORDNUNG:
   - Wähle für jeden Schritt eine passende facilityId AUSSCHLIESSLICH aus dieser Liste:
${JSON.stringify(miniFacilities)}
   - Wenn keine Einrichtung aus der Liste exakt zum Schritt passt, setze "facilityId": null.

JSON-SCHEMA:
{
  "summary": "1 prägnanter Satz zur sozialrechtlichen Ersteinschätzung",
  "legalContext": ["§§ Rechtsgrundlagen, z.B. § 8a SGB VIII oder § 36 SGB XII"],
  "steps": [
    {
      "phase": "sofort" | "behoerde" | "beratung",
      "title": "Titel des Schritts",
      "action": "Konkrete Handlungsanweisung für Fachkraft und Klient",
      "requiredDocs": ["Mitzubringende Unterlagen"],
      "facilityId": "id-aus-liste" oder null
    }
  ]
}
`;

    const userPrompt = `
Klientendaten:
- Alter: ${input.clientAge ?? 'Unbekannt'} ${isMinor ? '(MINDERJÄHRIG - SGB VIII ZWINGEND!)' : isYoungAdult ? '(JUNGER VOLLJÄHRIGER - § 41 SGB VIII PRÜFEN!)' : ''}
- Meldebezirk: ${input.district || 'Ungeklärt / Berlin'}
- Wohnsituation: ${input.housingStatus}
- Aufenthaltsstatus: ${input.residenceStatus} ${isEuCitizenWithoutJob ? '(EU-BÜRGER OHNE JOB - § 7 SGB II AUSSCHLUSS, § 23 SGB XII BEIM SOZIALAMT!)' : ''}
- Leistungsbezug: ${input.benefitStatus}
- Dringlichkeit: ${input.urgency}
- Postadresse vorhanden: ${input.hasPostalAddress ? 'JA' : 'NEIN (KEINE POSTALISCHE ERREICHBARKEIT - VORRANGIG EINRICHTEN!)'}
- Haustier vorhanden: ${input.hasPet ? 'JA (Hundeplätze stark kontingentiert - Vorab-Clearing nötig)' : 'NEIN'}
- Sucht-/SpDi-Bedarf: ${input.needsSubstanceOrMentalSupport ? 'JA' : 'NEIN'}
- Häusliche Gewalt: ${input.isDomesticViolenceVictim ? 'JA - AKUTER SCHUTZBEDARF' : 'NEIN'}
- Schulden: ${input.hasDebtIssues ? 'JA' : 'NEIN'}
- Ausweis vorhanden: ${input.hasIdOrPassport ? 'JA' : 'NEIN'}
- Krankenkasse vorhanden: ${input.hasHealthInsurance ? 'JA' : 'NEIN'}
- Notizen / Fachkontext: ${cleanNotes}
`;

    const aiResult = await executeStructuredPrompt<{
      summary: string;
      legalContext: string[];
      steps: {
        phase: 'sofort' | 'behoerde' | 'beratung';
        title: string;
        action: string;
        requiredDocs?: string[];
        facilityId?: string | null;
      }[];
    }>(systemPrompt, userPrompt, {
      temperature: 0.1,
      maxTokens: 1200,
    });

    if (!aiResult.success || !aiResult.data) {
      console.warn('AI Gateway Fallback triggered:', aiResult.error);
      const fallback = generateDeterministicTriage(input, activeCandidates);
      return NextResponse.json({
        ...fallback,
        usage: usageInfo,
      });
    }

    const parsed = aiResult.data;

    // Step facility enrichment with strict safety verification
    const stepsWithFacilities: TriageStep[] = (parsed.steps || []).map((step: any) => {
      let matched: Facility[] = [];

      if (step.facilityId) {
        const found = allFacilities.find((f) => f.id === step.facilityId);
        if (found) matched.push(found);
      }

      // If no valid ID was matched, attempt a conservative keyword match from activeCandidates
      if (matched.length === 0 && activeCandidates.length > 0) {
        const titleLower = (step.title || '').toLowerCase();

        const smartMatch = activeCandidates.find((c) => {
          const nameLower = c.name.toLowerCase();
          const subLower = (c.subTitle || '').toLowerCase();
          return (
            (titleLower.includes('jugend') && (nameLower.includes('jugend') || subLower.includes('jugend'))) ||
            (titleLower.includes('krisen') && (nameLower.includes('krisen') || subLower.includes('krisen'))) ||
            (titleLower.includes('notübernachtung') && (nameLower.includes('notübernachtung') || subLower.includes('notübernachtung'))) ||
            (titleLower.includes('sozialamt') && (nameLower.includes('sozialamt') || subLower.includes('sozialamt'))) ||
            (titleLower.includes('jobcenter') && (nameLower.includes('jobcenter') || subLower.includes('jobcenter'))) ||
            (titleLower.includes('wohnungs') && (nameLower.includes('wohnungs') || subLower.includes('wohnungs')))
          );
        });

        if (smartMatch) {
          matched.push(smartMatch);
        }
      }

      return {
        phase: step.phase || 'beratung',
        title: step.title || 'Handlungsschritt',
        action: step.action || '',
        requiredDocs: step.requiredDocs || [],
        matchedFacilities: matched,
      };
    });

    return NextResponse.json({
      summary: parsed.summary || 'Sozialrechtlicher Stufenplan erstellt.',
      legalContext: parsed.legalContext || [],
      steps: stepsWithFacilities,
      usage: usageInfo,
    });
  } catch (err) {
    console.error('Verarbeitungsfehler im Triage-Endpoint:', err);
    return NextResponse.json({
      ...generateDeterministicTriage(input, activeCandidates),
      usage: usageInfo,
    });
  }
}
