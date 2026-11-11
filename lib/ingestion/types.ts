import { Facility } from '@/types/facility';

export interface IngestionSourceMeta {
  id: string;
  name: string;
  region: string; // 'Berlin' | 'Hamburg' | 'NRW' | 'Bund'
  url: string;
  license?: string;
}

export interface IngestionAdapter {
  meta: IngestionSourceMeta;
  fetch(): Promise<Facility[]>;
}

export interface IngestionStats {
  sourceId: string;
  sourceName: string;
  totalFetched: number;
  validRecords: number;
  invalidRecords: number;
  durationMs: number;
  errors: string[];
}

export interface IngestionRunResult {
  startedAt: string;
  completedAt: string;
  dryRun: boolean;
  totalProcessed: number;
  inserted: number;
  updated: number;
  errors: string[];
  sources: IngestionStats[];
}
