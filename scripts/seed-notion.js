/**
 * scripts/seed-notion.js
 * 
 * Parses data/wohnungsamter.csv and seeds each entry into the Notion database
 * using pinned Notion-Version: 2022-06-28 (consistent with lib/notion.ts).
 */

const fs = require('fs');
const path = require('path');

// Load .env.local if present
function loadEnv() {
  const envPath = path.resolve(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, 'utf-8');
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        const val = trimmed.slice(idx + 1).trim();
        if (!process.env[key]) {
          process.env[key] = val;
        }
      }
    }
  }
}

// Basic CSV parser that supports RFC 4180 quotes
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
        // ignore CR
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

  const headers = lines[0].map(h => h.trim());
  const records = [];

  for (let r = 1; r < lines.length; r++) {
    const vals = lines[r];
    const record = {};
    for (let c = 0; c < headers.length; c++) {
      record[headers[c]] = vals[c] !== undefined ? vals[c].trim() : '';
    }
    records.push(record);
  }

  return records;
}

// Low-level Notion API helpers using Notion-Version: 2022-06-28
async function notionApiRequest(endpoint, apiKey, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
  };
  if (body) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(`https://api.notion.com/v1${endpoint}`, options);
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.message || `Notion API Error (${res.status})`);
  }
  return data;
}

async function main() {
  loadEnv();

  const apiKey = process.env.NOTION_API_KEY?.trim();
  const databaseId = process.env.NOTION_DATABASE_ID?.trim();

  if (!apiKey || !databaseId) {
    throw new Error('Missing NOTION_API_KEY or NOTION_DATABASE_ID in .env.local');
  }

  console.log(`Connecting to Notion database: ${databaseId}...`);
  const db = await notionApiRequest(`/databases/${databaseId}`, apiKey);
  const title = db.title?.map(t => t.plain_text).join('') || 'Polaris Datenbank';
  console.log(`Connected to database: "${title}"`);

  const dbProperties = db.properties || {};
  console.log('Database columns:', Object.keys(dbProperties).join(', '));

  // Helper to match properties flexibly
  function findDbProp(targetName, ...aliases) {
    const candidates = [targetName, ...aliases].map(s => s.toLowerCase());
    for (const key of Object.keys(dbProperties)) {
      if (candidates.includes(key.toLowerCase())) {
        return { name: key, schema: dbProperties[key] };
      }
    }
    return null;
  }

 const targetFile = process.argv[2] || 'data/wohnungsamter.csv';
  const csvPath = path.isAbsolute(targetFile) 
    ? targetFile 
    : path.resolve(__dirname, '..', targetFile);

  if (!fs.existsSync(csvPath)) {
    throw new Error(`CSV file not found at ${csvPath}`);
  }

  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const records = parseCsv(csvContent);
  console.log(`Parsed ${records.length} records from ${csvPath}\n`);

  let count = 0;

  for (const row of records) {
    const properties = {};

    // 1. Name (Title)
    const nameProp = findDbProp('Name', 'Titel', 'Title');
    if (nameProp) {
      properties[nameProp.name] = {
        title: [{ text: { content: row.Name || 'Wohnungsamt' } }],
      };
    }

    // 2. Typ / Type
    const typProp = findDbProp('Typ', 'Type', 'Trägertyp');
    if (typProp) {
      if (typProp.schema.type === 'select') {
        properties[typProp.name] = { select: { name: row.Typ || 'Behörde / Amt' } };
      } else if (typProp.schema.type === 'multi_select') {
        properties[typProp.name] = { multi_select: [{ name: row.Typ || 'Behörde / Amt' }] };
      }
    }

    // 3. Bezirk / District
    const bezirkProp = findDbProp('Bezirk', 'District');
    if (bezirkProp) {
      if (bezirkProp.schema.type === 'select') {
        properties[bezirkProp.name] = { select: { name: row.Bezirk } };
      } else if (bezirkProp.schema.type === 'multi_select') {
        properties[bezirkProp.name] = { multi_select: [{ name: row.Bezirk }] };
      }
    }

    // 4. Schwerpunkt / Schwerpunkte / Focus
    const schwerpunktProp = findDbProp('Schwerpunkt', 'Schwerpunkte', 'Focus');
    if (schwerpunktProp) {
      const items = (row.Schwerpunkt || 'Existenzsicherung & Ämter')
        .split(/[,;]+/)
        .map(s => s.trim())
        .filter(Boolean);
      if (schwerpunktProp.schema.type === 'multi_select') {
        properties[schwerpunktProp.name] = { multi_select: items.map(name => ({ name })) };
      } else if (schwerpunktProp.schema.type === 'select' && items.length > 0) {
        properties[schwerpunktProp.name] = { select: { name: items[0] } };
      }
    }

    // 5. Zielgruppe / Target Group
    const zielgruppeProp = findDbProp('Zielgruppe', 'Target Group', 'Alter');
    if (zielgruppeProp) {
      const items = (row.Zielgruppe || 'Erwachsene, Familien / Alleinerziehende')
        .split(/[,;]+/)
        .map(s => s.trim())
        .filter(Boolean);
      if (zielgruppeProp.schema.type === 'multi_select') {
        properties[zielgruppeProp.name] = { multi_select: items.map(name => ({ name })) };
      } else if (zielgruppeProp.schema.type === 'select' && items.length > 0) {
        properties[zielgruppeProp.name] = { select: { name: items[0] } };
      }
    }

    // 6. Zugang / Access
    const zugangProp = findDbProp('Zugang', 'Access');
    if (zugangProp) {
      const items = (row.Zugang || 'Terminvereinbarung nötig, Offen / Walk-in')
        .split(/[,;]+/)
        .map(s => s.trim())
        .filter(Boolean);
      if (zugangProp.schema.type === 'multi_select') {
        properties[zugangProp.name] = { multi_select: items.map(name => ({ name })) };
      } else if (zugangProp.schema.type === 'select' && items.length > 0) {
        properties[zugangProp.name] = { select: { name: items[0] } };
      }
    }

    // 7. Tags
    const tagsProp = findDbProp('Tags', 'Rechtsgrundlage', 'SGB');
    if (tagsProp) {
      const items = (row.Tags || 'WBS, Bürgergeld, SGB II, Kostenlos')
        .split(/[,;]+/)
        .map(s => s.trim())
        .filter(Boolean);
      if (tagsProp.schema.type === 'multi_select') {
        properties[tagsProp.name] = { multi_select: items.map(name => ({ name })) };
      } else if (tagsProp.schema.type === 'select' && items.length > 0) {
        properties[tagsProp.name] = { select: { name: items[0] } };
      }
    }

    // 8. Adresse / Address
    const adresseProp = findDbProp('Adresse', 'Address', 'Standort');
    if (adresseProp && row.Adresse) {
      properties[adresseProp.name] = {
        rich_text: [{ text: { content: row.Adresse } }],
      };
    }

    // 9. ÖPNV / Transit
    const oepnvProp = findDbProp('ÖPNV', 'OEPNV', 'Transit');
    if (oepnvProp && row.ÖPNV) {
      properties[oepnvProp.name] = {
        rich_text: [{ text: { content: row.ÖPNV } }],
      };
    }

    // 10. Kontakt / Contact
    const kontaktProp = findDbProp('Kontakt', 'Contact', 'Telefon');
    if (kontaktProp && row.Kontakt) {
      properties[kontaktProp.name] = {
        rich_text: [{ text: { content: row.Kontakt } }],
      };
    }

    // 11. Unterlagen / Documents
    const unterlagenProp = findDbProp('Unterlagen', 'Dokumente', 'Documents');
    if (unterlagenProp && row.Unterlagen) {
      properties[unterlagenProp.name] = {
        rich_text: [{ text: { content: row.Unterlagen } }],
      };
    }

    // 12. Latitude
    const latProp = findDbProp('Latitude', 'Lat', 'Breitengrad');
    if (latProp && row.Latitude) {
      const latVal = parseFloat(row.Latitude);
      if (!isNaN(latVal)) {
        properties[latProp.name] = { number: latVal };
      }
    }

    // 13. Longitude
    const lngProp = findDbProp('Longitude', 'Lng', 'Längengrad');
    if (lngProp && row.Longitude) {
      const lngVal = parseFloat(row.Longitude);
      if (!isNaN(lngVal)) {
        properties[lngProp.name] = { number: lngVal };
      }
    }

    const newPage = await notionApiRequest('/pages', apiKey, 'POST', {
      parent: { database_id: databaseId },
      properties,
    });

    count++;
    console.log(`✅ [${count}/${records.length}] Created: "${row.Name}" (${row.Bezirk}) -> Page ID: ${newPage.id}`);
  }

  console.log(`\n🎉 Successfully seeded all ${count} entries into Notion!`);
}

main().catch(err => {
  console.error('❌ Error seeding Notion:', err.message || err);
  process.exit(1);
});
