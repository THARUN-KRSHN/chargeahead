'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, MapIcon, List, Zap, Battery, ChevronRight, SlidersHorizontal } from 'lucide-react';
import Link from 'next/link';
import { MapComponent } from '@/components/shared/MapComponent';
import { StationCard } from '@/components/shared/StationCard';
import { BottomSheet } from '@/components/shared/BottomSheet';
import { useVehicleStore } from '@/lib/store/vehicleStore';
import { fetchNearbyStations } from '@/lib/mock/api';
import { useMockLiveUpdates } from '@/hooks/useMockLiveUpdates';
import type { ChargingStation, ConnectorType } from '@/types';
import { cn } from '@/lib/utils';

const CONNECTOR_FILTERS: ConnectorType[] = ['CCS2', 'Type2', 'CHAdeMO', 'Bharat DC-001'];

export default function HomePage() {
  const { activeVehicle } = useVehicleStore();
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map');
  const [stations, setStations] = useState<ChargingStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStation, setSelectedStation] = useState<ChargingStation | null>(null);
  const [filterOpen, setFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeConnectors, setActiveConnectors] = useState<ConnectorType[]>([]);
  const [showFastOnly, setShowFastOnly] = useState(false);
  const [minReliability, setMinReliability] = useState(0);

  // Boot live updates
  useMockLiveUpdates();

  useEffect(() => {
    fetchNearbyStations(16)
      .then(setStations)
      .finally(() => setLoading(false));
  }, []);

  const filteredStations = stations.filter((s) => {
    if (searchQuery && !s.name.toLowerCase().includes(searchQuery.toLowerCase()) && !s.city.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (activeConnectors.length > 0 && !s.ports.some((p) => activeConnectors.includes(p.connectorType))) return false;
    if (showFastOnly && !s.fastChargeAvailable) return false;
    if (s.confidenceScore < minReliability) return false;
    return true;
  });

  const handleStationMapClick = useCallback((station: ChargingStation) => {
    setSelectedStation(station);
  }, []);

  return (
    <div className="h-[calc(100dvh-64px)] flex flex-col overflow-hidden relative bg-white text-black">
      {/* ── Search bar (floating) ── */}
      <div className="absolute top-4 left-4 right-4 z-30 flex gap-2">
        <Link href="/app/plan" className="flex-1">
          <div className="flex items-center gap-3 bg-white/95 backdrop-blur-md border border-gray-200 rounded-2xl px-4 py-3 shadow-md hover:border-black transition-all cursor-text">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <span className="text-sm text-gray-500 font-medium">Where are you headed?</span>
          </div>
        </Link>

        {/* Filter button */}
        <button
          onClick={() => setFilterOpen(true)}
          className="flex items-center justify-center w-12 h-12 bg-white/95 backdrop-blur-md border border-gray-200 rounded-2xl hover:border-black shadow-md transition-all"
          aria-label="Filters"
        >
          <SlidersHorizontal className="w-4 h-4 text-black" />
        </button>
      </div>

      {/* ── View toggle + vehicle switcher ── */}
      <div className="absolute top-20 left-4 right-4 z-30 flex items-center justify-between">
        {/* Vehicle pill */}
        {activeVehicle && (
          <Link href="/app/profile/vehicles">
            <motion.div
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-2 bg-white/95 backdrop-blur-md border border-gray-200 rounded-2xl px-3 py-2 shadow-sm hover:border-black transition-all"
            >
              <Battery className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-xs font-bold text-black">{activeVehicle.nickname ?? activeVehicle.evModel?.model ?? 'My EV'}</span>
              <span className="text-xs font-extrabold text-emerald-600">{activeVehicle.currentChargePercent}%</span>
              <ChevronRight className="w-3 h-3 text-gray-400" />
            </motion.div>
          </Link>
        )}

        {/* Map/List toggle */}
        <div className="flex items-center gap-1 bg-white/95 backdrop-blur-md border border-gray-200 rounded-xl p-1 shadow-sm">
          <button
            onClick={() => setViewMode('map')}
            className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all', viewMode === 'map' ? 'bg-black text-white' : 'text-gray-600 hover:text-black')}
          >
            <MapIcon className="w-3.5 h-3.5" /> Map
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all', viewMode === 'list' ? 'bg-black text-white' : 'text-gray-600 hover:text-black')}
          >
            <List className="w-3.5 h-3.5" /> List
          </button>
        </div>
      </div>

      {/* ── Map view ── */}
      <AnimatePresence mode="wait">
        {viewMode === 'map' && (
          <motion.div
            key="map"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0"
          >
            <MapComponent
              stations={filteredStations}
              height="100%"
              className="w-full h-full"
              onStationClick={handleStationMapClick}
              selectedStationId={selectedStation?.id}
              userLocation={{ lat: 12.9116, lng: 77.6389 }}
            />

            {/* Bottom station list peek */}
            {!selectedStation && (
              <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-white via-white/80 to-transparent pt-4">
                <div className="px-4 pb-2">
                  <p className="text-xs text-gray-500 font-bold mb-2 text-center uppercase tracking-wider">
                    {filteredStations.length} stations nearby
                  </p>
                </div>
                <div className="flex gap-3 px-4 pb-4 overflow-x-auto no-scrollbar">
                  {loading
                    ? Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="skeleton rounded-2xl w-56 h-36 shrink-0" />
                      ))
                    : filteredStations.slice(0, 6).map((s) => (
                        <div key={s.id} className="shrink-0 w-56">
                          <StationCard station={s} compact />
                        </div>
                      ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* ── List view ── */}
        {viewMode === 'list' && (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 overflow-y-auto pt-32 pb-4 px-4 bg-white"
          >
            {loading ? (
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="skeleton rounded-2xl h-40" />
                ))}
              </div>
            ) : filteredStations.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Zap className="w-12 h-12 text-gray-300 mb-4" />
                <p className="text-gray-600 font-bold">No stations match your filters</p>
                <button onClick={() => { setActiveConnectors([]); setShowFastOnly(false); setMinReliability(0); }} className="mt-3 text-black font-extrabold text-sm hover:underline">
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="space-y-3 max-w-3xl mx-auto">
                {filteredStations.map((s) => (
                  <StationCard key={s.id} station={s} />
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Selected station bottom sheet ── */}
      <BottomSheet
        isOpen={!!selectedStation}
        onClose={() => setSelectedStation(null)}
        showHandle
        showCloseButton
        title={selectedStation?.name ?? ''}
      >
        {selectedStation && (
          <div className="pb-4 text-black">
            <p className="text-sm text-gray-500 font-medium mb-4">{selectedStation.address}</p>
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="glass-card rounded-xl p-3 text-center border-gray-200">
                <div className="text-lg font-extrabold text-emerald-600">{selectedStation.confidenceScore}%</div>
                <div className="text-[10px] text-gray-500 font-bold mt-0.5">reliable</div>
              </div>
              <div className="glass-card rounded-xl p-3 text-center border-gray-200">
                <div className="text-lg font-extrabold text-black">{selectedStation.availablePorts}/{selectedStation.totalPorts}</div>
                <div className="text-[10px] text-gray-500 font-bold mt-0.5">ports free</div>
              </div>
              <div className="glass-card rounded-xl p-3 text-center border-gray-200">
                <div className="text-lg font-extrabold text-black">₹{selectedStation.pricePerKwh}</div>
                <div className="text-[10px] text-gray-500 font-bold mt-0.5">per kWh</div>
              </div>
            </div>
            <div className="flex gap-2">
              <Link href={`/app/station/${selectedStation.id}`} className="flex-1">
                <button className="w-full py-3.5 rounded-xl bg-black text-white font-extrabold text-sm hover:bg-gray-900 transition-all shadow-md">
                  View Station
                </button>
              </Link>
              {selectedStation.isReservable && (
                <Link href={`/app/station/${selectedStation.id}/reserve`} className="flex-1">
                  <button className="w-full py-3.5 rounded-xl border border-gray-300 text-black font-extrabold text-sm hover:bg-gray-50 transition-all">
                    Reserve Port
                  </button>
                </Link>
              )}
            </div>
          </div>
        )}
      </BottomSheet>

      {/* ── Filter sheet ── */}
      <BottomSheet isOpen={filterOpen} onClose={() => setFilterOpen(false)} title="Filters" showHandle showCloseButton>
        <div className="space-y-6 pb-6 text-black">
          {/* Connectors */}
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Connector Type</h3>
            <div className="flex flex-wrap gap-2">
              {CONNECTOR_FILTERS.map((c) => (
                <button
                  key={c}
                  onClick={() =>
                    setActiveConnectors((prev) =>
                      prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
                    )
                  }
                  className={cn(
                    'px-3 py-1.5 rounded-full text-xs font-bold border transition-all',
                    activeConnectors.includes(c)
                      ? 'bg-black border-black text-white'
                      : 'border-gray-200 text-gray-600 hover:border-black',
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Fast charge toggle */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-black">Fast charging only (≥50 kW)</span>
            <button
              onClick={() => setShowFastOnly((v) => !v)}
              className={cn(
                'relative w-11 h-6 rounded-full transition-colors',
                showFastOnly ? 'bg-black' : 'bg-gray-200',
              )}
            >
              <span
                className={cn(
                  'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform',
                  showFastOnly && 'translate-x-5',
                )}
              />
            </button>
          </div>

          {/* Min reliability */}
          <div>
            <div className="flex justify-between mb-2 font-bold">
              <span className="text-sm text-gray-700">Min reliability</span>
              <span className="text-sm text-black">{minReliability}%</span>
            </div>
            <input
              type="range" min={0} max={90} step={10} value={minReliability}
              onChange={(e) => setMinReliability(Number(e.target.value))}
              className="w-full accent-black cursor-pointer"
            />
          </div>

          {/* Apply button */}
          <button
            onClick={() => setFilterOpen(false)}
            className="w-full py-3.5 rounded-xl bg-black text-white font-extrabold text-sm shadow-md hover:bg-gray-900"
          >
            Apply Filters · {filteredStations.length} stations
          </button>
        </div>
      </BottomSheet>
    </div>
  );
}
