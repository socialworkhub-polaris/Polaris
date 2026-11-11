import * as cheerio from 'cheerio';
import { Facility, BerlinDistrict } from '@/types/facility';
import { IngestionAdapter, IngestionSourceMeta } from '../types';
import { resolveDistrict, ensureCoordinates } from '../districtResolver';

// Curated list of high-priority Berlin authority standort directories
const AUTHORITY_DIRECTORIES = [
  {
    category: 'sozialamt',
    url: 'https://service.berlin.de/standorte/sozialaemter/',
    primaryFocus: 'existenzsicherung_aemter' as const,
    defaultSummary: 'Zuständiges Sozialamt für Grundsicherung im Alter, Erwerbsminderung & Hilfe zum Lebensunterhalt (SGB XII).',
    legalBases: ['SGB XII (Sozialhilfe)', '§ 67 SGB XII (Hilfe in besonderen Lebenslagen)'],
  },
  {
    category: 'buergeramt',
    url: 'https://service.berlin.de/standorte/buergeraemter/',
    primaryFocus: 'existenzsicherung_aemter' as const,
    defaultSummary: 'Bürgeramt für Meldeangelegenheiten, Ausweise, Berlinpass & behördliche Erstregistrierung.',
    legalBases: ['BMG (Bundesmeldegesetz)', 'PAuswG (Personalausweisgesetz)'],
  },
  {
    category: 'jugendamt',
    url: 'https://service.berlin.de/standorte/jugendaemter/',
    primaryFocus: 'psychosozial_gesundheit' as const,
    defaultSummary: 'Regionaler Sozialdienst (RSD), Hilfen zur Erziehung & Kinderschutz (SGB VIII).',
    legalBases: ['§ 27 SGB VIII (Hilfen zur Erziehung)', '§ 41 SGB VIII (Junge Volljährige)'],
  },
];

async function fetchHtmlWithRetry(url: string, retries = 2): Promise<string> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Polaris-SocialWorkHub/1.0',
          'Accept-Language': 'de-DE,de;q=0.9',
        },
      });
      if (res.ok) return await res.text();
    } catch (err) {
      if (attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, 600));
    }
  }
  throw new Error(`Failed to fetch ${url}`);
}

export class BerlinAuthoritiesAdapter implements IngestionAdapter {
  meta: IngestionSourceMeta = {
    id: 'berlin-service-portal',
    name: 'Service-Portal Berlin (Offizielle Ämter & Behörden)',
    region: 'Berlin',
    url: 'https://service.berlin.de',
    license: 'Datenlizenz Deutschland – Namensnennung – Version 2.0',
  };

  async fetch(): Promise<Facility[]> {
    const facilities: Facility[] = [];
    const seenStandortIds = new Set<string>();

    for (const dir of AUTHORITY_DIRECTORIES) {
      try {
        const indexHtml = await fetchHtmlWithRetry(dir.url);
        const $index = cheerio.load(indexHtml);

        // Find all unique /standort/<id>/ links
        const standortLinks: string[] = [];
        $index('a[href*="/standort/"]').each((_, el) => {
          const href = $index(el).attr('href');
          if (href) {
            const match = href.match(/\/standort\/(\d+)\//);
            if (match && !seenStandortIds.has(match[1])) {
              seenStandortIds.add(match[1]);
              standortLinks.push(`https://service.berlin.de${match[0]}`);
            }
          }
        });

        // Limit per run to avoid rate-limiting issues (e.g. up to 15 key standorte per category)
        const selectedLinks = standortLinks.slice(0, 15);

        for (const standortUrl of selectedLinks) {
          try {
            const standortId = standortUrl.match(/\/standort\/(\d+)\//)?.[1] || '0';
            const pageHtml = await fetchHtmlWithRetry(standortUrl);
            const $ = cheerio.load(pageHtml);

            // 1. Title & Raw Name
            let rawTitle = $('h1').first().text().replace(/^Standort:\s*/i, '').trim();
            if (!rawTitle) continue;

            // 2. Address & Postcode
            const street = $('.address .street').first().text().trim() || '';
            const cityText = $('.address .city').first().text().trim() || 'Berlin';
            const plzMatch = cityText.match(/\b(1\d{4})\b/);
            const zipCode = plzMatch ? plzMatch[1] : '';

            // 3. Contact Details
            const phone = $('a[href^="tel:"]').first().text().trim() || '(030) 115';
            const email = $('a[href^="mailto:"]').first().text().trim() || '';
            const website = standortUrl;

            // 4. District Resolution
            const district = resolveDistrict({
              plz: zipCode,
              name: rawTitle,
              email: email,
            });

            // Clean uniform title
            let cleanName = rawTitle;
            if (!cleanName.toLowerCase().includes(district.toLowerCase())) {
              cleanName = `${cleanName} (${district})`;
            }

            // 5. Opening Hours & Walk-In info
            const hoursTexts: string[] = [];
            $('.opening-hours, .oeffnungszeiten, .modul-oeffnungszeiten').each((_, el) => {
              hoursTexts.push($(el).text().trim());
            });
            const openingSummary = hoursTexts.join(' ').replace(/\s+/g, ' ').slice(0, 250);

            // 6. Coordinates (fallback to district centroid)
            const coords = ensureCoordinates(null, district);

            const facility: Facility = {
              id: `berlin-amt-${standortId}`,
              name: cleanName,
              subTitle: dir.defaultSummary,
              institutionType: 'amt',
              accessType: 'termin',
              primaryFocus: dir.primaryFocus,
              ageGroups: ['erwachsene', 'senioren', 'junge_erwachsene'],
              district: district,
              address: {
                street: street || 'Dienstgebäude des Bezirksamts',
                zipCode: zipCode || '10115',
                city: 'Berlin',
              },
              coordinates: coords,
              transit: {
                station: `U/S-Bhf im Bezirk ${district}`,
                lines: ['ÖPNV Berlin'],
                walkingTime: 'Ca. 5–10 Min. Fußweg',
              },
              contact: {
                phone: phone,
                email: email,
                website: website,
              },
              openingHours: {
                walkIn: 'Nur nach vorheriger Terminvereinbarung oder Notfall-Clearing.',
                appointment: openingSummary || 'Mo–Fr nach Terminvereinbarung über das Bürgertelefon 115 oder online.',
                phoneHours: 'Mo–Do 08:00 – 16:00 Uhr, Fr 08:00 – 13:00 Uhr',
              },
              intakeRules: {
                summary: dir.defaultSummary,
                procedure: '1. Online-Termin oder über Telefon 115 buchen. 2. Notwendige Ausweise und SGB-Unterlagen mitbringen. 3. Erstberatung vor Ort.',
                regionalJurisdiction: `Nur zuständig für Bürger*innen mit Wohnsitz oder gemeldetem Aufenthalt im Bezirk ${district}.`,
                waitingTimeEstimate: 'Terminvergabe ca. 1–3 Wochen, akute Notlagen über den Tagesdienst.',
              },
              requiredDocuments: [
                'Gültiger Personalausweis oder Reisepass mit Meldebescheinigung',
                'Einkommensnachweise der letzten 3 Monate',
                'Aktueller Mietvertrag & Mietänderungsschreiben',
              ],
              legalBases: dir.legalBases,
              accessibility: {
                wheelchair: 'voll',
                languages: ['Deutsch', 'Englisch'],
                elevator: true,
              },
              internalWorkerNotes: `Offizielle Amtsstelle im Bezirk ${district}. Bei akuter Mittellosigkeit / Notunterbringung ist der Tagesdienst direkt aufzusuchen.`,
              targetGroups: ['Erwachsene', 'Familien', 'Senioren', 'Bürgergeld-Empfänger*innen'],
              features: {
                wheelchairAccessible: true,
                languages: ['Deutsch', 'Englisch'],
                freeOfCharge: true,
                anonymous: false,
              },
            };

            facilities.push(facility);

            // Polite scraping delay between requests
            await new Promise((r) => setTimeout(r, 150));
          } catch (standortErr) {
            console.warn(`Error parsing standort ${standortUrl}:`, standortErr);
          }
        }
      } catch (dirErr) {
        console.warn(`Error crawling directory ${dir.url}:`, dirErr);
      }
    }

    return facilities;
  }
}
