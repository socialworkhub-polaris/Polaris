/**
 * Polaris Open Data Ingestion Runner
 * Usage:
 *   npx tsx scripts/run-ingestion.ts           # Dry run (test & snapshot only)
 *   npx tsx scripts/run-ingestion.ts --sync    # Live sync into Supabase
 */

import fs from 'fs';
import path from 'path';

// Automatically load .env.local environment variables if running outside Next.js
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx > 0) {
          const key = trimmed.slice(0, eqIdx).trim();
          const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    });
  }
} catch (e) {
  // Silent fallback
}

import { IngestionEngine } from '../lib/ingestion/engine';

async function main() {
  const args = process.argv.slice(2);
  const isSync = args.includes('--sync') || args.includes('-s');
  const dryRun = !isSync;

  console.log('===========================================================');
  console.log('   🧭 Polaris Automated Open Data Ingestion Pipeline');
  console.log(`   Mode: ${dryRun ? 'DRY RUN (Preview & Snapshot)' : 'LIVE SYNC (Writing to Supabase)'}`);
  console.log('===========================================================\n');

  const engine = new IngestionEngine();
  const startTime = Date.now();

  try {
    const result = await engine.run({ dryRun });
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n-----------------------------------------------------------');
    console.log('   Execution Summary:');
    console.log(`   - Total Facilities Processed: ${result.totalProcessed}`);
    console.log(`   - Facilities Upserted:       ${result.inserted}`);
    console.log(`   - Total Time:                 ${duration}s`);
    console.log(`   - Errors:                     ${result.errors.length}`);
    console.log('-----------------------------------------------------------');

    result.sources.forEach((src) => {
      console.log(`   • [${src.sourceId}] ${src.sourceName}: ${src.validRecords} valid records (${src.durationMs}ms)`);
      if (src.errors.length > 0) {
        src.errors.forEach((err) => console.log(`     - Error: ${err}`));
      }
    });

    console.log('===========================================================\n');

    if (dryRun) {
      console.log('💡 To write these records to your live database, run:');
      console.log('   npm run ingest:sync\n');
    }
  } catch (err: any) {
    console.error('Fatal ingestion error:', err);
    process.exit(1);
  }
}

main();
