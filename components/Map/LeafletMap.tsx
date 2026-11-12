'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, Popup, useMap, GeoJSON } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import * as protomapsL from 'protomaps-leaflet';
import { LIGHT } from '@protomaps/basemaps';
import { Facility, BerlinDistrict } from '@/types/facility';
import { Building2, HeartHandshake, MapPin, Printer, ChevronRight, Train, Layers } from 'lucide-react';
import berlinBezirkeGeoJson from '@/data/berlin_bezirke.json';

interface LeafletMapProps {
  facilities: Facility[];
  selectedFacility: Facility | null;
  onSelectFacility: (facility: Facility) => void;
  onOpenDetails: (facility: Facility) => void;
  onOpenPrint: (facility: Facility) => void;
  selectedDistrict?: BerlinDistrict | 'all';
  onSelectDistrict?: (district: BerlinDistrict) => void;
}

// Google Maps-inspired warm & vibrant cartography styling
const GOOGLE_MAPS_THEME = {
  ...LIGHT,
  background: '#f4f3f0',
  earth: '#f4f3f0',
  water: '#a5d7f8',
  park_a: '#cbe6c4',
  park_b: '#b7e2af',
  wood_a: '#cbe6c4',
  wood_b: '#b7e2af',
  scrub_a: '#d2ebcc',
  scrub_b: '#b7e2af',
  glacier: '#ffffff',
  sand: '#f5ecd7',
  beach: '#faebd7',
  aerodrome: '#e8eaed',
  runway: '#ffffff',
  pedestrian: '#e8eaed',
  buildings: '#e3e4e6',
  hospital: '#fce8e6',
  industrial: '#eceff1',
  school: '#fef7e0',
  highway: '#ffd15c',
  highway_casing_early: '#f9a825',
  highway_casing_late: '#e6a830',
  major: '#ffffff',
  major_casing_early: '#dadce0',
  major_casing_late: '#cfd2d7',
  minor_a: '#ffffff',
  minor_b: '#ffffff',
  minor_casing: '#e8eaed',
  minor_service: '#ffffff',
  minor_service_casing: '#f1f3f4',
  railway: '#9aa0a6',
  boundaries: '#9aa0a6',
  city_label: '#202124',
  city_label_halo: '#ffffff',
  subplace_label: '#3c4043',
  subplace_label_halo: '#ffffff',
  roads_label_major: '#3c4043',
  roads_label_major_halo: '#ffffff',
  roads_label_minor: '#5f6368',
  roads_label_minor_halo: '#ffffff',
  ocean_label: '#1a73e8',
  address_label: '#5f6368',
  address_label_halo: '#ffffff',
  landcover: {
    grassland: '#cbe6c4',
    barren: '#f5ecd7',
    urban_area: '#f4f3f0',
    farmland: '#e2f0d9',
    glacier: '#ffffff',
    scrub: '#d2ebcc',
    forest: '#b7e2af',
  },
};

const DEFAULT_PMTILES_URL = 'https://pub-f3f0eb63a5f147d589065f16773925a3.r2.dev/berlin.pmtiles';

// Protomaps Vector Layer Component (100% Self-Hosted & GDPR / § 35 SGB I Compliant via Cloudflare R2)
const ProtomapsLayer: React.FC<{ tileUrl?: string }> = ({ tileUrl = DEFAULT_PMTILES_URL }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !tileUrl) return;

    try {
      const layer = protomapsL.leafletLayer({
        url: tileUrl,
        paintRules: protomapsL.paintRules(GOOGLE_MAPS_THEME),
        labelRules: protomapsL.labelRules(GOOGLE_MAPS_THEME),
        lang: 'de',
        backgroundColor: '#a5d7f8',
        maxDataZoom: 15,
        maxZoom: 18,
        attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> (Lokal & DSGVO-konform)',
      });

      layer.addTo(map);

      return () => {
        map.removeLayer(layer);
      };
    } catch (err) {
      console.warn('Protomaps layer initialization error:', err);
    }
  }, [map, tileUrl]);

  return null;
};

// Controller component to smoothly fly map to selected facility
const MapController: React.FC<{ selectedFacility: Facility | null }> = ({ selectedFacility }) => {
  const map = useMap();

  useEffect(() => {
    if (selectedFacility) {
      map.flyTo(selectedFacility.coordinates, 14, {
        animate: true,
        duration: 1.2,
      });
    }
  }, [selectedFacility, map]);

  return null;
};

// Create custom colored SVG marker icons for Ämter (Blue) and Träger (Emerald)
const createCustomIcon = (isAmt: boolean, isSelected: boolean) => {
  const bgColor = isAmt ? '#2563eb' : '#059669'; // Blue vs Emerald
  const ringClass = isSelected
    ? 'ring-4 ring-amber-400 ring-offset-2 scale-125 z-50 shadow-2xl'
    : 'shadow-md hover:scale-110';

  const iconSvg = isAmt
    ? `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>`
    : `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>`;

  const html = `
    <div class="relative flex items-center justify-center transition-transform duration-200 ${ringClass}" style="width: 34px; height: 34px; border-radius: 50%; background-color: ${bgColor}; border: 2.5px solid white;">
      ${iconSvg}
      <div style="position: absolute; bottom: -6px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 6px solid transparent; border-right: 6px solid transparent; border-top: 6px solid ${bgColor};"></div>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'custom-leaflet-marker',
    iconSize: [34, 40],
    iconAnchor: [17, 38],
    popupAnchor: [0, -38],
  });
};

// Deterministic micro-offset for facilities sharing the exact same coordinates (e.g. centroid fallback or single campus)
function disambiguateCoordinates(facilities: Facility[]): (Facility & { displayCoordinates: [number, number] })[] {
  const groups = new Map<string, Facility[]>();
  for (const f of facilities) {
    if (!f.coordinates || f.coordinates.length !== 2) continue;
    const key = `${f.coordinates[0].toFixed(5)},${f.coordinates[1].toFixed(5)}`;
    const list = groups.get(key) || [];
    list.push(f);
    groups.set(key, list);
  }

  const result: (Facility & { displayCoordinates: [number, number] })[] = [];

  groups.forEach((list) => {
    if (list.length === 1) {
      result.push({ ...list[0], displayCoordinates: list[0].coordinates });
    } else {
      // Disambiguate overlapping markers into an elegant micro-ring (~35m radius)
      const radius = 0.00035;
      list.forEach((f, idx) => {
        const angle = (2 * Math.PI * idx) / list.length;
        const latOffset = Math.sin(angle) * radius;
        const lngOffset = Math.cos(angle) * radius * 1.5;
        result.push({
          ...f,
          displayCoordinates: [f.coordinates[0] + latOffset, f.coordinates[1] + lngOffset],
        });
      });
    }
  });

  return result;
}

// Custom styled cluster icon reflecting the ratio of Behörden (Blue) and Freie Träger (Emerald)
const createCustomClusterIcon = (cluster: any) => {
  const count = cluster.getChildCount();
  const children = cluster.getAllChildMarkers();
  let amtCount = 0;
  let traegerCount = 0;

  for (const child of children) {
    if (child.options?.isAmt) {
      amtCount++;
    } else {
      traegerCount++;
    }
  }

  const hasBoth = amtCount > 0 && traegerCount > 0;
  const clusterBg = hasBoth
    ? 'linear-gradient(135deg, #2563eb 50%, #059669 50%)'
    : amtCount > 0
    ? '#2563eb'
    : '#059669';

  return L.divIcon({
    html: `
      <div class="relative flex items-center justify-center w-10 h-10 rounded-full text-white font-extrabold text-xs shadow-xl border-2 border-white ring-4 ring-slate-900/10 hover:scale-110 transition-transform cursor-pointer" style="background: ${clusterBg};">
        <span>${count}</span>
      </div>
    `,
    className: 'custom-polaris-cluster',
    iconSize: [40, 40],
    iconAnchor: [20, 20],
  });
};

export const LeafletMap: React.FC<LeafletMapProps> = ({
  facilities,
  selectedFacility,
  onSelectFacility,
  onOpenDetails,
  onOpenPrint,
  selectedDistrict,
  onSelectDistrict,
}) => {
  const berlinCenter: [number, number] = [52.518, 13.405];
  // 100% GDPR-compliant self-hosted PMTiles source on Cloudflare R2
  const pmtilesUrl = process.env.NEXT_PUBLIC_PMTILES_URL || DEFAULT_PMTILES_URL;

  const [showDistricts, setShowDistricts] = useState<boolean>(true);

  // Apply coordinate disambiguation so markers sharing exact coordinates don't occlude
  const disambiguatedFacilities = useMemo(() => {
    return disambiguateCoordinates(facilities);
  }, [facilities]);

  // Dynamic styling for Berlin LOR district boundaries
  const districtStyle = (feature: any) => {
    const name = feature?.properties?.name;
    const isSelected = selectedDistrict && selectedDistrict !== 'all' && name === selectedDistrict;

    return {
      color: isSelected ? '#1d4ed8' : '#64748b',
      weight: isSelected ? 2.5 : 1.5,
      fillColor: isSelected ? '#3b82f6' : '#94a3b8',
      fillOpacity: isSelected ? 0.2 : 0.03,
      dashArray: isSelected ? undefined : '4, 4',
    };
  };

  const onEachDistrict = (feature: any, layer: any) => {
    const name = feature?.properties?.name;
    if (!name) return;

    layer.bindTooltip(
      `<div class="font-bold text-xs text-slate-900">Bezirk ${name}</div><div class="text-[10px] text-slate-500 font-medium">Zuständigkeit § 86 SGB VIII / § 36 SGB XII</div>`,
      { sticky: true, className: 'custom-district-tooltip' }
    );

    layer.on({
      mouseover: (e: any) => {
        const l = e.target;
        if (selectedDistrict !== name) {
          l.setStyle({
            weight: 2,
            color: '#2563eb',
            fillOpacity: 0.12,
          });
        }
      },
      mouseout: (e: any) => {
        const l = e.target;
        if (selectedDistrict !== name) {
          l.setStyle(districtStyle(feature));
        }
      },
      click: () => {
        if (onSelectDistrict) {
          onSelectDistrict(name as BerlinDistrict);
        }
      },
    });
  };

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={berlinCenter}
        zoom={11}
        minZoom={9}
        maxZoom={18}
        scrollWheelZoom={true}
        className="w-full h-full z-10"
        style={{ minHeight: '100%', background: '#f4f3f0' }}
        attributionControl={true}
      >
        {/* Self-hosted vector tile layer via Protomaps PMTiles */}
        <ProtomapsLayer tileUrl={pmtilesUrl} />

        <MapController selectedFacility={selectedFacility} />

        {/* Berlin LOR / Statutory District Boundaries */}
        {showDistricts && (
          <GeoJSON
            key={`districts-${selectedDistrict || 'all'}`}
            data={berlinBezirkeGeoJson as any}
            style={districtStyle}
            onEachFeature={onEachDistrict}
          />
        )}

        {/* High-performance clustering with dynamic Behörden vs. Freie Träger ratios */}
        <MarkerClusterGroup
          chunkedLoading
          iconCreateFunction={createCustomClusterIcon}
          maxClusterRadius={45}
          disableClusteringAtZoom={16}
          spiderfyOnMaxZoom={true}
          showCoverageOnHover={false}
        >
          {disambiguatedFacilities.map((facility) => {
            const isAmt = facility.institutionType === 'amt';
            const isSelected = selectedFacility?.id === facility.id;

            return (
              <Marker
                key={facility.id}
                position={facility.displayCoordinates}
                icon={createCustomIcon(isAmt, isSelected)}
                // @ts-ignore custom marker property for cluster ratio calculation
                isAmt={isAmt}
                eventHandlers={{
                  click: () => onSelectFacility(facility),
                }}
              >
              <Popup className="custom-facility-popup" minWidth={260}>
                <div className="p-1 space-y-2 text-slate-800">
                  {/* Badge */}
                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                        isAmt ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {isAmt ? 'Behörde / Amt' : 'Freier Träger / NGO'}
                    </span>
                    <span className="text-[11px] font-medium text-slate-500">{facility.district}</span>
                  </div>

                  {/* Title */}
                  <h4 className="text-xs font-bold text-slate-900 leading-tight">{facility.name}</h4>
                  <p className="text-[11px] text-slate-500 line-clamp-1">{facility.address?.street || 'Berlin'}</p>

                  {/* Transit info */}
                  <div className="flex items-center gap-1 text-[11px] text-slate-600 bg-slate-50 p-1.5 rounded border border-slate-100">
                    <Train className="w-3 h-3 text-blue-600 shrink-0" />
                    <span className="font-semibold">{facility.transit?.station || 'ÖPNV'}</span>
                  </div>

                  {/* Action buttons */}
                  <div className="flex items-center justify-between gap-1.5 pt-1.5 border-t border-slate-100">
                    <button
                      onClick={() => onOpenPrint(facility)}
                      className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1 text-[11px] font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 transition-colors"
                    >
                      <Printer className="w-3 h-3" />
                      <span>Klienten-Zettel</span>
                    </button>
                    <button
                      onClick={() => onOpenDetails(facility)}
                      className="flex-1 inline-flex items-center justify-center gap-1 px-2 py-1 text-[11px] font-medium text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors"
                    >
                      <span>Details</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
        </MarkerClusterGroup>
      </MapContainer>

      {/* District Boundaries (LOR) Toggle */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-2 pointer-events-auto">
        <button
          type="button"
          onClick={() => setShowDistricts(!showDistricts)}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-md border transition-all ${
            showDistricts
              ? 'bg-blue-600 text-white border-blue-500 shadow-blue-500/20'
              : 'bg-white/95 text-slate-700 hover:text-slate-900 border-slate-200 backdrop-blur-sm'
          }`}
          title="Berliner Bezirks- und LOR-Zuständigkeitsgrenzen umschalten"
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Bezirksgrenzen (LOR)</span>
        </button>
      </div>

      {/* Map Legend Overlay */}
      <div className="absolute bottom-5 left-4 z-20 bg-white/95 backdrop-blur-sm p-2.5 rounded-lg shadow-lg border border-slate-200 text-xs space-y-1.5 max-w-[calc(100vw-32px)] sm:max-w-xs pointer-events-auto">
        <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">Kartenlegende</div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full bg-blue-600 border border-white shadow-sm inline-block shrink-0"></span>
          <span className="text-slate-700 font-medium">Behörde / Amt (Jobcenter, RSD, SpDi)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full bg-emerald-600 border border-white shadow-sm inline-block shrink-0"></span>
          <span className="text-slate-700 font-medium">Freier Träger / NGO (BEW, Treffs, Notschlafstellen)</span>
        </div>
        <div className="flex items-center gap-2 pt-0.5 border-t border-slate-100">
          <span className="w-3.5 h-3.5 rounded-full border border-white shadow-sm inline-block shrink-0" style={{ background: 'linear-gradient(135deg, #2563eb 50%, #059669 50%)' }}></span>
          <span className="text-slate-500 text-[11px]">Cluster (Zahl = Anzahl Angebote im Kiez)</span>
        </div>
      </div>
    </div>
  );
};

export default LeafletMap;
