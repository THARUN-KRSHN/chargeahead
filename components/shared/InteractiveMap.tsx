'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import type { ChargingStation, LatLng } from '@/types';

interface InteractiveMapProps {
  center?: LatLng;
  zoom?: number;
  stations?: ChargingStation[];
  routeGeometry?: LatLng[];
  origin?: LatLng;
  destination?: LatLng;
  activeVehiclePos?: LatLng;
  onStationClick?: (station: ChargingStation) => void;
  className?: string;
}

const DEFAULT_CENTER: LatLng = { lat: 12.9716, lng: 77.5946 };

// Draw or update the route layers — called after map is ready
function upsertRouteLayer(map: any, routeGeometry: LatLng[]) {
  const coords = routeGeometry.map((p) => [p.lng, p.lat]);
  const geojson: any = {
    type: 'Feature',
    geometry: { type: 'LineString', coordinates: coords },
    properties: {},
  };

  if (map.getSource('route-source')) {
    (map.getSource('route-source') as any).setData(geojson);
    return;
  }

  map.addSource('route-source', { type: 'geojson', data: geojson });

  // White outer glow
  map.addLayer({
    id: 'route-glow',
    type: 'line',
    source: 'route-source',
    layout: { 'line-join': 'round', 'line-cap': 'round' },
    paint: { 'line-color': '#FFFFFF', 'line-width': 18, 'line-opacity': 0.35 },
  });

  // Dark navy casing
  map.addLayer({
    id: 'route-casing',
    type: 'line',
    source: 'route-source',
    layout: { 'line-join': 'round', 'line-cap': 'round' },
    paint: { 'line-color': '#0A0F1E', 'line-width': 13, 'line-opacity': 1 },
  });

  // Bright neon green core
  map.addLayer({
    id: 'route-line',
    type: 'line',
    source: 'route-source',
    layout: { 'line-join': 'round', 'line-cap': 'round' },
    paint: { 'line-color': '#00FF88', 'line-width': 7, 'line-opacity': 1 },
  });
}

function removeRouteLayer(map: any) {
  ['route-line', 'route-casing', 'route-glow'].forEach((id) => {
    if (map.getLayer(id)) map.removeLayer(id);
  });
  if (map.getSource('route-source')) map.removeSource('route-source');
}

export function InteractiveMap({
  center = DEFAULT_CENTER,
  zoom = 12,
  stations = [],
  routeGeometry = [],
  origin,
  destination,
  activeVehiclePos,
  onStationClick,
  className = '',
}: InteractiveMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [MapLibreModule, setMapLibreModule] = useState<any>(null);

  // Stable ref for latest onStationClick
  const onStationClickRef = useRef(onStationClick);
  useEffect(() => { onStationClickRef.current = onStationClick; }, [onStationClick]);

  // Load MapLibre GL lazily (client-side only)
  useEffect(() => {
    import('maplibre-gl')
      .then((ml) => setMapLibreModule(ml))
      .catch((err) => console.error('[MapLibre] Failed to load:', err));
  }, []);

  // Initialize the map once MapLibre is ready
  useEffect(() => {
    if (!MapLibreModule || !mapRef.current || mapInstanceRef.current) return;

    const map = new MapLibreModule.Map({
      container: mapRef.current,
      style: {
        version: 8,
        glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
        sources: {
          osm: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors',
          },
        },
        layers: [{ id: 'osm-bg', type: 'raster', source: 'osm' }],
      },
      center: [center?.lng ?? DEFAULT_CENTER.lng, center?.lat ?? DEFAULT_CENTER.lat],
      zoom,
      attributionControl: false,
    });

    map.on('load', () => {
      setMapLoaded(true);
      setTimeout(() => map.resize(), 100);
    });

    mapInstanceRef.current = map;
    return () => {
      map.remove();
      mapInstanceRef.current = null;
      setMapLoaded(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [MapLibreModule]);

  // ----- Route layer -----
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (!routeGeometry || routeGeometry.length < 2) {
      removeRouteLayer(map);
      return;
    }

    upsertRouteLayer(map, routeGeometry);
  }, [mapLoaded, routeGeometry]);

  // ----- Camera bounds -----
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current || !MapLibreModule) return;
    const map = mapInstanceRef.current;
    map.resize();

    const points: LatLng[] = [];
    if (routeGeometry && routeGeometry.length > 1) {
      // Sample every 10th point to compute bounds quickly
      routeGeometry.filter((_, i) => i % 10 === 0).forEach((p) => points.push(p));
      if (points.length < 2) points.push(...routeGeometry.slice(0, 2));
    } else {
      if (origin) points.push(origin);
      if (destination) points.push(destination);
    }

    if (points.length >= 2) {
      const bounds = new MapLibreModule.LngLatBounds();
      points.forEach((p) => bounds.extend([p.lng, p.lat]));
      map.fitBounds(bounds, {
        padding: { top: 80, bottom: 80, left: 460, right: 80 },
        maxZoom: 14,
        duration: 1000,
      });
    } else if (origin) {
      map.flyTo({ center: [origin.lng, origin.lat], zoom: 13, duration: 800 });
    }
  }, [mapLoaded, origin, destination, routeGeometry, MapLibreModule]);

  // ----- Markers (OCM stations, origin, destination, vehicle) -----
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current || !MapLibreModule) return;
    const map = mapInstanceRef.current;

    // Remove all previous markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Helper: add marker
    const addMarker = (el: HTMLElement, lngLat: [number, number]) => {
      const m = new MapLibreModule.Marker({ element: el }).setLngLat(lngLat).addTo(map);
      markersRef.current.push(m);
    };

    // Origin pin
    if (origin) {
      const el = document.createElement('div');
      el.style.cssText = `
        width:44px;height:44px;border-radius:50%;
        background:#10B981;border:4px solid #fff;
        box-shadow:0 0 0 3px #10B981,0 6px 20px rgba(0,0,0,0.5);
        display:flex;align-items:center;justify-content:center;
        position:relative;z-index:30;
      `;
      el.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0F172A" stroke-width="3"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4" fill="#0F172A"/></svg>`;
      addMarker(el, [origin.lng, origin.lat]);
    }

    // Destination pin
    if (destination) {
      const el = document.createElement('div');
      el.style.cssText = `
        width:44px;height:44px;border-radius:50%;
        background:#EF4444;border:4px solid #fff;
        box-shadow:0 0 0 3px #EF4444,0 6px 20px rgba(0,0,0,0.5);
        display:flex;align-items:center;justify-content:center;
        position:relative;z-index:30;
      `;
      el.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="#fff" stroke="#fff" stroke-width="1"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>`;
      addMarker(el, [destination.lng, destination.lat]);
    }

    // OCM station pins
    stations.forEach((station) => {
      if (!station?.coordinates?.lat || !station?.coordinates?.lng) return;

      const score = station.confidenceScore ?? 60;
      const isHigh = score >= 80;
      const isMed = score >= 60;
      const dotColor = isHigh ? '#10B981' : isMed ? '#F59E0B' : '#EF4444';
      const borderColor = isHigh ? '#059669' : isMed ? '#D97706' : '#DC2626';

      const el = document.createElement('div');
      el.style.cssText = `
        width:40px;height:40px;border-radius:50%;
        background:#0F172A;border:3px solid ${dotColor};
        box-shadow:0 2px 12px rgba(0,0,0,0.5),0 0 0 2px ${borderColor}33;
        display:flex;align-items:center;justify-content:center;
        cursor:pointer;transition:transform 0.18s cubic-bezier(.34,1.56,.64,1);
        position:relative;z-index:20;
      `;
      el.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="${dotColor}"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>`;
      el.addEventListener('mouseenter', () => { el.style.transform = 'scale(1.25)'; });
      el.addEventListener('mouseleave', () => { el.style.transform = 'scale(1)'; });
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        onStationClickRef.current?.(station);
      });

      addMarker(el, [station.coordinates.lng, station.coordinates.lat]);
    });

    // Active vehicle
    if (activeVehiclePos) {
      const el = document.createElement('div');
      el.style.cssText = `
        width:46px;height:46px;border-radius:50%;
        background:#2563EB;border:4px solid #fff;
        box-shadow:0 0 0 4px rgba(37,99,235,0.4),0 6px 20px rgba(0,0,0,0.5);
        display:flex;align-items:center;justify-content:center;
        animation:pulse 2s infinite;position:relative;z-index:40;
      `;
      el.innerHTML = `<svg width="22" height="22" viewBox="0 0 24 24" fill="#fff"><path d="M12 2L19 21L12 17L5 21L12 2Z"/></svg>`;
      addMarker(el, [activeVehiclePos.lng, activeVehiclePos.lat]);
    }
  }, [mapLoaded, origin, destination, stations, activeVehiclePos, MapLibreModule]);

  return (
    <div className={`relative w-full h-full ${className}`}>
      <div ref={mapRef} className="w-full h-full" />

      {/* Loading overlay */}
      {!mapLoaded && (
        <div className="absolute inset-0 bg-[#0F172A] flex items-center justify-center z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-full border-[3px] border-[#10B981] border-t-transparent animate-spin" />
            <span className="text-sm font-semibold text-slate-400">Loading Map & OCM Live Data…</span>
          </div>
        </div>
      )}

      {/* Map legend */}
      {mapLoaded && (
        <div className="absolute bottom-4 right-4 bg-white/95 backdrop-blur-md border border-slate-200 rounded-2xl px-3.5 py-2.5 flex flex-col gap-1.5 z-20 shadow-2xl">
          <div className="flex items-center gap-2 text-[10px] text-slate-800 font-extrabold">
            <span className="w-3 h-3 rounded-full bg-[#10B981] inline-block shadow-sm" /> High Reliability
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-800 font-extrabold">
            <span className="w-3 h-3 rounded-full bg-[#F59E0B] inline-block shadow-sm" /> Medium Reliability
          </div>
          <div className="flex items-center gap-2 text-[10px] text-slate-800 font-extrabold">
            <span className="w-3 h-3 rounded-full bg-[#EF4444] inline-block shadow-sm" /> Low Reliability
          </div>
          {routeGeometry && routeGeometry.length > 1 && (
            <div className="flex items-center gap-2 text-[10px] text-slate-900 font-black mt-0.5 pt-1.5 border-t border-slate-200">
              <span className="w-8 h-2 rounded-full bg-[#00FF88] border border-slate-800 inline-block" /> EV Route
            </div>
          )}
        </div>
      )}
    </div>
  );
}
