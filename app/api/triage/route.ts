import { NextResponse } from 'next/server';
import { TriageInput, TriageResponse, TriageStep } from '@/types/triage';
import { Facility } from '@/types/facility';
import { MOCK_FACILITIES } from '@/data/facilities';

// Hilfsfunktion: Prüft, ob zwei Bezirksangaben übereinstimmen (auch bei Bindestrich-Bezirken)
function matchesDistrictOrCitywide(facDistrictRaw: string, targetDistrictRaw: string): boolean {
  if (!targetDistrictRaw) return true;
  const facD = facDistrictRaw.toLowerCase().trim();
  const targetD = targetDistrictRaw.toLowerCase().trim();

  if (!facD || facD.includes('berlinweit') || facD === 'berlin') return true;
  if (facD.includes(targetD) || targetD.includes(facD)) return true;

  // Splitte bei Bindestrichen & Leerzeichen (z. B. "Friedrichshain-Kreuzberg" -> ["friedrichshain", "kreuzberg"])
  const targetParts = targetD.split(/[-–/\s]+/).filter((p) => p.length > 3);
  const facParts = facD.split(/[-–/\s]+/).filter((p) => p.length > 3);

  return targetParts.some((tp) => facD.includes(tp)) || facParts.some((fp) => targetD.includes(fp));
}

// 0 Tokens: Deterministischer Vorfilter nach Rechtskreis, Alter & Bezirk
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

    // 1. Physische Barrieren (Haustiere & Rollstuhl)
    if (input.hasPet && fac.features?.dogsAllowed === false) return false;
    if (input.hasMobilityImpairment && fac.features?.wheelchairAccessible === false) return false;

    // 2. Strikte Bezirkszuständigkeit bei Behörden/Ämtern
    if (fac.institutionType === 'amt' && targetDistrict) {
      if (!matchesDistrictOrCitywide(facDistrict, targetDistrict)) {
        return false; // Amt eines fremden Bezirks sofort ausschließen
      }
    }

    // 3. Altersgrenzen & Rechtskreis (Minderjährige -> SGB VIII)
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

    // 4. Schutzschalter: Sucht & Drogen
    const isSubstance =
      focus.includes('sucht') ||
      focus.includes('droge') ||
      name.includes('sucht') ||
      name.includes('fixpunkt') ||
      name.includes('drogen');

    if (!input.needsSubstanceOrMentalSupport && isSubstance) {
      return false;
    }

    // 5. Gesicherter Wohnraum (Elterlicher Haushalt / Miete)
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

    // 6. Freie Träger Bezirkszuordnung (nur bezirkseigene oder berlinweite Angebote)
    if (targetDistrict && facDistrict && !matchesDistrictOrCitywide(facDistrict, targetDistrict)) {
      if (!facDistrict.toLowerCase().includes('berlinweit') && facDistrict.toLowerCase() !== 'berlin') {
        return false;
      }
    }

    return true;
  });

  return filtered.slice(0, 8);
}

// Fallback ohne KI (deterministisch und bezirkssicher)
function generateFallback(input: TriageInput, candidates: Facility[]): TriageResponse {
  const isMinor = input.clientAge !== undefined && input.clientAge < 18;

  if (isMinor) {
    return {
      summary: `Jugendhilfe-Erstabklärung (SGB VIII) für den Bezirk ${input.district || 'Berlin'}.`,
      legalContext: ['SGB VIII (Kinder- und Jugendhilfe)', '§ 8a SGB VIII', '§ 28 SGB VIII (Erziehungsberatung)'],
      steps: [
        {
          phase: 'sofort',
          title: 'Kontaktaufnahme Jugendamt / RSD oder EFB',
          action: 'Beratungsgespräch beim Regionalen Sozialpädagogischen Dienst (RSD) oder einer Erziehungsberatungsstelle vereinbaren.',
          requiredDocs: [input.hasIdOrPassport ? 'Schülerausweis / Ausweis' : 'Soweit vorhanden Dokumente mitbringen'],
          matchedFacilities: candidates.slice(0, 1),
        },
        {
          phase: 'beratung',
          title: 'Familien- und Erziehungsberatung',
          action: 'Niedrigschwellige Unterstützung zur Klärung der familiären Situation wahrnehmen.',
          requiredDocs: ['Keine Dokumente zwingend erforderlich'],
          matchedFacilities: candidates.slice(1, 2),
        },
      ],
    };
  }

  return {
    summary: `Sozialrechtlicher Stufenplan für den Bezirk ${input.district || 'Berlin'}.`,
    legalContext: ['SGB II', '§ 36 SGB XII', 'ASOG Berlin'],
    steps: [
      {
        phase: 'sofort',
        title: 'Erstabklärung & Grundversorgung',
        action: 'Persönliche Vorsprache zur Klärung der Akutlage.',
        requiredDocs: [input.hasIdOrPassport ? 'Ausweisdokument' : 'Vorsprache zur Identitätsklärung'],
        matchedFacilities: candidates.slice(0, 1),
      },
      {
        phase: 'behoerde',
        title: 'Leistungs- und Existenzsicherung',
        action: 'Antragstellung bei der zuständigen Fachstelle (Offene Notfallsprechstunde, Termin empfohlen).',
        requiredDocs: ['Kontoauszüge der letzten 3 Monate', 'Mietunterlagen'],
        matchedFacilities: candidates.slice(1, 2),
      },
    ],
  };
}

export async function POST(req: Request) {
  let input: TriageInput;
  try {
    input = await req.json();
  } catch {
    return NextResponse.json({ error: 'Ungültige Anfrage' }, { status: 400 });
  }

  const allFacilities: Facility[] = MOCK_FACILITIES || [];
  
  // 1. Lokaler Vorfilter (0 Tokens)
  const candidateFacilities = prefilterRelevantFacilities(input, allFacilities);

  // Fallback-Pool: Nur berlinweite Träger oder Treffer aus dem Vorfilter (verhindert Mitte-Bias)
  const citywideFallback = allFacilities.filter((f: any) => {
    const d = (f.district || '').toLowerCase();
    return d.includes('berlinweit') || d === 'berlin';
  });

  const activeCandidates = candidateFacilities.length > 0
    ? candidateFacilities
    : citywideFallback.slice(0, 4);

  // Kompakter Auszug für den Prompt (ID, Name, Typ, Bezirk)
  const miniFacilities = activeCandidates.map((f: any) => ({
    id: f.id,
    name: f.name,
    typ: f.institutionType,
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

    const systemPrompt = `
Du bist ein erfahrener Berliner Sozialarbeiter. Erstelle einen präzisen, sozialrechtlich fundierten 2-3 stufigen Handlungsplan als valides JSON-Objekt.

WICHTIGE FACHLICHE REGELN:
1. MINDERJÄHRIGE (unter 18 Jahren):
   - Zuständigkeit liegt AUSSCHLIESSLICH im SGB VIII (Kinder- und Jugendhilfe, RSD/Jugendamt, Erziehungsberatung).
   - NIEMALS Obdachlosenunterkünfte, § 67 SGB XII oder Jobcenter für Minderjährige vorschlagen!
2. GESICHERTER WOHNRAUM / ELTERLICHER HAUSHALT:
   - Keinerlei Notunterkünfte oder Wohnungslosenhilfe vorschlagen.
3. THEMEN-FOKUS:
   - Erfinde KEINE Sucht-, Gewalt- oder Schuldenprobleme, wenn diese im Fall nicht explizit genannt sind.
4. BEHÖRDEN-ZUGANG:
   - Bei Ämtern (Jobcenter, Jugendamt, Sozialamt) immer darauf hinweisen: "Offene Notfallsprechstunde (Terminvereinbarung empfohlen)".

Wähle für jeden Schritt 1 passende Einrichtungs-ID aus den vorausgewählten Möglichkeiten:
${JSON.stringify(miniFacilities)}

JSON-SCHEMA (ausschließlich dieses Format ausgeben):
{
  "summary": "1 prägnanter Satz zur sozialrechtlichen Ersteinschätzung",
  "legalContext": ["Rechtsgrundlagen, z.B. § 28 SGB VIII oder § 36 SGB XII"],
  "steps": [
    {
      "phase": "sofort",
      "title": "Titel des Schritts",
      "action": "Konkrete Handlungsanweisung",
      "requiredDocs": ["Mitzubringende Unterlagen"],
      "facilityId": "id-aus-liste"
    }
  ]
}
Gültige Phasen: "sofort", "behoerde", "beratung".
`;

    const userPrompt = `
Klientendaten:
- Alter: ${input.clientAge ?? 'Unbekannt'} ${isMinor ? '(MINDERJÄHRIG - SGB VIII beachten!)' : ''}
- Meldebezirk: ${input.district || 'Ungeklärt / Berlin'}
- Wohnsituation: ${input.housingStatus}
- Dringlichkeit: ${input.urgency}
- Sucht-/SpDi-Bedarf: ${input.needsSubstanceOrMentalSupport ? 'JA' : 'NEIN'}
- Häusliche Gewalt: ${input.isDomesticViolenceVictim ? 'JA' : 'NEIN'}
- Schulden: ${input.hasDebtIssues ? 'JA' : 'NEIN'}
- Notizen/Besonderheiten: ${input.notes || 'Keine'}
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

    // Eventuelle Markdown-Codeblöcke bereinigen
    let cleanedContent = rawContent.trim();
    if (cleanedContent.startsWith('```json')) {
      cleanedContent = cleanedContent.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (cleanedContent.startsWith('```')) {
      cleanedContent = cleanedContent.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    let parsed: any;
    try {
      parsed = JSON.parse(cleanedContent);
    } catch (parseError) {
      console.error('JSON-Parsing fehlgeschlagen für Inhalt:', cleanedContent);
      return NextResponse.json(generateFallback(input, activeCandidates));
    }

    // Schritte mit Einrichtungen anreichern
    const stepsWithFacilities: TriageStep[] = (parsed.steps || []).map((step: any) => {
      let matched: Facility[] = [];
      if (step.facilityId) {
        const found = allFacilities.find((f) => f.id === step.facilityId);
        if (found) matched.push(found);
      }
      if (matched.length === 0 && activeCandidates.length > 0) {
        matched.push(activeCandidates[0]);
      }

      return {
        phase: step.phase || 'beratung',
        title: step.title || 'Schritt',
        action: step.action || '',
        requiredDocs: step.requiredDocs || [],
        matchedFacilities: matched,
      };
    });

    return NextResponse.json({
      summary: parsed.summary || 'Stufenplan erstellt.',
      legalContext: parsed.legalContext || [],
      steps: stepsWithFacilities,
    });
  } catch (err) {
    console.error('Verarbeitungsfehler, nutze Fallback:', err);
    return NextResponse.json(generateFallback(input, activeCandidates));
  }
}