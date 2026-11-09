'use client';

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import * as protomapsL from 'protomaps-leaflet';
import { LIGHT } from '@protomaps/basemaps';
import { Facility } from '@/types/facility';
import { Building2, HeartHandshake, MapPin, Printer, ChevronRight, Train } from 'lucide-react';

interface LeafletMapProps {
  facilities: Facility[];
  selectedFacility: Facility | null;
  onSelectFacility: (facility: Facility) => void;
  onOpenDetails: (facility: Facility) => void;
  onOpenPrint: (facility: Facility) => void;
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

// Protomaps Vector Layer Component
const ProtomapsLayer: React.FC<{ apiKey: string }> = ({ apiKey }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !apiKey) return;

    try {
      const layer = protomapsL.leafletLayer({
        url: `https://api.protomaps.com/tiles/v3/{z}/{x}/{y}.mvt?key=${apiKey}`,
        paintRules: protomapsL.paintRules(GOOGLE_MAPS_THEME),
        labelRules: protomapsL.labelRules(GOOGLE_MAPS_THEME),
        lang: 'de',
        backgroundColor: '#a5d7f8',
      });

      layer.addTo(map);

      return () => {
        map.removeLayer(layer);
      };
    } catch (err) {
      console.warn('Protomaps layer initialization error:', err);
    }
  }, [map, apiKey]);

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

export const LeafletMap: React.FC<LeafletMapProps> = ({
  facilities,
  selectedFacility,
  onSelectFacility,
  onOpenDetails,
  onOpenPrint,
}) => {
  const berlinCenter: [number, number] = [52.518, 13.405];
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
  const protomapsKey = process.env.NEXT_PUBLIC_PROTOMAPS_API_KEY;

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={berlinCenter}
        zoom={11}
        scrollWheelZoom={true}
        className="w-full h-full z-10"
        style={{ minHeight: '100%', background: '#e2e8f0' }}
      >
        {mapboxToken ? (
          <TileLayer
            attribution='&copy; <a href="https://www.mapbox.com/about/maps/" target="_blank" rel="noopener">Mapbox</a> &copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'
            url={`https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/256/{z}/{x}/{y}@2x?access_token=${mapboxToken}`}
            tileSize={256}
            maxZoom={19}
          />
        ) : protomapsKey ? (
          <ProtomapsLayer apiKey={protomapsKey} />
        ) : (
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> Mitwirkende'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            maxZoom={19}
          />
        )}

        <MapController selectedFacility={selectedFacility} />

        {facilities.map((facility) => {
          const isAmt = facility.institutionType === 'amt';
          const isSelected = selectedFacility?.id === facility.id;

          return (
            <Marker
              key={facility.id}
              position={facility.coordinates}
              icon={createCustomIcon(isAmt, isSelected)}
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
                  <p className="text-[11px] text-slate-500 line-clamp-1">{facility.address.street}</p>

                  {/* Transit info */}
                  <div className="flex items-center gap-1 text-[11px] text-slate-600 bg-slate-50 p-1.5 rounded border border-slate-100">
                    <Train className="w-3 h-3 text-blue-600 shrink-0" />
                    <span className="font-semibold">{facility.transit.station}</span>
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
      </MapContainer>

      {/* Map Legend Overlay */}
      <div className="absolute bottom-4 left-4 z-20 bg-white/95 backdrop-blur-sm p-2.5 rounded-lg shadow-lg border border-slate-200 text-xs space-y-1.5">
        <div className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">Kartenlegende</div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full bg-blue-600 border border-white shadow-sm inline-block shrink-0"></span>
          <span className="text-slate-700 font-medium">Behörde / Amt (Jobcenter, RSD, SpDi)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-full bg-emerald-600 border border-white shadow-sm inline-block shrink-0"></span>
          <span className="text-slate-700 font-medium">Freier Träger / NGO (BEW, Treffs, Notschlafstellen)</span>
        </div>
      </div>
    </div>
  );
};

export default LeafletMap;
