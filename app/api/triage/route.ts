import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { TriageInput, TriageResponse, TriageStep } from '@/types/triage';
import { Facility } from '@/types/facility';
import { MOCK_FACILITIES } from '@/data/facilities';
import { supabase, fetchFacilitiesFromSupabase } from '@/lib/supabase';
import { checkRateLimit } from '@/lib/rateLimit';

// Helper: Matches district string with borough aliases
function matchesDistrictOrCitywide(facDistrictRaw: string, targetDistrictRaw: string): boolean {
  if (!targetDistrictRaw) return true;
  const facD = facDistrictRaw.toLowerCase().trim();
  const targetD = targetDistrictRaw.toLowerCase().trim();

  if (!facD || facD.includes('berlinweit') || facD === 'berlin') return true;
  if (facD.includes(targetD) || targetD.includes(facD)) return true;

  const targetParts = targetD.split(/[-–/\s]+/).filter((p) => p.length > 3);
  const facParts = facD.split(/[-–/\s]+/).filter((p) => p.length > 3);

  return targetParts.some((tp) => facD.includes(tp)) || facParts.some((fp) => targetD.includes(fp));
}

// Input sanitizer against prompt injection & oversized payloads
function sanitizeNotes(raw: string | undefined): string {
  if (!raw) return 'Keine';
  return raw
    .replace(/```/g, '')
    .replace(/<[^>]*>/g, '')
    .replace(/\b(system|assistant|instruction|prompt)\s*:/gi, '')
    .slice(0, 400)
    .trim() || 'Keine';
}

// 0-Tokens Deterministic Pre-Filter
function prefilterRelevantFacilities(input: TriageInput, allFacilities: Facility[]): Facility[] {
  const targetDistrict = input.district?.trim() || '';
  const isMinor = input.clientAge !== undefined && input.clientAge < 18;
  const isStableHoused = input.housingStatus === 'parental_home' || (input.housingStatus as string) === 'regular_rent';

  const filtered = allFacilities.filter((fac: any) => {
    const facDistrict = (fac.district || '').trim();
    const focus = (fac.primaryFocus || fac.category || '').toLowerCase();
    const name = (fac.name || '').toLowerCase();
    const targetGroups: string[] = Array.isArray(fac.targetGroups)
      ? fac.targetGroups.map((g: string) => g.toLowerCase())
      : [];

    // 1. Accessibility & Pet constraints
    if (input.hasPet && fac.features?.dogsAllowed === false) return false;
    if (input.hasMobilityImpairment && fac.features?.wheelchairAccessible === false) return false;

    // 2. Strict district jurisdiction for statutory agencies (Ämter)
    if (fac.institutionType === 'amt' && targetDistrict) {
      if (!matchesDistrictOrCitywide(facDistrict, targetDistrict)) {
        return false;
      }
    }

    // 3. Child protection & SGB VIII circuit breaker
    if (isMinor) {
      if (
        focus.includes('notuebernachtung') ||
        focus.includes('wohnungslos') ||
        focus.includes('sgb xii') ||
        name.includes('notübernachtung') ||
        name.includes('wohnheim') ||
        name.includes('jobcenter')
      ) {
        return false;
      }

      const isYouthFacility =
        targetGroups.includes('kinder') ||
        targetGroups.includes('jugendliche') ||
        targetGroups.includes('familie') ||
        focus.includes('jugend') ||
        focus.includes('familie') ||
        name.includes('jugendamt') ||
        name.includes('erziehungsberatung') ||
        name.includes('kinder- und jugend') ||
        name.includes('kinderschutz');

      if (!isYouthFacility) return false;
    } else {
      if (
        (name.includes('kindernotdienst') || name.includes('jugendnotdienst')) &&
        input.clientAge !== undefined && input.clientAge >= 21
      ) {
        return false;
      }
    }

    // 4. Substance & Mental Health filtering
    const isSubstance =
      focus.includes('sucht') ||
      focus.includes('droge') ||
      name.includes('sucht') ||
      name.includes('fixpunkt') ||
      name.includes('drogen');

    if (!input.needsSubstanceOrMentalSupport && isSubstance) {
      return false;
    }

    // 5. Stable housing constraint (no homeless shelters if client has tenancy)
    if (isStableHoused) {
      if (
        focus.includes('notuebernachtung') ||
        focus.includes('wohnungslos') ||
        name.includes('notübernachtung') ||
        name.includes('kältehilfe') ||
        name.includes('schlafplatz')
      ) {
        return false;
      }
    }

    // 6. District matching for local providers
    if (targetDistrict && facDistrict && !matchesDistrictOrCitywide(facDistrict, targetDistrict)) {
      if (!facDistrict.toLowerCase().includes('berlinweit') && facDistrict.toLowerCase() !== 'berlin') {
        return false;
      }
    }

    return true;
  });

  return filtered.slice(0, 10);
}

// Fallback logic when AI is unavailable
function generateFallback(input: TriageInput, candidates: Facility[]): TriageResponse {
  const isMinor = input.clientAge !== undefined && input.clientAge < 18;

  if (isMinor) {
    return {
      summary: `Jugendhilfe-Erstabklärung (SGB VIII) für den Bezirk ${input.district || 'Berlin'}.`,
      legalContext: ['SGB VIII (Kinder- und Jugendhilfe)', '§ 8a SGB VIII (Schutzauftrag)', '§ 28 SGB VIII (Erziehungsberatung)'],
      steps: [
        {
          phase: 'sofort',
          title: 'Kontaktaufnahme Jugendamt / Regionaler Sozialpädagogischer Dienst (RSD)',
          action: 'Persönliche oder telefonische Meldung beim RSD zur Sicherung des Kindeswohls und Klärung der Hilfen zur Erziehung.',
          requiredDocs: [input.hasIdOrPassport ? 'Schülerausweis / Ausweisdokument' : 'Vorsprache auch ohne Ausweis möglich'],
          matchedFacilities: candidates.filter(c => c.name.toLowerCase().includes('jugend')).slice(0, 1),
        },
        {
          phase: 'beratung',
          title: 'Erziehungs- und Familienberatung (EFB)',
          action: 'Niedrigschwellige Unterstützung zur Klärung der familiären Konfliktlage wahrnehmen.',
          requiredDocs: ['Keine Dokumente zwingend erforderlich'],
          matchedFacilities: candidates.filter(c => !c.name.toLowerCase().includes('jugendamt')).slice(0, 1),
        },
      ],
    };
  }

  const immediateFacilities = candidates.filter(c => 
    c.accessType === 'niedrigschwellig' || c.primaryFocus === 'betreutes_wohnen'
  ).slice(0, 1);

  const statutoryFacilities = candidates.filter(c => c.institutionType === 'amt').slice(0, 1);

  return {
    summary: `Sozialrechtlicher Stufenplan für den Bezirk ${input.district || 'Berlin'}.`,
    legalContext: ['SGB II / SGB XII', '§ 36 SGB XII (Unterkunftssicherung)', 'ASOG Berlin (Gefahrenabwehr)'],
    steps: [
      {
        phase: 'sofort',
        title: 'Akutversorgung & Notunterbringung',
        action: 'Klärung der unmittelbaren Existenz- und Übernachtungsmöglichkeit.',
        requiredDocs: [input.hasIdOrPassport ? 'Ausweisdokument' : 'Vorsprache zur Identitätsklärung'],
        matchedFacilities: immediateFacilities,
      },
      {
        phase: 'behoerde',
        title: 'Leistungs- und Existenzsicherung beim Amt',
        action: 'Persönliche Vorsprache in der Notfallsprechstunde zur Beantragung von existenzsichernden Leistungen.',
        requiredDocs: ['Kontoauszüge der letzten 3 Monate', 'Mietunterlagen / Mietvertrag (falls vorhanden)'],
        matchedFacilities: statutoryFacilities,
      },
    ],
  };
}

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

  // 2. Authentication check (Bearer Token)
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  if (!token) {
    return NextResponse.json(
      {
        error: 'AUTH_REQUIRED',
        message: 'Bitte erstelle ein kostenloses Fachkraft-Konto oder melde dich an, um die KI-Triage zu nutzen.',
      },
      { status: 401 }
    );
  }

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData?.user) {
    return NextResponse.json(
      {
        error: 'AUTH_REQUIRED',
        message: 'Sitzung abgelaufen. Bitte erneut anmelden.',
      },
      { status: 401 }
    );
  }

  // 3. Monthly Triage Quota Check (Max 3 / Month for free users)
  const currentMonth = new Date().toISOString().slice(0, 7);
  let usageInfo = { allowed: true, unlimited: false, used: 1, max: 3 };

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
        return NextResponse.json(
          {
            error: 'LIMIT_REACHED',
            used: currentCount,
            max: 3,
            message: 'Du hast deine 3 kostenlosen KI-Triagen für diesen Monat aufgebraucht.',
          },
          { status: 403 }
        );
      }

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
    } else if (limitData) {
      if (!limitData.allowed) {
        return NextResponse.json(
          {
            error: 'LIMIT_REACHED',
            used: limitData.used,
            max: limitData.max,
            message: 'Du hast deine 3 kostenlosen KI-Triagen für diesen Monat aufgebraucht.',
          },
          { status: 403 }
        );
      }
      usageInfo = limitData;
    }
  } catch (err) {
    console.warn('Could not verify triage quota:', err);
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
  } catch (e) {
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

  // Compact manifest for LLM prompt
  const miniFacilities = activeCandidates.map((f: any) => ({
    id: f.id,
    name: f.name,
    typ: f.institutionType,
    schwerpunkt: f.primaryFocus,
    bezirk: f.district || 'berlinweit',
  }));

  const apiKey = process.env.AI_API_KEY;
  const baseURL = process.env.AI_BASE_URL || 'https://api.deepseek.com';
  const model = process.env.AI_MODEL || 'deepseek-chat';

  if (!apiKey || apiKey.includes('hier-deinen-echten')) {
    return NextResponse.json(generateFallback(input, activeCandidates));
  }

  try {
    const isMinor = input.clientAge !== undefined && input.clientAge < 18;
    const cleanNotes = sanitizeNotes(input.notes);

    const systemPrompt = `
Du bist ein erfahrener Berliner Sozialarbeiter und Triage-Experte. Erstelle einen präzisen, sozialrechtlich fundierten 2-3 stufigen Handlungsplan als valides JSON-Objekt.

WICHTIGE FACHLICHE REGELN:
1. MINDERJÄHRIGE (< 18 Jahre):
   - Zuständigkeit liegt AUSSCHLIESSLICH im SGB VIII (Kinder- und Jugendhilfe, RSD/Jugendamt, Erziehungsberatung).
   - NIEMALS Obdachlosenunterkünfte, § 67 SGB XII oder Jobcenter für Minderjährige vorschlagen!
2. HÄUSLICHE GEWALT:
   - Bei häuslicher Gewalt hat der Schutz Vorrang: Immer Notfallkontakt BIG Hotline (030 611 03 00) oder Frauenkrisentelefon nennen.
3. GESICHERTER WOHNRAUM:
   - Bei vorhandenem Wohnraum keine Notunterkünfte zuweisen.
4. BEHÖRDEN-ZUGANG:
   - Bei Ämtern (Jobcenter, Jugendamt, Sozialamt) immer darauf hinweisen: "Offene Notfallsprechstunde (Terminvereinbarung empfohlen)".
5. ZUORDNUNG:
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
- Alter: ${input.clientAge ?? 'Unbekannt'} ${isMinor ? '(MINDERJÄHRIG - SGB VIII ZWINGEND!)' : ''}
- Meldebezirk: ${input.district || 'Ungeklärt / Berlin'}
- Wohnsituation: ${input.housingStatus}
- Aufenthaltsstatus: ${input.residenceStatus}
- Leistungsbezug: ${input.benefitStatus}
- Dringlichkeit: ${input.urgency}
- Sucht-/SpDi-Bedarf: ${input.needsSubstanceOrMentalSupport ? 'JA' : 'NEIN'}
- Häusliche Gewalt: ${input.isDomesticViolenceVictim ? 'JA - AKUTER SCHUTZBEDARF' : 'NEIN'}
- Schulden: ${input.hasDebtIssues ? 'JA' : 'NEIN'}
- Ausweis vorhanden: ${input.hasIdOrPassport ? 'JA' : 'NEIN'}
- Krankenkasse vorhanden: ${input.hasHealthInsurance ? 'JA' : 'NEIN'}
- Notizen / Fachkontext: ${cleanNotes}
`;

    const response = await fetch(`${baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.1,
        max_tokens: 1200,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('DeepSeek Fehler:', response.status, errText);
      return NextResponse.json(generateFallback(input, activeCandidates));
    }

    const aiData = await response.json();
    const rawContent = aiData.choices?.[0]?.message?.content || '{}';

    let cleanedContent = rawContent.trim();
    if (cleanedContent.startsWith('```json')) {
      cleanedContent = cleanedContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    let parsed: any;
    try {
      parsed = JSON.parse(cleanedContent);
    } catch {
      return NextResponse.json(generateFallback(input, activeCandidates));
    }

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
        const actionLower = (step.action || '').toLowerCase();
        
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
        // Note: NEVER push a random candidate fallback if unconfident!
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
      ...generateFallback(input, activeCandidates),
      usage: usageInfo,
    });
  }
}
