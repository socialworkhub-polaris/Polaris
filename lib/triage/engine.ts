import { Facility } from '@/types/facility';
import { TriageInput, TriageResponse, TriageStep } from '@/types/triage';

/**
 * Normalizes and checks if a facility's district matches the target district
 * or provides citywide coverage in Berlin.
 */
export function matchesDistrictOrCitywide(facDistrictRaw?: string, targetDistrictRaw?: string): boolean {
  if (!targetDistrictRaw) return true;
  const facD = (facDistrictRaw || '').toLowerCase().trim();
  const targetD = targetDistrictRaw.toLowerCase().trim();

  if (!facD || facD.includes('berlinweit') || facD === 'berlin') return true;
  if (facD.includes(targetD) || targetD.includes(facD)) return true;

  const targetParts = targetD.split(/[-–/\s]+/).filter((p) => p.length > 3);
  const facParts = facD.split(/[-–/\s]+/).filter((p) => p.length > 3);

  return targetParts.some((tp) => facD.includes(tp)) || facParts.some((fp) => targetD.includes(fp));
}

/**
 * Sanitizes caseworker notes against injection and overflows.
 */
export function sanitizeNotes(raw: string | undefined): string {
  if (!raw) return 'Keine';
  return (
    raw
      .replace(/```/g, '')
      .replace(/<[^>]*>/g, '')
      .replace(/\b(system|assistant|instruction|prompt)\s*:/gi, '')
      .slice(0, 400)
      .trim() || 'Keine'
  );
}

/**
 * 0-Tokens Deterministic Pre-Filter.
 * Applies statutory safeguards (SGB VIII youth protection, housing constraints, pet/mobility filters).
 */
export function prefilterRelevantFacilities(input: TriageInput, allFacilities: Facility[]): Facility[] {
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
        input.clientAge !== undefined &&
        input.clientAge >= 21
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

/**
 * Offline Deterministic Triage Engine.
 * Generates an instant, socio-legally grounded Stufenplan without any API or network calls.
 * Implements strict German social statutory pathways (SGB VIII, SGB II, SGB XII, ASOG Berlin).
 */
export function generateDeterministicTriage(input: TriageInput, allFacilities: Facility[] = []): TriageResponse {
  const targetDistrict = input.district?.trim() || 'Berlin';
  const isMinor = input.clientAge !== undefined && input.clientAge < 18;
  const candidates = prefilterRelevantFacilities(input, allFacilities);

  // Helper to pick candidate matching criteria
  const findMatch = (predicate: (f: Facility) => boolean): Facility[] => {
    const fromCandidates = candidates.filter(predicate);
    if (fromCandidates.length > 0) return fromCandidates.slice(0, 1);
    const fromAll = allFacilities.filter(predicate);
    return fromAll.slice(0, 1);
  };

  // -------------------------------------------------------------
  // Scenario A: Minor (< 18 years) -> Strict SGB VIII Mandate
  // -------------------------------------------------------------
  if (isMinor) {
    const rsdFacilities = findMatch((f) => {
      const n = f.name.toLowerCase();
      return n.includes('jugendamt') || n.includes('rsd') || n.includes('jugend- und familienzentrum');
    });

    const advisoryFacilities = findMatch((f) => {
      const n = f.name.toLowerCase();
      return (
        n.includes('erziehungsberatung') ||
        n.includes('familienberatung') ||
        n.includes('kinderschutz') ||
        n.includes('jugendnotdienst')
      );
    });

    return {
      summary: `Jugendhilfe-Erstabklärung (SGB VIII) für den Bezirk ${targetDistrict}. Schutzauftrag und Clearing vorrangig.`,
      legalContext: [
        'SGB VIII (Kinder- und Jugendhilfe)',
        '§ 8a SGB VIII (Schutzauftrag bei Kindeswohlgefährdung)',
        '§ 28 SGB VIII (Erziehungsberatung)',
        '§ 42 SGB VIII (Inobhutnahme bei akuter Krise)',
      ],
      steps: [
        {
          phase: 'sofort',
          title: 'Kontaktaufnahme Jugendamt / Regionaler Sozialpädagogischer Dienst (RSD)',
          action: `Persönliche oder telefonische Meldung beim Jugendamt ${targetDistrict} zur Sicherung des Kindeswohls und Einleitung von Hilfen zur Erziehung.`,
          requiredDocs: [
            input.hasIdOrPassport ? 'Schülerausweis / Pass / Personalausweis' : 'Vorsprache auch ohne Ausweisdokument möglich',
            'Geburtsurkunde (falls griffbereit)',
          ],
          matchedFacilities: rsdFacilities,
        },
        {
          phase: 'beratung',
          title: 'Erziehungs- und Familienberatungsstelle (EFB)',
          action: 'Niedrigschwellige Beratung zur Deeskalation familiärer Konflikte und Klärung der Perspektive.',
          requiredDocs: ['Keine Unterlagen zwingend erforderlich (kostenfrei & vertraulich)'],
          matchedFacilities: advisoryFacilities,
        },
      ],
    };
  }

  // -------------------------------------------------------------
  // Scenario B: Domestic Violence Victim (Akuter Schutzbedarf)
  // -------------------------------------------------------------
  if (input.isDomesticViolenceVictim) {
    const womenShelters = findMatch((f) => {
      const n = f.name.toLowerCase();
      return n.includes('frauen') || n.includes('big hotline') || n.includes('zuflucht');
    });

    const statutoryAmt = findMatch((f) => f.institutionType === 'amt');

    return {
      summary: `Akuter Gewaltschutz und Schutzunterbringung für ${targetDistrict} (Gewaltschutzgesetz & SGB II/XII).`,
      legalContext: [
        'Gewaltschutzgesetz (GewSchG)',
        '§ 36 SGB XII (Unterkunftssicherung & Notversorgung)',
        'ASOG Berlin (Polizeiliche Wegweisung / Schutzmaßnahmen)',
      ],
      steps: [
        {
          phase: 'sofort',
          title: 'Unverzügliche Kontaktaufnahme BIG Hotline oder Frauenkrisentelefon',
          action: 'Anruf bei der BIG Hotline (030 611 03 00, täglich 08–23 Uhr) zur geschützten Krisenintervention und Vermittlung in ein Frauenhaus / eine Zufluchtswohnung.',
          requiredDocs: ['Wichtigste persönliche Dokumente nur mitnehmen, wenn gefahrlos möglich'],
          matchedFacilities: womenShelters,
        },
        {
          phase: 'behoerde',
          title: 'Vorsprache Sozialamt / Soziale Wohnhilfe (Kostenübernahme)',
          action: 'Beantragung der Kostenübernahme für die Schutzunterbringung und Sicherung des laufenden Lebensunterhalts.',
          requiredDocs: [
            input.hasIdOrPassport ? 'Ausweisdokument' : 'Ersatzidentitätsklärung',
            'Kontoauszüge (falls zugänglich)',
          ],
          matchedFacilities: statutoryAmt,
        },
      ],
    };
  }

  // -------------------------------------------------------------
  // Scenario C: Rent Arrears / Eviction Threat (Wohnraumerhalt)
  // -------------------------------------------------------------
  if (input.housingStatus === 'rent_threatened') {
    const sozwf = findMatch((f) => {
      const n = f.name.toLowerCase();
      return n.includes('wohnhilfe') || n.includes('sozialamt') || n.includes('wohnung');
    });

    const debtorAdvisory = findMatch((f) => {
      const n = f.name.toLowerCase();
      return n.includes('schuldner') || n.includes('beratung');
    });

    return {
      summary: `Wohnungserhalt und Mietschuldenübernahme (§ 36 SGB XII / § 22 Abs. 8 SGB II) im Bezirk ${targetDistrict}.`,
      legalContext: [
        '§ 22 Abs. 8 SGB II (Übernahme von Mietschulden)',
        '§ 36 SGB XII (Hilfe zur Abwendung von Wohnungslosigkeit)',
        '§ 569 Abs. 3 BGB (Heilung der Kündigung durch Schonfristzahlung)',
      ],
      steps: [
        {
          phase: 'sofort',
          title: 'Eilantrag bei der Fachstelle Soziale Wohnhilfe',
          action: `Sofortige Vorsprache bei der Sozialen Wohnhilfe ${targetDistrict} zur Beantragung eines Mietschuldendarlehens oder einer Übernahmezusage. Fristwahrung gegenüber Vermieter*in!`,
          requiredDocs: [
            'Mietvertrag & aktuelle Mietänderungsschreiben',
            'Kündigungsschreiben oder Räumungsklage',
            'Mietkontoauszug des Vermieters über den Rückstand',
            'Kontoauszüge der letzten 3 Monate',
          ],
          matchedFacilities: sozwf,
        },
        {
          phase: 'beratung',
          title: 'Soziale Schuldner- und Insolvenzberatung',
          action: 'Aufstellung eines Gläubiger- und Haushaltsplans zur langfristigen Stabilisierung der Finanzen.',
          requiredDocs: ['Aufstellung aller laufenden Verbindlichkeiten und Einkommensnachweise'],
          matchedFacilities: debtorAdvisory,
        },
      ],
    };
  }

  // -------------------------------------------------------------
  // Scenario D: Acute Homelessness (Akut obdachlos / Straße)
  // -------------------------------------------------------------
  if (input.housingStatus === 'homeless' || input.urgency === 'acute') {
    const emergencyShelters = findMatch((f) => {
      const n = f.name.toLowerCase();
      const foc = (f.primaryFocus || '').toLowerCase();
      return (
        n.includes('notübernachtung') ||
        n.includes('kälte') ||
        n.includes('stadtmission') ||
        n.includes('gebewo') ||
        foc.includes('wohnungslos')
      );
    });

    const statutorySozialamt = findMatch((f) => {
      const n = f.name.toLowerCase();
      return f.institutionType === 'amt' && (n.includes('sozialamt') || n.includes('wohnhilfe') || n.includes('amt'));
    });

    return {
      summary: `Akute Notunterbringung und Existenzsicherung für den Bezirk ${targetDistrict} (ASOG Berlin & SGB XII).`,
      legalContext: [
        'ASOG Berlin (Allgemeines Sicherheits- und Ordnungsgesetz / Obdachlosigkeit als Gefahr)',
        '§ 36 SGB XII / § 67 SGB XII (Wohnungsnotfallhilfe)',
        'SGB II / SGB XII (Existenzsichernde Barleistungen / Tagessatz)',
      ],
      steps: [
        {
          phase: 'sofort',
          title: 'Niedrigschwellige Notübernachtung / Tagesstätte',
          action: 'Unmittelbares Aufsuchen einer Notübernachtung zur Kälteabwehr und hygienischen Grundversorgung.',
          requiredDocs: [
            input.hasIdOrPassport ? 'Personalausweis oder Reisepass' : 'Vorsprache auch ohne Dokumente möglich',
          ],
          matchedFacilities: emergencyShelters,
        },
        {
          phase: 'behoerde',
          title: 'Vorsprache Soziale Wohnhilfe (ASOG-Einweisungsschein)',
          action: `Vorsprache in der Notfallsprechstunde des Bezirksamts ${targetDistrict} zur behördlichen Unterbringung (Hostel/Wohnheim) und Barauszahlung für den Lebensunterhalt.`,
          requiredDocs: [
            input.hasIdOrPassport ? 'Ausweisdokument' : 'Ersatzidentitätsnachweis',
            input.hasBankAccount ? 'Kontoauszüge' : 'Bestätigung über Mittellosigkeit',
          ],
          matchedFacilities: statutorySozialamt,
        },
      ],
    };
  }

  // -------------------------------------------------------------
  // Scenario E: Standard Baseline Triage
  // -------------------------------------------------------------
  const immediateFacilities = findMatch((c) => c.accessType === 'niedrigschwellig' || c.primaryFocus === 'betreutes_wohnen');
  const statutoryFacilities = findMatch((c) => c.institutionType === 'amt');
  const counselingFacilities = findMatch((c) => c.institutionType === 'traeger' && c.accessType !== 'niedrigschwellig');

  return {
    summary: `Sozialrechtlicher Stufenplan für den Bezirk ${targetDistrict}. Existenzsicherung und Fachberatung.`,
    legalContext: [
      'SGB II (Bürgergeld) / SGB XII (Sozialhilfe)',
      '§ 36 SGB XII (Unterkunftssicherung)',
      'ASOG Berlin (Gefahrenabwehr bei Obdachlosigkeit)',
    ],
    steps: [
      {
        phase: 'sofort',
        title: 'Akutversorgung & Erst-Clearing',
        action: 'Klärung der unmittelbaren Existenz- und Übernachtungsmöglichkeit im Sozialraum.',
        requiredDocs: [input.hasIdOrPassport ? 'Ausweisdokument' : 'Vorsprache zur Identitätsklärung'],
        matchedFacilities: immediateFacilities,
      },
      {
        phase: 'behoerde',
        title: 'Leistungsantrag beim zuständigen Amt',
        action: `Persönliche Vorsprache in der Notfallsprechstunde im Bezirk ${targetDistrict} zur Beantragung existenzsichernder Leistungen.`,
        requiredDocs: [
          'Personalausweis / Passdokument',
          'Kontoauszüge der letzten 3 Monate',
          input.hasHealthInsurance ? 'Krankenkassenkarte' : 'Nachweis über fehlenden Versicherungsschutz',
        ],
        matchedFacilities: statutoryFacilities,
      },
      {
        phase: 'beratung',
        title: 'Begleitende Fachberatung freier Träger',
        action: 'Sozialpädagogische Beratung zur langfristigen Klärung von Wohnen, Gesundheit und Perspektive.',
        requiredDocs: ['Leistungsbescheid (soweit bereits vorhanden)'],
        matchedFacilities: counselingFacilities,
      },
    ],
  };
}
