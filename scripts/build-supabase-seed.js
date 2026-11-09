/**
 * scripts/build-supabase-seed.js
 * Generates supabase/setup.sql containing complete schema DDL + cleaned seed dataset.
 */

const fs = require('fs');
const path = require('path');

function cleanUmlaute(str) {
  if (!str) return '';
  return str
    .replace(/straYe/gi, 'straße')
    .replace(/stra\?Ye/gi, 'straße')
    .replace(/stra\uFFFDYe/gi, 'straße')
    .replace(/Behrde/gi, 'Behörde')
    .replace(/Beh\uFFFD\uFFFD?rde/gi, 'Behörde')
    .replace(/Trger/gi, 'Träger')
    .replace(/Tr\uFFFDger/gi, 'Träger')
    .replace(/NotǬbernachtung/gi, 'Notübernachtung')
    .replace(/Not\uFFFDbernachtung/gi, 'Notübernachtung')
    .replace(/Neuklln/gi, 'Neukölln')
    .replace(/Neuk\uFFFDlln/gi, 'Neukölln')
    .replace(/Schneberg/gi, 'Schöneberg')
    .replace(/Sch\uFFFDneberg/gi, 'Schöneberg')
    .replace(/Kltehilfe/gi, 'Kältehilfe')
    .replace(/K\uFFFDltehilfe/gi, 'Kältehilfe')
    .replace(/Mnner/gi, 'Männer')
    .replace(/M\uFFFDnner/gi, 'Männer')
    .replace(/ntig/gi, 'nötig')
    .replace(/n\uFFFDtig/gi, 'nötig')
    .replace(/Tglich/gi, 'Täglich')
    .replace(/T\uFFFDglich/gi, 'Täglich')
    .replace(/mglich/gi, 'möglich')
    .replace(/m\uFFFDglich/gi, 'möglich')
    .replace(/GroYe/gi, 'Große')
    .replace(/MǬhlen/gi, 'Mühlen')
    .replace(/M\uFFFDhlen/gi, 'Mühlen')
    .replace(/BǬrgergeld/gi, 'Bürgergeld')
    .replace(/fǬr/gi, 'für')
    .replace(/FǬr/gi, 'Für')
    .replace(/Zustndig/gi, 'Zuständig')
    .replace(/Erstabklrung/gi, 'Erstabklärung')
    .replace(/Klrung/gi, 'Klärung')
    .replace(/gewhnlich/gi, 'gewöhnlich')
    .replace(/\?\"/g, '–')
    .replace(/\uFFFD\?\"/g, '–')
    .replace(/\uFFFD/g, '')
    .trim();
}

// RFC-compliant CSV parser
function parseCsv(text) {
  const lines = [];
  let row = [];
  let inQuotes = false;
  let currentToken = '';

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentToken += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentToken += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        row.push(currentToken);
        currentToken = '';
      } else if (char === '\r') {
        // skip
      } else if (char === '\n') {
        row.push(currentToken);
        if (row.length > 1 || (row.length === 1 && row[0].trim() !== '')) {
          lines.push(row);
        }
        row = [];
        currentToken = '';
      } else {
        currentToken += char;
      }
    }
  }

  if (currentToken || row.length > 0) {
    row.push(currentToken);
    if (row.length > 1 || (row.length === 1 && row[0].trim() !== '')) {
      lines.push(row);
    }
  }

  if (lines.length < 2) return [];

  const headers = lines[0].map(h => cleanUmlaute(h));
  const records = [];

  for (let r = 1; r < lines.length; r++) {
    const vals = lines[r];
    const record = {};
    for (let c = 0; c < headers.length; c++) {
      record[headers[c]] = vals[c] !== undefined ? cleanUmlaute(vals[c]) : '';
    }
    records.push(record);
  }

  return records;
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

function mapCsvToFacility(rec, categoryName) {
  const name = rec['Name'] || '';
  const typRaw = (rec['Typ'] || '').toLowerCase();
  const isAmt = typRaw.includes('amt') || typRaw.includes('behörde');
  const institutionType = isAmt ? 'amt' : 'traeger';

  const zugangRaw = (rec['Zugang'] || '').toLowerCase();
  let accessType = 'niedrigschwellig';
  if (zugangRaw.includes('termin') && !zugangRaw.includes('walk-in') && !zugangRaw.includes('ohne termin')) {
    accessType = 'termin';
  } else if (zugangRaw.includes('antrag')) {
    accessType = 'antragspflichtig';
  }

  const focusRaw = (rec['Schwerpunkt'] || '').toLowerCase();
  let primaryFocus = 'psychosozial_gesundheit';
  if (focusRaw.includes('wohnen') || focusRaw.includes('obdachlos')) {
    primaryFocus = 'betreutes_wohnen';
  } else if (focusRaw.includes('existenz') || isAmt) {
    primaryFocus = 'existenzsicherung_aemter';
  } else if (focusRaw.includes('freizeit') || focusRaw.includes('jugend')) {
    primaryFocus = 'freizeit_offen';
  }

  const tags = (rec['Tags'] || '').split(',').map(t => cleanUmlaute(t)).filter(Boolean);
  const targetGroups = (rec['Zielgruppe'] || '').split(',').map(t => cleanUmlaute(t)).filter(Boolean);

  const lat = parseFloat(rec['Latitude']) || 52.5200;
  const lng = parseFloat(rec['Longitude']) || 13.4050;

  const addressRaw = rec['Adresse'] || '';
  const zipMatch = addressRaw.match(/(\d{5})/);
  const zipCode = zipMatch ? zipMatch[1] : '10115';

  const id = `${slugify(categoryName)}-${slugify(name).slice(0, 40)}`;

  return {
    id,
    name,
    sub_title: rec['Schwerpunkt'] || '',
    institution_type: institutionType,
    access_type: accessType,
    primary_focus: primaryFocus,
    age_groups: ['erwachsene', 'junge_erwachsene'],
    district: rec['Bezirk'] || 'Berlin',
    address: {
      street: addressRaw.replace(/\d{5}\s*Berlin.*/, '').trim() || addressRaw,
      zipCode: zipCode,
      city: 'Berlin',
    },
    coordinates: [lat, lng],
    transit: {
      station: rec['ÖPNV'] || rec['-PNV'] || '',
      lines: [],
      walkingTime: '',
    },
    contact: {
      phone: rec['Kontakt'] || '',
      email: '',
      website: '',
    },
    opening_hours: {
      walkIn: rec['Zugang'] || '',
      appointment: '',
      phoneHours: '',
    },
    intake_rules: {
      summary: rec['Schwerpunkt'] || '',
      procedure: rec['Zugang'] || '',
      regionalJurisdiction: rec['Bezirk'] || 'Berlin',
      requiredDocuments: (rec['Unterlagen'] || '').split(',').map(s => s.trim()).filter(Boolean),
    },
    target_groups: targetGroups.concat(tags),
    features: {
      wheelchairAccessible: true,
      languages: ['Deutsch'],
      freeOfCharge: tags.some(t => t.toLowerCase().includes('kostenlos')),
      anonymous: tags.some(t => t.toLowerCase().includes('anonym')),
      dogsAllowed: false,
    },
  };
}

function main() {
  const dataDir = path.resolve(__dirname, '..', 'data');
  const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.csv'));

  const allFacilities = [];
  const seenIds = new Set();

  for (const file of files) {
    const filePath = path.join(dataDir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const records = parseCsv(content);
    const categoryName = path.basename(file, '.csv');

    for (const rec of records) {
      if (!rec['Name']) continue;
      const fac = mapCsvToFacility(rec, categoryName);
      if (!seenIds.has(fac.id)) {
        seenIds.add(fac.id);
        allFacilities.push(fac);
      }
    }
  }

  console.log(`Parsed ${allFacilities.length} facilities from CSVs.`);

  // Write setup.sql
  const schemaPath = path.resolve(__dirname, '..', 'supabase', 'schema.sql');
  const schemaSql = fs.readFileSync(schemaPath, 'utf-8');

  let valuesSql = allFacilities.map(f => {
    const esc = str => `'${(str || '').replace(/'/g, "''")}'`;
    const escJson = obj => `'${JSON.stringify(obj || {}).replace(/'/g, "''")}'::jsonb`;
    const escArray = arr => `ARRAY[${(arr || []).map(a => esc(a)).join(', ')}]::text[]`;
    const coords = `ARRAY[${f.coordinates[0]}, ${f.coordinates[1]}]::double precision[]`;

    return `(
      ${esc(f.id)},
      ${esc(f.name)},
      ${esc(f.sub_title)},
      ${esc(f.institution_type)},
      ${esc(f.access_type)},
      ${esc(f.primary_focus)},
      ${escArray(f.age_groups)},
      ${esc(f.district)},
      ${escJson(f.address)},
      ${coords},
      ${escJson(f.transit)},
      ${escJson(f.contact)},
      ${escJson(f.opening_hours)},
      ${escJson(f.intake_rules)},
      ${escArray(f.target_groups)},
      ${escJson(f.features)}
    )`;
  }).join(',\n');

  const insertSql = `
-- Insert all initial Berlin social work facilities
INSERT INTO public.facilities (
    id, name, sub_title, institution_type, access_type, primary_focus,
    age_groups, district, address, coordinates, transit, contact,
    opening_hours, intake_rules, target_groups, features
) VALUES
${valuesSql}
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    sub_title = EXCLUDED.sub_title,
    institution_type = EXCLUDED.institution_type,
    access_type = EXCLUDED.access_type,
    primary_focus = EXCLUDED.primary_focus,
    age_groups = EXCLUDED.age_groups,
    district = EXCLUDED.district,
    address = EXCLUDED.address,
    coordinates = EXCLUDED.coordinates,
    transit = EXCLUDED.transit,
    contact = EXCLUDED.contact,
    opening_hours = EXCLUDED.opening_hours,
    intake_rules = EXCLUDED.intake_rules,
    target_groups = EXCLUDED.target_groups,
    features = EXCLUDED.features,
    updated_at = NOW();
`;

  const setupSql = `${schemaSql}\n\n${insertSql}`;
  const outPath = path.resolve(__dirname, '..', 'supabase', 'setup.sql');
  fs.writeFileSync(outPath, setupSql, 'utf-8');
  console.log(`Generated complete setup script at ${outPath} (${(fs.statSync(outPath).size / 1024).toFixed(1)} KB)`);
}

main();
