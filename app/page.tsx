'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Header } from '@/components/Header';
import { FilterBar } from '@/components/FilterBar';
import { FacilityList } from '@/components/FacilityList';
import { MapWrapper } from '@/components/Map/MapWrapper';
import { DetailDrawer } from '@/components/DetailDrawer';
import { ClientPrintModal } from '@/components/ClientPrintModal';
import { MOCK_FACILITIES } from '@/data/facilities';
import { Facility, FilterState } from '@/types/facility';
import { List, Map as MapIcon } from 'lucide-react';
import { useBookmarks } from '@/lib/useBookmarks';
import TriageModal from '@/components/TriageModal';
import EmergencyBar from '@/components/EmergencyBar';
import { TeamModal } from '@/components/TeamModal';

const INITIAL_FILTERS: FilterState = {
  searchQuery: '',
  institutionType: 'all',
  accessType: 'all',
  primaryFocus: 'all',
  ageGroups: [],
  district: 'all',
  wheelchairOnly: false,
  language: 'all',
  kaeltehilfeOnly: false,
};

export default function Home() {
  const { isBookmarked } = useBookmarks();
  const [showOnlyBookmarks, setShowOnlyBookmarks] = useState(false);
  const [facilities, setFacilities] = useState<Facility[]>(MOCK_FACILITIES);
  const [dataSource, setDataSource] = useState<'supabase' | 'notion' | 'mock'>('mock');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [filterState, setFilterState] = useState<FilterState>(INITIAL_FILTERS);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [detailFacility, setDetailFacility] = useState<Facility | null>(null);
  const [printFacility, setPrintFacility] = useState<Facility | null>(null);
  const [mobileTab, setMobileTab] = useState<'list' | 'map'>('list');
  const [isTriageOpen, setIsTriageOpen] = useState(false);
  const [joinCode, setJoinCode] = useState<string>('');
  const [isDeepLinkJoinOpen, setIsDeepLinkJoinOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('join');
      if (code) {
        setJoinCode(code.trim().toUpperCase());
        setIsDeepLinkJoinOpen(true);
      }
    }
  }, []);

  // Load facilities from /api/facilities (Notion or Mock fallback)
  const loadFacilities = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/facilities', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.facilities) && data.facilities.length > 0) {
          setFacilities(data.facilities);
          setDataSource(data.source || 'mock');
          setFetchError(data.error || null);
        }
      }
    } catch (err: any) {
      console.warn('Fehler beim Laden von /api/facilities, Mock-Daten bleiben aktiv:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFacilities();
  }, []);

  // 1. Filter facilities based on all filter facets
  const filteredFacilities = useMemo(() => {
    return facilities.filter((facility) => {
      // 0. Favoriten-Filter prüfen
      if (showOnlyBookmarks && !isBookmarked(facility.id)) {
        return false;
      }
      // 1. Full text search
      if (filterState.searchQuery.trim()) {
        const query = filterState.searchQuery.toLowerCase();
        const matchesName = facility.name.toLowerCase().includes(query);
        const matchesSubtitle = facility.subTitle.toLowerCase().includes(query);
        const matchesDistrict = facility.district.toLowerCase().includes(query);
        const matchesStreet = facility.address.street.toLowerCase().includes(query);
        const matchesStation = facility.transit.station.toLowerCase().includes(query);
        const matchesLegal = facility.legalBases.some((b) => b.toLowerCase().includes(query));
        const matchesNotes = facility.internalWorkerNotes.toLowerCase().includes(query);
        const matchesIntake = facility.intakeRules.summary.toLowerCase().includes(query);

        if (
          !matchesName &&
          !matchesSubtitle &&
          !matchesDistrict &&
          !matchesStreet &&
          !matchesStation &&
          !matchesLegal &&
          !matchesNotes &&
          !matchesIntake
        ) {
          return false;
        }
      }

      // 2. Institution Type
      if (filterState.institutionType !== 'all' && facility.institutionType !== filterState.institutionType) {
        return false;
      }

      // 3. Access Type
      if (filterState.accessType !== 'all' && facility.accessType !== filterState.accessType) {
        return false;
      }

      // 4. Primary Focus
      if (filterState.primaryFocus !== 'all' && facility.primaryFocus !== filterState.primaryFocus) {
        return false;
      }

      // 5. Target Age Groups (if any selected, must match at least one)
      if (filterState.ageGroups.length > 0) {
        const hasMatchingAge = filterState.ageGroups.some((group) => facility.ageGroups.includes(group));
        if (!hasMatchingAge) return false;
      }

      // 6. District
      if (filterState.district !== 'all' && facility.district !== filterState.district) {
        return false;
      }

      // 7. Wheelchair Accessibility
      if (filterState.wheelchairOnly && facility.accessibility.wheelchair !== 'voll') {
        return false;
      }

      // 8. Language
      if (filterState.language !== 'all' && !facility.accessibility.languages.includes(filterState.language)) {
        return false;
      }

      // 9. Kältehilfe & Notübernachtung (Seasonal)
      if (filterState.kaeltehilfeOnly) {
        const textToSearch = `${facility.name} ${facility.subTitle} ${facility.internalWorkerNotes || ''} ${(facility.targetGroups || []).join(' ')}`.toLowerCase();
        const matchesEmergency =
          textToSearch.includes('kälte') ||
          textToSearch.includes('notübernachtung') ||
          textToSearch.includes('wärmestube') ||
          textToSearch.includes('nachtcafé') ||
          textToSearch.includes('obdachlos') ||
          textToSearch.includes('wohnungslos');
        if (!matchesEmergency) return false;
      }

      return true;
    });
  }, [facilities, filterState, showOnlyBookmarks, isBookmarked]);

  // 2. Zähler-Berechnung (jetzt sicher platziert NACH filteredFacilities)
  const counts = useMemo(() => {
    return {
      total: facilities.length,
      filtered: filteredFacilities.length,
      totalAmt: facilities.filter((f) => f.institutionType === 'amt').length,
      totalTraeger: facilities.filter((f) => f.institutionType === 'traeger').length,
      filteredAmt: filteredFacilities.filter((f) => f.institutionType === 'amt').length,
      filteredTraeger: filteredFacilities.filter((f) => f.institutionType === 'traeger').length,
    };
  }, [facilities, filteredFacilities]);

  const hasActiveFilters = useMemo(() => {
    return (
      filterState.searchQuery !== '' ||
      filterState.institutionType !== 'all' ||
      filterState.accessType !== 'all' ||
      filterState.primaryFocus !== 'all' ||
      filterState.ageGroups.length > 0 ||
      filterState.district !== 'all' ||
      filterState.wheelchairOnly !== false ||
      filterState.language !== 'all' ||
      !!filterState.kaeltehilfeOnly
    );
  }, [filterState]);

  const handleResetFilters = () => {
    setFilterState(INITIAL_FILTERS);
    setShowOnlyBookmarks(false);
  };

  const handleSelectFacility = (facility: Facility) => {
    setSelectedFacility(facility);
  };

  const handleOpenDetails = (facility: Facility) => {
    setSelectedFacility(facility);
    setDetailFacility(facility);
  };

  const handleOpenPrint = (facility: Facility) => {
    setSelectedFacility(facility);
    setPrintFacility(facility);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100">
      {/* Top Application Header */}
      <Header
        counts={counts}
        onResetFilters={handleResetFilters}
        hasActiveFilters={hasActiveFilters}
        dataSource={dataSource}
        isLoading={isLoading}
        onRefresh={loadFacilities}
        onOpenTriage={() => setIsTriageOpen(true)}
      />

     {/* Main Split-View Workspace */}
      <main className="w-full relative flex-1">
        {/* Left Column: Filter Facets & Directory Card List */}
        <div
          className={`w-full lg:w-[50%] xl:w-[48%] flex flex-col border-r border-slate-200 bg-white z-10 ${
            mobileTab === 'map' ? 'hidden lg:flex' : 'flex'
          }`}
        >
          {/* Filter Controls Bar */}
          <FilterBar
            filterState={filterState}
            onChange={setFilterState}
            onReset={handleResetFilters}
            hasActiveFilters={hasActiveFilters}
            totalResults={filteredFacilities.length}
            showOnlyBookmarks={showOnlyBookmarks}
            onToggleBookmarks={() => setShowOnlyBookmarks(!showOnlyBookmarks)}
          />

          {/* Card Stream */}
          <div className="w-full flex-1 pb-16 lg:pb-14">
            <FacilityList
              facilities={filteredFacilities}
              selectedFacility={selectedFacility}
              onSelectFacility={handleSelectFacility}
              onOpenDetails={handleOpenDetails}
              onOpenPrint={handleOpenPrint}
              onResetFilters={handleResetFilters}
              searchQuery={filterState.searchQuery}
              totalCount={facilities.length}
              showOnlyBookmarks={showOnlyBookmarks}
            />
          </div>
        </div>

        {/* Right Column: Interactive Berlin Leaflet Map (Felsenfest fixiert) */}
        <div
          className={`w-full lg:w-[50%] xl:w-[52%] bg-slate-200 z-10 polaris-fixed-map ${
            mobileTab === 'list' ? 'hidden lg:block' : 'block polaris-mobile-map'
          }`}
        >
          <MapWrapper
            facilities={filteredFacilities}
            selectedFacility={selectedFacility}
            onSelectFacility={handleSelectFacility}
            onOpenDetails={handleOpenDetails}
            onOpenPrint={handleOpenPrint}
          />
        </div>

        {/* Mobile View Switcher */}
        <div className="lg:hidden fixed bottom-14 left-1/2 -translate-x-1/2 z-30 bg-slate-900/90 backdrop-blur-md p-1 rounded-full shadow-2xl border border-slate-700 flex items-center gap-1">
          <button
            onClick={() => setMobileTab('list')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all ${
              mobileTab === 'list'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>Liste ({filteredFacilities.length})</span>
          </button>
          <button
            onClick={() => setMobileTab('map')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-bold transition-all ${
              mobileTab === 'map'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-300 hover:text-white'
            }`}
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span>Karte</span>
          </button>
        </div>
      </main>

      {/* Streetwork Emergency Hotlines Bar */}
      <EmergencyBar />

      {/* Detail Slide-Over Drawer */}
      <DetailDrawer
        facility={detailFacility}
        isOpen={!!detailFacility}
        onClose={() => setDetailFacility(null)}
        onOpenPrint={handleOpenPrint}
      />

      {/* Printable Consultation Handout Modal */}
      <ClientPrintModal
        facility={printFacility}
        isOpen={!!printFacility}
        onClose={() => setPrintFacility(null)}
      />

      {/* Smart Triage Modal */}
      <TriageModal
        isOpen={isTriageOpen}
        onClose={() => setIsTriageOpen(false)}
      />

      {/* Deep-link Team Join Modal */}
      <TeamModal
        isOpen={isDeepLinkJoinOpen}
        onClose={() => setIsDeepLinkJoinOpen(false)}
        initialCode={joinCode}
      />
    </div>
  );
}