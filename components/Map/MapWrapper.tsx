'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import { Facility, BerlinDistrict } from '@/types/facility';
import { MapPin, Loader2 } from 'lucide-react';

interface MapWrapperProps {
  facilities: Facility[];
  selectedFacility: Facility | null;
  onSelectFacility: (facility: Facility) => void;
  onOpenDetails: (facility: Facility) => void;
  onOpenPrint: (facility: Facility) => void;
  selectedDistrict?: BerlinDistrict | 'all';
  onSelectDistrict?: (district: BerlinDistrict) => void;
}

// Dynamically import LeafletMap with SSR disabled to prevent `window is not defined`
const DynamicLeafletMap = dynamic(() => import('./LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full min-h-[400px] flex flex-col items-center justify-center bg-slate-100 text-slate-500 gap-3">
      <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      <div className="text-center">
        <p className="text-sm font-semibold text-slate-700">Berliner Karte wird geladen...</p>
        <p className="text-xs text-slate-400">Vektorkarte (DSGVO-konform / Cloudflare R2)</p>
      </div>
    </div>
  ),
});

export const MapWrapper: React.FC<MapWrapperProps> = (props) => {
  return (
    <div className="w-full h-full relative">
      <DynamicLeafletMap {...props} />
    </div>
  );
};
