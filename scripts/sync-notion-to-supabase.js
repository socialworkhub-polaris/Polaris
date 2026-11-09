/**
 * scripts/sync-notion-to-supabase.js
 * Pulls all 122 pages from Notion API and upserts them directly into Supabase PostgreSQL.
 */

const { createClient } = require('@supabase/supabase-js');

const NOTION_API_KEY = process.env.NOTION_API_KEY || '';
const NOTION_DATABASE_ID = process.env.NOTION_DATABASE_ID || '';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function getTitle(prop) {
  if (!prop?.title) return '';
  return prop.title.map(t => t.plain_text || '').join('').trim();
}

function getSelect(prop) {
  return prop?.select?.name?.trim() || '';
}

function getMultiSelect(prop) {
  if (prop?.multi_select) return prop.multi_select.map(m => m.name || '').filter(Boolean);
  if (prop?.select?.name) return [prop.select.name];
  return [];
}

function getRichText(prop) {
  if (prop?.rich_text) return prop.rich_text.map(t => t.plain_text || '').join('').trim();
  if (prop?.title) return getTitle(prop);
  return '';
}

function getNumber(prop) {
  if (prop?.type === 'number' && typeof prop.number === 'number') return prop.number;
  return null;
}

function findProp(properties, ...names) {
  const keys = Object.keys(properties || {});
  for (const name of names) {
    const key = keys.find(k => k.trim().toLowerCase() === name.toLowerCase());
    if (key) return properties[key];
  }
  return undefined;
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function fetchAllNotionPages() {
  const pages = [];
  let hasMore = true;
  let cursor = undefined;

  console.log('Querying Notion database...');
  while (hasMore) {
    const body = { page_size: 100 };
    if (cursor) body.start_cursor = cursor;

    const res = await fetch(`https://api.notion.com/v1/databases/${NOTION_DATABASE_ID}/query`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${NOTION_API_KEY}`,
        'Notion-Version': '2022-06-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`Notion API error: ${res.statusText}`);
    }

    const data = await res.json();
    pages.push(...data.results);
    hasMore = data.has_more;
    cursor = data.next_cursor;
  }

  console.log(`Fetched ${pages.length} pages from Notion.`);
  return pages;
}

function mapNotionPageToSupabase(page, idx) {
  const p = page.properties;

  const name = getTitle(findProp(p, 'Name', 'Titel', 'Title')) || `Einrichtung #${idx + 1}`;
  const rawTyp = getSelect(findProp(p, 'Type', 'Typ', 'Trägertyp')).toLowerCase();
  const institutionType = (rawTyp.includes('amt') || rawTyp.includes('behörde')) ? 'amt' : 'traeger';

  const rawBezirk = getSelect(findProp(p, 'Bezirk', 'District')) || 'Berlin';
  const schwerpunkte = getMultiSelect(findProp(p, 'Schwerpunkte', 'Schwerpunkt', 'Focus'));
  const tags = getMultiSelect(findProp(p, 'Tags', 'Rechtsgrundlage', 'SGB'));
  const zielgruppe = getMultiSelect(findProp(p, 'Zielgruppe', 'Target Group', 'Alter'));
  const zugang = getMultiSelect(findProp(p, 'Zugang', 'Access'));

  const rawText = schwerpunkte.concat(tags).join(' ').toLowerCase();
  let primaryFocus = 'psychosozial_gesundheit';
  if (rawText.includes('wohnen') || rawText.includes('obdachlos') || rawText.includes('kältehilfe')) {
    primaryFocus = 'betreutes_wohnen';
  } else if (rawText.includes('existenz') || rawText.includes('jobcenter') || rawText.includes('amt')) {
    primaryFocus = 'existenzsicherung_aemter';
  } else if (rawText.includes('freizeit') || rawText.includes('jugend')) {
    primaryFocus = 'freizeit_offen';
  }

  let accessType = 'niedrigschwellig';
  const zugangText = zugang.join(' ').toLowerCase();
  if (zugangText.includes('termin') && !zugangText.includes('ohne termin')) {
    accessType = 'termin';
  } else if (zugangText.includes('antrag')) {
    accessType = 'antragspflichtig';
  }

  const rawAdresse = getRichText(findProp(p, 'Adresse', 'Address', 'Standort'));
  const zipMatch = rawAdresse.match(/\b(1\d{4})\b/);
  const zipCode = zipMatch ? zipMatch[1] : '10115';

  const rawOepnv = getRichText(findProp(p, 'ÖPNV', 'OEPNV', 'Transit'));
  const rawKontakt = getRichText(findProp(p, 'Kontakt', 'Contact', 'Telefon'));
  const phoneMatch = rawKontakt.match(/(030[\s\d\/-]{4,}|01[567]\d[\s\d\/-]{5,}|\+49[\s\d\/-]{6,})/);
  const emailMatch = rawKontakt.match(/([a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,})/);
  const urlMatch = rawKontakt.match(/(https?:\/\/[^\s,]+)/);

  const rawUnterlagen = getRichText(findProp(p, 'Unterlagen', 'Dokumente', 'Documents'));
  const reqDocs = rawUnterlagen ? rawUnterlagen.split(/[\n;•]+/).map(s => s.trim()).filter(Boolean) : [];

  const lat = getNumber(findProp(p, 'Latitude', 'Lat', 'Breitengrad')) || 52.5200;
  const lng = getNumber(findProp(p, 'Longitude', 'Lng', 'Längengrad')) || 13.4050;

  const id = `notion-${slugify(name).slice(0, 45)}-${idx + 1}`;

  return {
    id,
    name,
    sub_title: schwerpunkte.join(', ') || 'Soziale Beratungs- und Anlaufstelle',
    institution_type: institutionType,
    access_type: accessType,
    primary_focus: primaryFocus,
    age_groups: ['erwachsene', 'junge_erwachsene'],
    district: rawBezirk,
    address: {
      street: rawAdresse.replace(/\d{5}\s*Berlin.*/, '').trim() || rawAdresse || 'Berlin',
      zipCode,
      city: 'Berlin',
    },
    coordinates: [lat, lng],
    transit: {
      station: rawOepnv || 'ÖPNV in der Nähe',
      lines: [],
      walkingTime: '',
    },
    contact: {
      phone: phoneMatch ? phoneMatch[1] : (rawKontakt || ''),
      email: emailMatch ? emailMatch[1] : '',
      website: urlMatch ? urlMatch[1] : '',
    },
    opening_hours: {
      walkIn: zugang.join(', ') || 'Offene Sprechzeiten',
      appointment: '',
      phoneHours: '',
    },
    intake_rules: {
      summary: schwerpunkte.join(', '),
      procedure: zugang.join(', '),
      regionalJurisdiction: rawBezirk,
      requiredDocuments: reqDocs,
    },
    target_groups: zielgruppe.concat(tags),
    features: {
      wheelchairAccessible: true,
      languages: ['Deutsch'],
      freeOfCharge: true,
      anonymous: false,
      dogsAllowed: false,
    },
    updated_at: new Date().toISOString(),
  };
}

async function main() {
  try {
    const pages = await fetchAllNotionPages();
    const rows = pages.map((page, idx) => mapNotionPageToSupabase(page, idx));

    console.log(`Upserting ${rows.length} facilities into Supabase...`);

    // Upsert in batches of 30 to avoid payload limits
    const batchSize = 30;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize);
      const { error } = await supabase.from('facilities').upsert(batch, { onConflict: 'id' });
      if (error) {
        console.error(`Error upserting batch ${i / batchSize + 1}:`, error.message);
      } else {
        console.log(`Batch ${i / batchSize + 1} synced (${batch.length} rows)`);
      }
    }

    const { count } = await supabase.from('facilities').select('*', { count: 'exact', head: true });
    console.log(`\n🎉 SYNC COMPLETE! Total facilities in Supabase now: ${count}`);
  } catch (err) {
    console.error('Sync failed:', err);
  }
}

main();
