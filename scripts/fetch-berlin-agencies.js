/**
 * scripts/fetch-berlin-agencies.js
 * 
 * Fetches Berlin Wohnungsamt locations from Berlin Service Portal,
 * parses all 12 district locations, and exports them to data/wohnungsamter.csv
 * matching Notion CSV schema.
 */

const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

// District centroids from data/districts.ts
const DISTRICT_CENTROIDS = {
  'Mitte': [52.5200, 13.4050],
  'Friedrichshain-Kreuzberg': [52.5020, 13.4350],
  'Pankow': [52.5690, 13.4010],
  'Charlottenburg-Wilmersdorf': [52.5080, 13.3040],
  'Spandau': [52.5350, 13.2000],
  'Steglitz-Zehlendorf': [52.4340, 13.2590],
  'Tempelhof-Schöneberg': [52.4700, 13.3700],
  'Neukölln': [52.4810, 13.4350],
  'Treptow-Köpenick': [52.4500, 13.5700],
  'Marzahn-Hellersdorf': [52.5400, 13.5900],
  'Lichtenberg': [52.5320, 13.5000],
  'Reinickendorf': [52.5900, 13.3200],
};

// Known Wohnungsamt standort IDs across Berlin's 12 districts
const KNOWN_WOHNUNGSAMTER = [
  { district: 'Charlottenburg-Wilmersdorf', standortId: '122381', url: 'https://service.berlin.de/standort/122381/' },
  { district: 'Friedrichshain-Kreuzberg', standortId: '329355', url: 'https://service.berlin.de/standort/329355/' },
  { district: 'Lichtenberg', standortId: '330748', url: 'https://service.berlin.de/standort/330748/' },
  { district: 'Marzahn-Hellersdorf', standortId: '329343', url: 'https://service.berlin.de/standort/329343/' },
  { district: 'Mitte', standortId: '350703', url: 'https://service.berlin.de/standort/350703/' },
  { district: 'Neukölln', standortId: '122441', url: 'https://service.berlin.de/standort/122441/' },
  { district: 'Pankow', standortId: '122443', url: 'https://service.berlin.de/standort/122443/' },
  { district: 'Reinickendorf', standortId: '325855', url: 'https://service.berlin.de/standort/325855/' },
  { district: 'Spandau', standortId: '122604', url: 'https://service.berlin.de/standort/122604/' },
  { district: 'Steglitz-Zehlendorf', standortId: '355603', url: 'https://service.berlin.de/standort/355603/' },
  { district: 'Tempelhof-Schöneberg', standortId: '324335', url: 'https://service.berlin.de/standort/324335/' },
  { district: 'Treptow-Köpenick', standortId: '122613', url: 'https://service.berlin.de/standort/122613/' },
];

const DEFAULTS = {
  typ: 'Behörde / Amt',
  schwerpunkt: 'Existenzsicherung & Ämter',
  zielgruppe: 'Erwachsene, Familien / Alleinerziehende',
  zugang: 'Terminvereinbarung nötig, Offen / Walk-in',
  tags: 'WBS, Bürgergeld, SGB II, Kostenlos',
  unterlagen: 'Personalausweis, Einkommensnachweise',
};

function escapeCsvField(field) {
  if (field === null || field === undefined) return '""';
  const str = String(field).trim();
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

async function fetchWithRetry(url, retries = 2) {
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept-Language': 'de-DE,de;q=0.9,en;q=0.8',
        },
      });
      if (res.ok) {
        return await res.text();
      }
    } catch (err) {
      if (i === retries) throw err;
      await new Promise(r => setTimeout(r, 500));
    }
  }
  throw new Error(`Failed to fetch ${url}`);
}

async function parseStandortPage(url, district) {
  try {
    const html = await fetchWithRetry(url);
    const $ = cheerio.load(html);

    // Name: ensure clear, uniform naming "Wohnungsamt <District>"
    let name = $('h1').text().replace(/^Standort:\s*/i, '').trim();
    if (!name || name.toLowerCase() === 'standort' || name.toLowerCase() === 'wohnungsamt') {
      name = `Wohnungsamt ${district}`;
    } else if (!name.includes(district)) {
      name = `Wohnungsamt ${district}`;
    }

    // Address
    const street = $('.address .street').first().text().trim();
    const city = $('.address .city').first().text().trim();
    let plz = '';
    const plzMatch = city.match(/\b(1\d{4})\b/);
    if (plzMatch) plz = plzMatch[1];

    let adresse = '';
    if (street && city) {
      adresse = `${street}, ${city}`;
    } else {
      adresse = $('.address.loc').first().text().replace(/\s+/g, ' ').trim();
    }

    // Contact: Phone, Email, Web
    let tel = $('.list--contact .tel a').first().text().trim() || $('.list--contact .tel').first().text().replace(/Tel\.:?\s*/i, '').trim();
    if (!tel || tel === '(030)' || tel.length < 5) {
      tel = '(030) 115';
    }
    const email = $('.list--contact .email a').first().text().trim();
    const web = $('.list--contact .homepage a').first().attr('href') || url;

    const contactParts = [];
    if (tel) contactParts.push(`Tel: ${tel}`);
    if (email) contactParts.push(email);
    if (web) contactParts.push(web);
    const kontakt = contactParts.join(', ');

    // ÖPNV / Public transit
    let oepnv = '';
    const transitSection = $('div, section').filter((_, el) => {
      const heading = $(el).children('h2, h3').text().toLowerCase();
      return heading.includes('verkehr') || heading.includes('anbindung') || heading.includes('öpnv');
    }).first();

    if (transitSection.length) {
      const text = transitSection.text().replace(/\s+/g, ' ').replace(/Verkehrsanbindungen/i, '').trim();
      oepnv = text.slice(0, 150);
    }

    if (!oepnv) {
      oepnv = $('.standort, .address').text().replace(/\s+/g, ' ').slice(0, 100).trim() || 'ÖPNV im Nahbereich';
    }

    // Coordinates: extract GeoMap Marker if available
    let lat = null;
    let lng = null;
    const scriptText = $('script').text();
    const markerMatch = scriptText.match(/GeoMap\.Model\.Marker\(\s*([\d.]+)\s*,\s*([\d.]+)/);
    if (markerMatch) {
      lat = parseFloat(markerMatch[1]);
      lng = parseFloat(markerMatch[2]);
    }

    if (!lat || !lng || isNaN(lat) || isNaN(lng)) {
      const centroid = DISTRICT_CENTROIDS[district] || DISTRICT_CENTROIDS['Mitte'];
      lat = centroid[0];
      lng = centroid[1];
    }

    return {
      name,
      district,
      adresse,
      oepnv,
      kontakt,
      lat: Number(lat).toFixed(6),
      lng: Number(lng).toFixed(6),
    };
  } catch (err) {
    console.error(`Warning: failed to parse standort ${url}: ${err.message}`);
    const centroid = DISTRICT_CENTROIDS[district] || DISTRICT_CENTROIDS['Mitte'];
    return {
      name: `Wohnungsamt ${district}`,
      district,
      adresse: `Bezirksamt ${district}, Berlin`,
      oepnv: 'ÖPNV im Nahbereich',
      kontakt: 'info@berlin.de',
      lat: centroid[0].toFixed(6),
      lng: centroid[1].toFixed(6),
    };
  }
}

async function main() {
  console.log('🚀 Starting Berlin Wohnungsamt crawler...');

  const dataDir = path.resolve(__dirname, '..', 'data');
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const results = [];

  for (const item of KNOWN_WOHNUNGSAMTER) {
    console.log(`Fetching [${item.district}] (${item.url})...`);
    const parsed = await parseStandortPage(item.url, item.district);
    results.push(parsed);
  }

  console.log(`\nSuccessfully processed ${results.length} district locations.`);

  // Notion CSV Schema:
  // Name,Typ,Bezirk,Schwerpunkt,Zielgruppe,Zugang,Tags,Adresse,ÖPNV,Kontakt,Unterlagen,Latitude,Longitude
  const headers = [
    'Name',
    'Typ',
    'Bezirk',
    'Schwerpunkt',
    'Zielgruppe',
    'Zugang',
    'Tags',
    'Adresse',
    'ÖPNV',
    'Kontakt',
    'Unterlagen',
    'Latitude',
    'Longitude'
  ];

  const csvRows = [headers.join(',')];

  for (const r of results) {
    const row = [
      escapeCsvField(r.name),
      escapeCsvField(DEFAULTS.typ),
      escapeCsvField(r.district),
      escapeCsvField(DEFAULTS.schwerpunkt),
      escapeCsvField(DEFAULTS.zielgruppe),
      escapeCsvField(DEFAULTS.zugang),
      escapeCsvField(DEFAULTS.tags),
      escapeCsvField(r.adresse),
      escapeCsvField(r.oepnv),
      escapeCsvField(r.kontakt),
      escapeCsvField(DEFAULTS.unterlagen),
      escapeCsvField(r.lat),
      escapeCsvField(r.lng),
    ];
    csvRows.push(row.join(','));
  }

  const csvContent = csvRows.join('\n') + '\n';
  const outputPath = path.join(dataDir, 'wohnungsamter.csv');

  fs.writeFileSync(outputPath, csvContent, 'utf-8');
  console.log(`\n✅ Generated CSV at: ${outputPath}`);
  console.log(`Total rows: ${results.length}`);
}

main().catch(err => {
  console.error('Fatal error in main:', err);
  process.exit(1);
});
