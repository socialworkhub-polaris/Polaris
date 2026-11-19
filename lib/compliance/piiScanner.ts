/**
 * PII & Sozialdatenschutz Guard for Polaris
 * Enforces § 35 SGB I (Sozialgeheimnis) and § 203 StGB (Berufliche Schweigepflicht).
 *
 * Scans caseworker notes, team announcements, and bulletin board entries for
 * accidental inclusion of personally identifiable client information (PII).
 */

export interface PIIScanResult {
  hasPII: boolean;
  detectedTypes: string[];
  warnings: string[];
}

export function scanTextForPII(text?: string | null): PIIScanResult {
  if (!text || typeof text !== 'string') {
    return { hasPII: false, detectedTypes: [], warnings: [] };
  }

  const detectedTypes: string[] = [];
  const warnings: string[] = [];

  // 1. Email addresses
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
  if (emailRegex.test(text)) {
    detectedTypes.push('E-Mail-Adresse');
    warnings.push('Enthält eine E-Mail-Adresse.');
  }

  // 2. German Phone Numbers (Mobile, Berlin Festnetz, Hotlines)
  const phoneRegex = /(?:\+49|0049|0)(?:[1-9]\d{1,4}[ /-]?)?\d{4,9}\b/;
  // Exclude common safe short year/code patterns, only trigger on >= 7 digits
  const digitMatches = text.match(/(?:\+49[\s\d/-]{7,}|0[1-9][\s\d/-]{6,})/g);
  if (digitMatches && digitMatches.some((m) => m.replace(/\D/g, '').length >= 7)) {
    detectedTypes.push('Telefonnummer');
    warnings.push('Enthält eine Telefon- oder Handynummer.');
  }

  // 3. Date of Birth patterns
  // Explicit DOB marker: "geb. 15.03.1990", "Geburtsdatum: 12.04.1985"
  const explicitDobRegex = /(?:geb\.?|gebo?ren(?:\s+am)?|geburtsdatum\s*:?|d\.?o\.?b\.?\s*:?)\s*(\d{1,2}[./]\d{1,2}[./]\d{2,4})/i;
  
  // Historical birth year range (1920 - 2023) without appointment/procedural prefixes
  const appointmentPrefixRegex = /(?:termin|vorsprache|frist|g[uü]ltig\s+bis|bescheid\s+vom|datum\s*:?|am|ab|bis)\s+(?:am\s+)?(\d{1,2}[./]\d{1,2}[./]\d{2,4})/i;
  const historicalDateRegex = /\b(?:0[1-9]|[12][0-9]|3[01])\.(?:0[1-9]|1[0-2])\.(?:19[2-9]\d|20[0-1]\d|202[0-3])\b/;

  const isAppointmentDate = appointmentPrefixRegex.test(text);
  const hasExplicitDob = explicitDobRegex.test(text);
  const hasHistoricalDate = historicalDateRegex.test(text);

  if (hasExplicitDob || (hasHistoricalDate && !isAppointmentDate)) {
    detectedTypes.push('Geburtsdatum');
    warnings.push('Enthält ein konkretes Geburtsdatum des Klienten.');
  }

  // 4. German Krankenversichertennummer (KVNR: 1 Letter + 9 Digits, e.g., A123456789)
  const kvnrRegex = /\b[A-Z]\d{9}\b/;
  if (kvnrRegex.test(text)) {
    detectedTypes.push('Krankenversichertennummer (KVNR)');
    warnings.push('Enthält ein Versicherten-Identifikationsmerkmal.');
  }

  // 5. Explicit Client Name tags (e.g. "Klient: Max Mustermann", "Herr Schmidt", "Frau Müller", "Name: ...")
  const clientNameMarkerRegex = /\b(?:klient(?:in)?|herr|frau|jugendliche[rn]?|kind|name)\s*:\s*[A-ZÄÖÜ][a-zäöüß]+(?:\s+[A-ZÄÖÜ][a-zäöüß]+)/i;
  const honorificRegex = /\b(?:herr|frau)\s+[A-ZÄÖÜ][a-zäöüß]{2,}\b/i;
  if (clientNameMarkerRegex.test(text) || honorificRegex.test(text)) {
    detectedTypes.push('Personenname');
    warnings.push('Enthält einen Personen- oder Klientennamen (z. B. Herr/Frau oder Klient: ...).');
  }

  // 6. German Street Address with House Number (excluding known official authorities / services)
  const addressRegex = /\b[A-Za-zÄÖÜäöüß.\- ]*(?:straße|str\.|allee|damm|platz|weg|ufer|chaussee|gasse|ring|zeile|pfad)\s+\d{1,4}[a-z]?\b/i;
  const matchesAddress = addressRegex.test(text);

  if (matchesAddress) {
    // Whitelist check: If the address is clearly preceded by or part of an official service or authority
    const authorityPrefixRegex = /(?:jobcenter|jugendamt|sozialamt|bezirksamt|b[uü]rgeramt|wohnhilfe|klinik|krankenhaus|spdi|notdienst|dienststelle|standort|gesch[aä]ftsstelle|beratungsstelle|rathaus|haus\s+[a-z0-9]|amt\s+)/i;
    
    // Known official Berlin authority addresses
    const isKnownAuthority = 
      /m[uü]llerstr(?:aße|\.)\s*(?:16|146)|karl-marx-allee\s*31|mainzer\s*str(?:aße|\.)\s*26|turmstr(?:aße|\.)\s*21|gruener\s*weg|franklinstr(?:aße|\.)/i.test(text);

    if (!authorityPrefixRegex.test(text) && !isKnownAuthority) {
      detectedTypes.push('Wohnadresse');
      warnings.push('Enthält eine spezifische private Wohnadresse mit Hausnummer.');
    }
  }

  return {
    hasPII: detectedTypes.length > 0,
    detectedTypes,
    warnings,
  };
}
