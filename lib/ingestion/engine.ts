import fs from 'fs';
import path from 'path';
import { Facility } from '@/types/facility';
import { supabase, mapFacilityToSupabaseRow } from '@/lib/supabase';
import { IngestionAdapter, IngestionRunResult, IngestionStats } from './types';
import { BerlinAuthoritiesAdapter } from './adapters/berlinAuthoritiesAdapter';
import { BerlinOpenDataAdapter } from './adapters/berlinOpenDataAdapter';

export class IngestionEngine {
  private adapters: IngestionAdapter[] = [];

  constructor() {
    // Register available source adapters
    this.adapters = [
      new BerlinAuthoritiesAdapter(),
      new BerlinOpenDataAdapter(),
    ];
  }

  /**
   * Runs the full automated ingestion pipeline
   */
  async run(options: { dryRun?: boolean; targetSourceId?: string } = {}): Promise<IngestionRunResult> {
    const startedAt = new Date().toISOString();
    const dryRun = options.dryRun ?? true;

    const sourceStats: IngestionStats[] = [];
    const allFetchedFacilities: Facility[] = [];
    const globalErrors: string[] = [];

    const activeAdapters = options.targetSourceId
      ? this.adapters.filter((a) => a.meta.id === options.targetSourceId)
      : this.adapters;

    // 1. Run each adapter
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

        // Validation filter
        const valid = records.filter((f) => {
          const isValid = f.id && f.name && f.district && Array.isArray(f.coordinates);
          if (!isValid) stats.invalidRecords++;
          return isValid;
        });

        stats.validRecords = valid.length;
        allFetchedFacilities.push(...valid);
        console.log(`[Ingestion] ✓ Fetched ${valid.length} valid facilities from ${adapter.meta.name}.`);
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

    // 2. Deduplication by normalized name + district
    const deduplicatedMap = new Map<string, Facility>();
    for (const fac of allFetchedFacilities) {
      const key = `${fac.name.trim().toLowerCase()}|${fac.district.trim().toLowerCase()}`;
      if (!deduplicatedMap.has(key)) {
        deduplicatedMap.set(key, fac);
      }
    }

    const uniqueFacilities = Array.from(deduplicatedMap.values());
    console.log(`[Ingestion] Deduplication: ${allFetchedFacilities.length} -> ${uniqueFacilities.length} unique facilities.`);

    let inserted = 0;
    let updated = 0;

    // 3. Save local snapshot backup for offline fallback
    try {
      const dataDir = path.join(process.cwd(), 'data');
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      const snapshotPath = path.join(dataDir, 'ingested-facilities.json');
      fs.writeFileSync(snapshotPath, JSON.stringify(uniqueFacilities, null, 2), 'utf8');
      console.log(`[Ingestion] ✓ Saved local snapshot to data/ingested-facilities.json (${uniqueFacilities.length} items).`);
    } catch (saveErr: any) {
      console.warn('[Ingestion] Failed to save local snapshot:', saveErr.message);
    }

    // 4. Persistence into Supabase PostgreSQL (if not dryRun)
    if (!dryRun && uniqueFacilities.length > 0) {
      console.log(`[Ingestion] Writing ${uniqueFacilities.length} facilities to Supabase PostgreSQL...`);
      try {
        const rows = uniqueFacilities.map(mapFacilityToSupabaseRow);

        // Batch in chunks of 50
        const CHUNK_SIZE = 50;
        for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
          const chunk = rows.slice(i, i + CHUNK_SIZE);
          const { data, error } = await supabase
            .from('facilities')
            .upsert(chunk, { onConflict: 'id' });

          if (error) {
            console.error('[Ingestion] Supabase upsert error in chunk:', error.message);
            globalErrors.push(`Supabase upsert chunk error: ${error.message}`);
          } else {
            inserted += chunk.length;
          }
        }
        console.log(`[Ingestion] ✓ Successfully upserted ${inserted} facilities to Supabase.`);
      } catch (dbErr: any) {
        console.error('[Ingestion] Fatal database error during upsert:', dbErr.message);
        globalErrors.push(`Fatal database error: ${dbErr.message}`);
      }
    } else if (dryRun) {
      console.log(`[Ingestion] DRY RUN MODE: Skipped Supabase write. Found ${uniqueFacilities.length} facilities ready for sync.`);
    }

    return {
      startedAt,
      completedAt: new Date().toISOString(),
      dryRun,
      totalProcessed: uniqueFacilities.length,
      inserted: dryRun ? 0 : inserted,
      updated: dryRun ? 0 : updated,
      errors: globalErrors,
      sources: sourceStats,
    };
  }
}
