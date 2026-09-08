'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  MapPin,
  ArrowRight,
  ArrowUpDown,
  Navigation,
  Battery,
  Zap,
  Clock,
  DollarSign,
  ShieldCheck,
  CheckCircle2,
  X,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import { searchPlacesReal, reverseGeocodeReal, computeRealEVRoute, type RealPlace, type RealRoutePlan } from '@/lib/api/geoServices';
import { useVehicleStore } from '@/lib/store/vehicleStore';
import { MOCK_VEHICLES } from '@/lib/mock/users';
import type { UserVehicle } from '@/types';
import { cn } from '@/lib/utils';

interface LeftTripPlannerPanelProps {
  isOpen: boolean;
  onToggle: (open: boolean) => void;
  onRouteCalculated: (plan: RealRoutePlan) => void;
  onStartJourney: (plan: RealRoutePlan) => void;
}

export function LeftTripPlannerPanel({
  isOpen,
  onToggle,
  onRouteCalculated,
  onStartJourney,
}: LeftTripPlannerPanelProps) {
  const { activeVehicle, setActiveVehicle } = useVehicleStore();
  const [currentVehicle, setCurrentVehicle] = useState<UserVehicle>(
    activeVehicle ?? MOCK_VEHICLES[0]
  );

  // Locations state
  const [fromQuery, setFromQuery] = useState('Current Location');
  const [fromPlace, setFromPlace] = useState<RealPlace | null>(null);
  const [toQuery, setToQuery] = useState('');
  const [toPlace, setToPlace] = useState<RealPlace | null>(null);

  // Search dropdown results
  const [fromResults, setFromResults] = useState<RealPlace[]>([]);
  const [toResults, setToResults] = useState<RealPlace[]>([]);
  const [searchingFrom, setSearchingFrom] = useState(false);
  const [searchingTo, setSearchingTo] = useState(false);
  const [activeSearchField, setActiveSearchField] = useState<'from' | 'to' | null>(null);

  // Battery slider
  const [batteryPercent, setBatteryPercent] = useState<number>(65);

  // Permission prompt state
  const [showLocationPrompt, setShowLocationPrompt] = useState(true);
  const [locatingUser, setLocatingUser] = useState(false);

  // Calculation state
  const [calculating, setCalculating] = useState(false);
  const [computedPlan, setComputedPlan] = useState<RealRoutePlan | null>(null);

  // Initialize location on mount or prompt
  const handleAllowLocation = () => {
    setLocatingUser(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          const place = await reverseGeocodeReal(lat, lng);
          setFromPlace(place);
          setFromQuery(place.label);
          setLocatingUser(false);
          setShowLocationPrompt(false);
        },
        async (err) => {
          console.warn('Geolocation denied or error:', err);
          // Fallback to Bengaluru default
          const fallback = await reverseGeocodeReal(12.9716, 77.5946);
          setFromPlace(fallback);
          setFromQuery(fallback.label);
          setLocatingUser(false);
          setShowLocationPrompt(false);
        },
        { timeout: 8000 }
      );
    } else {
      setLocatingUser(false);
      setShowLocationPrompt(false);
    }
  };

  // Real-time Place Autocomplete debounced
  useEffect(() => {
    if (!fromQuery || fromQuery === 'Current Location' || activeSearchField !== 'from') {
      setFromResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchingFrom(true);
      const res = await searchPlacesReal(fromQuery);
      setFromResults(res);
      setSearchingFrom(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [fromQuery, activeSearchField]);

  useEffect(() => {
    if (!toQuery || activeSearchField !== 'to') {
      setToResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setSearchingTo(true);
      const res = await searchPlacesReal(toQuery);
      setToResults(res);
      setSearchingTo(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [toQuery, activeSearchField]);

  // Swap From and To
  const handleSwap = () => {
    const tempQ = fromQuery;
    const tempP = fromPlace;
    setFromQuery(toQuery);
    setFromPlace(toPlace);
    setToQuery(tempQ);
    setToPlace(tempP);
  };

  // Calculate Route
  const handleCalculateRoute = async () => {
    setCalculating(true);

    let start = fromPlace;
    if (!start) {
      start = await reverseGeocodeReal(12.9716, 77.5946);
    }

    let end = toPlace;
    if (!end && toQuery) {
      const results = await searchPlacesReal(toQuery);
      if (results.length > 0) end = results[0];
    }

    if (!end) {
      end = {
        id: 'place-mysore',
        label: 'Mysuru Palace, Mysuru',
        address: 'Sayyaji Rao Rd, Mysuru',
        coords: { lat: 12.3052, lng: 76.6552 },
      };
    }

    try {
      const plan = await computeRealEVRoute(start, end, currentVehicle, batteryPercent);
      setComputedPlan(plan);
      onRouteCalculated(plan);
    } catch (err) {
      console.error('Route calculation error:', err);
    } finally {
      setCalculating(false);
    }
  };

  return (
    <>
      {/* Floating Trigger Button on Map (when panel closed) */}
      {!isOpen && (
        <div className="absolute top-4 left-4 z-30 w-80 md:w-96">
          <button
            onClick={() => onToggle(true)}
            className="w-full flex items-center gap-3 bg-white border border-slate-200 rounded-2xl px-4 py-3.5 shadow-xl hover:shadow-2xl hover:border-emerald-500 transition-all text-left group"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0 group-hover:scale-105 transition-transform">
              <Search className="w-4 h-4" />
            </div>
            <div className="flex-1 overflow-hidden">
              <span className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Plan EV Trip</span>
              <span className="block text-sm font-black text-slate-900 truncate">Where do you want to go?</span>
            </div>
          </button>
        </div>
      )}

      {/* Main Left Trip Planner Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: -420, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -420, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="absolute top-0 left-0 bottom-0 w-full md:w-[420px] bg-white border-r border-slate-200 shadow-2xl z-40 flex flex-col overflow-hidden"
          >
            {/* Panel Header */}
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-white text-slate-900">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500 text-slate-950 flex items-center justify-center font-black shadow-md">
                  <Zap className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 tracking-tight">AI EV Route Planner</h2>
                  <p className="text-xs text-emerald-600 font-extrabold">Live OCM API & OSRM Engine</p>
                </div>
              </div>

              <button
                onClick={() => onToggle(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-colors"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 text-slate-900">
              {/* Location Permission Prompt Banner */}
              {showLocationPrompt && (
                <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Navigation className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <h4 className="text-xs font-black text-slate-900">Allow location access?</h4>
                      <p className="text-[11px] text-slate-500 font-medium">Auto-fill your current start point</p>
                    </div>
                  </div>
                  <button
                    onClick={handleAllowLocation}
                    disabled={locatingUser}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-slate-950 text-xs font-black shadow transition-all shrink-0 flex items-center gap-1.5"
                  >
                    {locatingUser ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      'Allow'
                    )}
                  </button>
                </div>
              )}

              {/* Vehicle Selector */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Battery className="w-4 h-4 text-emerald-600" />
                  <div>
                    <div className="text-xs font-extrabold text-slate-900">
                      {currentVehicle.nickname || `${currentVehicle.evModel?.make ?? 'EV'} ${currentVehicle.evModel?.model ?? 'Vehicle'}`}
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium">
                      {currentVehicle.evModel?.batteryCapacityKwh ?? 40} kWh · {currentVehicle.evModel?.connectorTypes?.[0] ?? 'CCS2'}
                    </div>
                  </div>
                </div>
                <select
                  value={currentVehicle.id}
                  onChange={(e) => {
                    const found = MOCK_VEHICLES.find((v) => v.id === e.target.value);
                    if (found) {
                      setCurrentVehicle(found);
                      setActiveVehicle(found);
                    }
                  }}
                  className="bg-white border border-slate-200 rounded-xl px-2.5 py-1 text-xs font-extrabold text-slate-800 focus:outline-none focus:border-slate-400"
                >
                  {MOCK_VEHICLES.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.nickname || `${v.evModel?.make} ${v.evModel?.model}`}
                    </option>
                  ))}
                </select>
              </div>

              {/* From / To Location Fields */}
              <div className="relative space-y-2 bg-slate-50 border border-slate-200 rounded-2xl p-3">
                {/* Swap button floating */}
                <button
                  onClick={handleSwap}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white border border-slate-200 shadow hover:border-emerald-500 hover:text-emerald-600 transition-all flex items-center justify-center z-10"
                  title="Swap From and To"
                >
                  <ArrowUpDown className="w-3.5 h-3.5 text-slate-700" />
                </button>

                {/* From Field */}
                <div className="relative">
                  <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1 tracking-wider">Starting Location</label>
                  <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus-within:border-emerald-500 transition-all">
                    <Navigation className="w-4 h-4 text-emerald-600 shrink-0" />
                    <input
                      type="text"
                      value={fromQuery}
                      onChange={(e) => {
                        setFromQuery(e.target.value);
                        setActiveSearchField('from');
                      }}
                      onFocus={() => setActiveSearchField('from')}
                      placeholder="Enter start location or 'Current Location'"
                      className="w-full text-xs font-extrabold text-slate-900 bg-transparent focus:outline-none pr-6 placeholder:text-slate-400"
                    />
                    {searchingFrom && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />}
                  </div>

                  {/* From Search Dropdown */}
                  {activeSearchField === 'from' && fromResults.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden max-h-48 overflow-y-auto">
                      {fromResults.map((place) => (
                        <button
                          key={place.id}
                          onClick={() => {
                            setFromPlace(place);
                            setFromQuery(place.label);
                            setActiveSearchField(null);
                          }}
                          className="w-full text-left px-3 py-2.5 hover:bg-emerald-50 border-b border-slate-100 last:border-0 flex items-start gap-2 text-xs"
                        >
                          <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <div className="font-bold text-slate-900">{place.label}</div>
                            <div className="text-[10px] text-slate-500 line-clamp-1">{place.address}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* To Field */}
                <div className="relative">
                  <label className="block text-[10px] font-extrabold uppercase text-slate-500 mb-1 tracking-wider">Destination</label>
                  <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2.5 focus-within:border-emerald-500 transition-all">
                    <MapPin className="w-4 h-4 text-red-500 shrink-0" />
                    <input
                      type="text"
                      value={toQuery}
                      onChange={(e) => {
                        setToQuery(e.target.value);
                        setActiveSearchField('to');
                      }}
                      onFocus={() => setActiveSearchField('to')}
                      placeholder="e.g. Mysuru Palace, Goa, Chennai"
                      className="w-full text-xs font-extrabold text-slate-900 bg-transparent focus:outline-none pr-6 placeholder:text-slate-400"
                    />
                    {searchingTo && <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-400" />}
                  </div>

                  {/* To Search Dropdown */}
                  {activeSearchField === 'to' && toResults.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden max-h-48 overflow-y-auto">
                      {toResults.map((place) => (
                        <button
                          key={place.id}
                          onClick={() => {
                            setToPlace(place);
                            setToQuery(place.label);
                            setActiveSearchField(null);
                          }}
                          className="w-full text-left px-3 py-2.5 hover:bg-emerald-50 border-b border-slate-100 last:border-0 flex items-start gap-2 text-xs"
                        >
                          <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0 mt-0.5" />
                          <div>
                            <div className="font-bold text-slate-900">{place.label}</div>
                            <div className="text-[10px] text-slate-500 line-clamp-1">{place.address}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Battery Charge % Slider */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex justify-between items-center text-xs font-extrabold">
                  <span className="text-slate-700 flex items-center gap-1.5">
                    <Battery className="w-4 h-4 text-emerald-600" /> Current Battery Level
                  </span>
                  <span className="text-emerald-600 font-black text-sm">{batteryPercent}%</span>
                </div>
                <input
                  type="range"
                  min={5}
                  max={100}
                  step={5}
                  value={batteryPercent}
                  onChange={(e) => setBatteryPercent(Number(e.target.value))}
                  className="w-full accent-emerald-500 h-2 bg-slate-200 rounded-lg cursor-pointer"
                />
              </div>

              {/* Calculate CTA Button - Vibrant high-contrast emerald */}
              <button
                onClick={handleCalculateRoute}
                disabled={calculating || (!toQuery && !toPlace)}
                className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-black text-xs shadow-xl flex items-center justify-center gap-2 transition-all uppercase tracking-wider active:scale-[0.99]"
              >
                {calculating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Fetching OCM Live Stations & Route…
                  </>
                ) : (
                  <>
                    Calculate Route & Stops <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              {/* Computed Route Summary & Station Breakdown */}
              {computedPlan && (
                <div className="pt-2 space-y-3 border-t border-slate-200">
                  <div className="grid grid-cols-4 gap-2 text-center bg-slate-900 text-white rounded-2xl p-3 shadow-md">
                    <div>
                      <div className="text-[10px] text-slate-400 font-extrabold uppercase">Distance</div>
                      <div className="text-xs font-black text-emerald-400">{computedPlan.totalDistanceKm} km</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-extrabold uppercase">Drive Time</div>
                      <div className="text-xs font-black text-white">{computedPlan.totalDriveTimeMin}m</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-extrabold uppercase">Charge Time</div>
                      <div className="text-xs font-black text-emerald-400">{computedPlan.totalChargeTimeMin}m</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400 font-extrabold uppercase">Est Cost</div>
                      <div className="text-xs font-black text-emerald-400">₹{computedPlan.totalCost}</div>
                    </div>
                  </div>

                  {/* OCM Charging Stops List */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
                      Recommended OCM Stops ({computedPlan.stops.length})
                    </h3>

                    {computedPlan.stops.length === 0 ? (
                      <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-extrabold text-emerald-900 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" /> Direct Trip — No charging stops required!
                      </div>
                    ) : (
                      computedPlan.stops.map((stop, idx) => (
                        <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                              <Zap className="w-3.5 h-3.5 text-emerald-600 fill-current" /> Stop {idx + 1}: {stop.station.name}
                            </span>
                            <span className="text-[10px] font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                              {stop.station.confidenceScore}% Reliable
                            </span>
                          </div>

                          <div className="text-[11px] text-slate-600 font-bold flex items-center gap-3">
                            <span>{stop.station.operator}</span>
                            <span>·</span>
                            <span>Charge to {stop.targetChargePercent}% ({stop.chargeTimeMin} min)</span>
                          </div>

                          <div className="text-[10px] text-slate-500 font-extrabold flex items-center justify-between pt-1">
                            <span>Est Price: ₹{stop.cost}</span>
                            <span>{stop.station.availablePorts}/{stop.station.totalPorts} ports available</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Start Journey CTA - High contrast black CTA */}
                  <button
                    onClick={() => onStartJourney(computedPlan)}
                    className="w-full py-4 rounded-2xl bg-black hover:bg-slate-900 text-emerald-400 font-black text-xs shadow-2xl flex items-center justify-center gap-2 transition-all uppercase tracking-wider"
                  >
                    <Navigation className="w-4 h-4 text-emerald-400 fill-current" /> Start Journey
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
