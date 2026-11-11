import fs from 'fs';
import path from 'path';
import { Facility } from '@/types/facility';
import { supabase, mapFacilityToSupabaseRow, fetchFacilitiesFromSupabase } from '@/lib/supabase';
import { IngestionAdapter, IngestionRunResult, IngestionStats } from './types';
import { BerlinAuthoritiesAdapter } from './adapters/berlinAuthoritiesAdapter';
import { BerlinOpenDataAdapter } from './adapters/berlinOpenDataAdapter';

// Terms strictly excluded from Polaris (standard preschools, libraries, music schools, theaters)
const BLACKLIST_TERMS = [
  'kindertagesstätte',
  'kita',
  'tagespflege',
  'tagesmutter',
  'tagesvater',
  'krabbelgruppe',
  'bibliothek',
  'bücherei',
  'musikschule',
  'spielplatz',
  'theater',
  'kulturclub',
  'museum',
  'volkshochschule',
  'vhs',
];

function normalizeString(str?: string | null): string {
  return (str || '')
    .toLowerCase()
    .replace(/[^a-z0-9äöüß]/g, '')
    .trim();
}

export class IngestionEngine {
  private adapters: IngestionAdapter[] = [];

  constructor() {
    this.adapters = [
      new BerlinAuthoritiesAdapter(),
      new BerlinOpenDataAdapter(),
    ];
  }

  /**
   * Runs the full automated ingestion pipeline with strict curation and Supabase deduplication
   */
  async run(options: { dryRun?: boolean; targetSourceId?: string } = {}): Promise<IngestionRunResult> {
    const startedAt = new Date().toISOString();
    const dryRun = options.dryRun ?? true;

    const sourceStats: IngestionStats[] = [];
    const allRawFetchedFacilities: Facility[] = [];
    const globalErrors: string[] = [];

    const activeAdapters = options.targetSourceId
      ? this.adapters.filter((a) => a.meta.id === options.targetSourceId)
      : this.adapters;

    // 1. Run each registered adapter
    for (const adapter of activeAdapters) {
      const sourceStart = Date.now();
      const stats: IngestionStats = {
        sourceId: adapter.meta.id,
        sourceName: adapter.meta.name,
        totalFetched: 0,
        validRecords: 0,
        invalidRecords: 0,
        durationMs: 0,
        errors: [],
      };

      try {
        console.log(`[Ingestion] Starting source: ${adapter.meta.name}...`);
        const records = await adapter.fetch();
        stats.totalFetched = records.length;

        // Basic structural validation
        const valid = records.filter((f) => {
          const isValid = f.id && f.name && f.district && Array.isArray(f.coordinates);
          if (!isValid) stats.invalidRecords++;
          return isValid;
        });

        stats.validRecords = valid.length;
        allRawFetchedFacilities.push(...valid);
        console.log(`[Ingestion] ✓ Fetched ${valid.length} valid records from ${adapter.meta.name}.`);
      } catch (err: any) {
        const msg = `Failed to ingest ${adapter.meta.name}: ${err?.message || err}`;
        console.error(`[Ingestion] ✕ ${msg}`);
        stats.errors.push(msg);
        globalErrors.push(msg);
      } finally {
        stats.durationMs = Date.now() - sourceStart;
        sourceStats.push(stats);
      }
    }

    // 2. Strict Curation Filter (Exclude Kitas, Culture clubs, and entries without direct contact)
    const curatedFacilities = allRawFetchedFacilities.filter((f) => {
      const text = `${f.name} ${f.subTitle} ${(f.features as any)?.rawArt || ''}`.toLowerCase();

      // Blacklist filter
      if (BLACKLIST_TERMS.some((term) => text.includes(term))) {
        return false;
      }

      // Quality Gate: Must have valid telephone or email
      const hasPhone = f.contact?.phone && f.contact.phone.length > 5 && !f.contact.phone.includes('Vermittlung über Träger');
      const hasEmail = f.contact?.email && f.contact.email.includes('@');
      if (!hasPhone && !hasEmail) {
        return false;
      }

      return true;
    });

    console.log(
      `[Ingestion] Curation Filter: ${allRawFetchedFacilities.length} raw -> ${curatedFacilities.length} social work facilities (${
        allRawFetchedFacilities.length - curatedFacilities.length
      } non-profile facilities removed).`
    );

    // 3. Intelligent Deduplication against existing Supabase database
    let existingFacilities: Facility[] = [];
    try {
      const res = await fetchFacilitiesFromSupabase();
      existingFacilities = res.facilities || [];
      console.log(`[Ingestion] Checking against ${existingFacilities.length} existing facilities in Supabase...`);
    } catch (e) {
      console.warn('[Ingestion] Could not load existing Supabase records for cross-check, proceeding with local deduplication.');
    }

    const knownNameSignatures = new Set<string>();
    const knownAddressSignatures = new Set<string>();

    existingFacilities.forEach((e) => {
      knownNameSignatures.add(normalizeString(e.name));
      if (e.address?.street && normalizeString(e.address.street).length > 4) {
        knownAddressSignatures.add(`${normalizeString(e.address.street)}|${normalizeString(e.district)}`);
      }
    });

    const uniqueNewFacilities: Facility[] = [];
    let skippedExistingCount = 0;

    for (const fac of curatedFacilities) {
      const nameSig = normalizeString(fac.name);
      const streetSig = `${normalizeString(fac.address?.street)}|${normalizeString(fac.district)}`;

      // Check if facility name already exists in Supabase
      if (knownNameSignatures.has(nameSig)) {
        skippedExistingCount++;
        continue;
      }

      // Check if this is an official authority sub-department at the same building already covered
      if (fac.institutionType === 'amt' && knownAddressSignatures.has(streetSig)) {
        skippedExistingCount++;
        continue;
      }

      // Record is truly new and unique!
      uniqueNewFacilities.push(fac);

      // Add to known sets so internal duplicates within the scraped batch are also prevented
      knownNameSignatures.add(nameSig);
      if (normalizeString(fac.address?.street).length > 4) {
        knownAddressSignatures.add(streetSig);
      }
    }

    console.log(
      `[Ingestion] Deduplication: ${skippedExistingCount} duplicates with Supabase safely skipped. Truly new unique facilities: ${uniqueNewFacilities.length}.`
    );

    let inserted = 0;
    let updated = 0;

    // 4. Save local snapshot backup for offline fallback
    try {
      const dataDir = path.join(process.cwd(), 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      const snapshotPath = path.join(dataDir, 'ingested-facilities.json');
      fs.writeFileSync(snapshotPath, JSON.stringify(uniqueNewFacilities, null, 2), 'utf8');
      console.log(`[Ingestion] ✓ Saved curated snapshot to data/ingested-facilities.json (${uniqueNewFacilities.length} clean items).`);
    } catch (saveErr: any) {
      console.warn('[Ingestion] Failed to save local snapshot:', saveErr.message);
    }

    // 5. Persistence into Supabase PostgreSQL (if not dryRun)
    if (!dryRun && uniqueNewFacilities.length > 0) {
      console.log(`[Ingestion] Synchronizing ${uniqueNewFacilities.length} verified facilities to Supabase PostgreSQL...`);
      try {
        const rows = uniqueNewFacilities.map(mapFacilityToSupabaseRow);

        // Batch upsert in chunks of 50
        const CHUNK_SIZE = 50;
        for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
          const chunk = rows.slice(i, i + CHUNK_SIZE);
          const { error } = await supabase
            .from('facilities')
            .upsert(chunk, { onConflict: 'id' });

          if (error) {
            console.error('[Ingestion] Supabase upsert error in chunk:', error.message);
            globalErrors.push(`Supabase upsert chunk error: ${error.message}`);
          } else {
            inserted += chunk.length;
          }
        }
        console.log(`[Ingestion] ✓ Successfully upserted ${inserted} new facilities to Supabase.`);
      } catch (dbErr: any) {
        console.error('[Ingestion] Fatal database error during upsert:', dbErr.message);
        globalErrors.push(`Fatal database error: ${dbErr.message}`);
      }
    } else if (dryRun) {
      console.log(`[Ingestion] DRY RUN MODE: Found ${uniqueNewFacilities.length} truly new facilities ready for synchronization.`);
    }

    return {
      startedAt,
      completedAt: new Date().toISOString(),
      dryRun,
      totalProcessed: uniqueNewFacilities.length,
      inserted: dryRun ? 0 : inserted,
      updated: dryRun ? 0 : updated,
      errors: globalErrors,
      sources: sourceStats,
    };
  }
}
