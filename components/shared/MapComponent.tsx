'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import type { ChargingStation, LatLng } from '@/types';

interface MapComponentProps {
  stations?: ChargingStation[];
  center?: LatLng | [number, number];
  zoom?: number;
  height?: string;
  className?: string;
  onStationClick?: (station: ChargingStation) => void;
  route?: LatLng[];
  userLocation?: LatLng;
  selectedStationId?: string;
  showLegend?: boolean;
}

// Status → color (used on both map and legend)
export const STATUS_COLORS: Record<string, string> = {
  available: '#22C55E',
  busy:      '#F59E0B',
  offline:   '#6B7280',
  unknown:   '#94A3B8',
};

const SPONSORED_RING = '#F59E0B'; // gold ring for sponsored stations

// Bengaluru center as default
const DEFAULT_CENTER: LatLng = { lat: 12.9716, lng: 77.5946 };

function resolveCenter(center?: LatLng | [number, number]): [number, number] {
  if (!center) return [DEFAULT_CENTER.lng, DEFAULT_CENTER.lat];
  if (Array.isArray(center)) return center;
  return [center.lng, center.lat];
}

export function MapComponent({
  stations = [],
  center,
  zoom = 12,
  height = '100%',
  className,
  onStationClick,
  route,
  userLocation,
  selectedStationId,
  showLegend = true,
}: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [MapLibre, setMapLibre] = useState<any>(null);

  // Lazy load MapLibre
  useEffect(() => {
    import('maplibre-gl').then((ml) => {
      setMapLibre(ml);
    }).catch(() => {
      // MapLibre not available — SVG fallback will render
    });
  }, []);

  useEffect(() => {
    if (!MapLibre || !mapRef.current || mapInstanceRef.current) return;

    const [lng, lat] = resolveCenter(center);

    const map = new MapLibre.Map({
      container: mapRef.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors',
          },
        },
        layers: [{ id: 'osm', type: 'raster', source: 'osm' }],
      },
      center: [lng, lat],
      zoom,
    });

    map.on('load', () => setMapLoaded(true));
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [MapLibre]);

  // Fly to new center when prop changes (after map is loaded)
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current) return;
    const [lng, lat] = resolveCenter(center);
    mapInstanceRef.current.flyTo({ center: [lng, lat], zoom, duration: 800 });
  }, [center, zoom, mapLoaded]);

  // Add station markers
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current || !MapLibre) return;
    const map = mapInstanceRef.current;

    // Clear existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    stations.forEach((station) => {
      const color = STATUS_COLORS[station.status] ?? STATUS_COLORS.unknown;
      const isSelected = station.id === selectedStationId;
      const isSponsored = station.isSponsored;

      const size = isSelected ? 44 : 36;
      const el = document.createElement('div');
      el.style.cssText = `
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background: ${color};
        border: ${isSponsored ? `3px solid ${SPONSORED_RING}` : `3px solid ${isSelected ? '#fff' : color + '50'}`};
        box-shadow: ${isSponsored
          ? `0 0 0 3px ${SPONSORED_RING}40, 0 0 ${isSelected ? 24 : 14}px ${color}80`
          : `0 0 ${isSelected ? 20 : 10}px ${color}70`};
        display: flex; align-items: center; justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
        position: relative;
        ${station.status === 'busy' ? 'animation: pulse-busy 2s infinite;' : ''}
      `;
      el.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="${station.status === 'offline' ? '#9CA3AF' : '#0B1F3A'}" xmlns="http://www.w3.org/2000/svg"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>`;
      if (isSponsored) {
        const star = document.createElement('div');
        star.style.cssText = 'position:absolute;top:-8px;right:-8px;background:#F59E0B;border-radius:50%;width:16px;height:16px;display:flex;align-items:center;justify-content:center;font-size:9px;border:1.5px solid #fff;';
        star.textContent = '★';
        el.appendChild(star);
      }
      el.title = station.name;
      el.addEventListener('click', () => onStationClick?.(station));
      el.addEventListener('mouseenter', () => { el.style.transform = 'scale(1.15)'; });
      el.addEventListener('mouseleave', () => { el.style.transform = 'scale(1)'; });

      const statusLabel = station.status.charAt(0).toUpperCase() + station.status.slice(1);
      const portsText = station.availablePorts > 0 ? `${station.availablePorts}/${station.totalPorts} ports free` : 'No ports free';

      const marker = new MapLibre.Marker({ element: el })
        .setLngLat([station.coordinates.lng, station.coordinates.lat])
        .setPopup(
          new MapLibre.Popup({ offset: 20, closeButton: false, className: 'ca-popup' })
            .setHTML(
              `<div style="background:#132236;border:1px solid #1E3352;border-radius:12px;padding:10px 14px;color:#fff;min-width:160px">
                <div style="font-weight:600;font-size:13px;margin-bottom:4px">${station.name}</div>
                ${isSponsored ? '<div style="font-size:10px;color:#F59E0B;font-weight:700;margin-bottom:3px">★ Sponsored</div>' : ''}
                <div style="font-size:11px;color:${color};font-weight:700">${statusLabel}</div>
                <div style="font-size:11px;color:rgba(255,255,255,0.6);margin-top:2px">${portsText}</div>
                <div style="font-size:11px;color:rgba(255,255,255,0.5);margin-top:2px">₹${station.pricePerKwh}/kWh · ${station.confidenceScore}% reliable</div>
                ${station.distance !== undefined ? `<div style="font-size:10px;color:rgba(255,255,255,0.4);margin-top:2px">${station.distance} km · ~${station.etaMinutes} min</div>` : ''}
              </div>`,
            )
        )
        .addTo(map);

      markersRef.current.push(marker);
    });

    // User location marker
    if (userLocation) {
      const userEl = document.createElement('div');
      userEl.style.cssText = `
        width: 16px; height: 16px; border-radius: 50%;
        background: #3B82F6; border: 3px solid #fff;
        box-shadow: 0 0 0 6px rgba(59,130,246,0.25);
      `;
      const userMarker = new MapLibre.Marker({ element: userEl })
        .setLngLat([userLocation.lng, userLocation.lat])
        .addTo(map);
      markersRef.current.push(userMarker);
    }
  }, [mapLoaded, stations, selectedStationId, userLocation, onStationClick, MapLibre]);

  // Draw route
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current || !route || route.length < 2) return;
    const map = mapInstanceRef.current;

    const geojsonData = {
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: route.map((p) => [p.lng, p.lat]) },
      properties: {},
    };

    if (map.getSource('route')) {
      (map.getSource('route') as any).setData(geojsonData);
    } else {
      map.addSource('route', { type: 'geojson', data: geojsonData });
      map.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route',
        paint: {
          'line-color': '#3B82F6',
          'line-width': 4,
          'line-opacity': 0.85,
        },
      });
    }
  }, [mapLoaded, route]);

  // If MapLibre failed to load, render SVG fallback
  if (!MapLibre) {
    return <SVGMapFallback stations={stations} className={className} height={height} onStationClick={onStationClick} />;
  }

  return (
    <div className={cn('relative overflow-hidden', className)} style={{ height }}>
      <div ref={mapRef} style={{ width: '100%', height: '100%' }} />

      {/* Loading state */}
      {!mapLoaded && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-black border-t-transparent animate-spin" />
            <span className="text-gray-500 text-sm font-medium">Loading map…</span>
          </div>
        </div>
      )}

      {/* Map Legend */}
      {showLegend && mapLoaded && (
        <div className="absolute bottom-6 left-3 z-10 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl shadow-md px-3 py-2 flex flex-col gap-1.5">
          {Object.entries({ available: 'Available', busy: 'Busy', offline: 'Offline' }).map(([status, label]) => (
            <div key={status} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full shrink-0" style={{ background: STATUS_COLORS[status] }} />
              <span className="text-[10px] font-bold text-gray-700">{label}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5 pt-0.5 border-t border-gray-100">
            <div className="w-3 h-3 rounded-full shrink-0 ring-2 ring-amber-400 bg-green-500" />
            <span className="text-[10px] font-bold text-amber-600">Sponsored</span>
          </div>
        </div>
      )}

      {/* Pulse keyframe */}
      <style>{`
        @keyframes pulse-busy {
          0%, 100% { box-shadow: 0 0 8px ${STATUS_COLORS.busy}60; }
          50% { box-shadow: 0 0 18px ${STATUS_COLORS.busy}90; }
        }
      `}</style>
    </div>
  );
}

// ---- SVG Fallback Map ----

function SVGMapFallback({
  stations,
  className,
  height,
  onStationClick,
}: Pick<MapComponentProps, 'stations' | 'className' | 'height' | 'onStationClick'>) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const validLats = stations?.map((s) => s.coordinates?.lat).filter((lat): lat is number => typeof lat === 'number' && !isNaN(lat)) ?? [];
  const validLngs = stations?.map((s) => s.coordinates?.lng).filter((lng): lng is number => typeof lng === 'number' && !isNaN(lng)) ?? [];

  const lats = validLats.length > 0 ? validLats : [12.8, 13.1];
  const lngs = validLngs.length > 0 ? validLngs : [77.5, 77.8];

  const minLat = Math.min(...lats) - 0.05;
  const maxLat = Math.max(...lats) + 0.05;
  const minLng = Math.min(...lngs) - 0.05;
  const maxLng = Math.max(...lngs) + 0.05;

  const toSVG = (lat: number, lng: number) => {
    const latSpan = maxLat - minLat || 0.1;
    const lngSpan = maxLng - minLng || 0.1;
    return {
      x: Math.max(10, Math.min(790, ((lng - minLng) / lngSpan) * 760 + 20)),
      y: Math.max(10, Math.min(490, ((maxLat - lat) / latSpan) * 460 + 20)),
    };
  };

  return (
    <div className={cn('relative overflow-hidden rounded-2xl', className)} style={{ height }}>
      <svg viewBox="0 0 800 500" className="w-full h-full" style={{ background: '#F8F9FA' }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <line key={`h${i}`} x1="0" y1={i * 125} x2="800" y2={i * 125} stroke="#E5E7EB" strokeWidth="1" />
        ))}
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <line key={`v${i}`} x1={i * 133} y1="0" x2={i * 133} y2="500" stroke="#E5E7EB" strokeWidth="1" />
        ))}
        <path d="M 100,250 Q 300,100 500,200 T 750,180" stroke="#D1D5DB" strokeWidth="4" fill="none" />
        <path d="M 50,350 Q 200,300 400,350 T 780,320" stroke="#D1D5DB" strokeWidth="3" fill="none" />

        {stations?.map((station) => {
          const { x, y } = toSVG(station.coordinates.lat, station.coordinates.lng);
          const color = STATUS_COLORS[station.status] ?? STATUS_COLORS.unknown;
          const isHovered = hoveredId === station.id;
          return (
            <g
              key={station.id}
              transform={`translate(${x}, ${y})`}
              style={{ cursor: 'pointer' }}
              onClick={() => onStationClick?.(station)}
              onMouseEnter={() => setHoveredId(station.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              {isHovered && <circle r="22" fill={color} opacity="0.2" />}
              <circle r={isHovered ? 14 : 11} fill={color} opacity="0.3" />
              <circle r={isHovered ? 10 : 8} fill={color} />
              <path d="M0,-4 L-3,1 L0,1 L0,4 L3,-1 L0,-1 Z" fill="#FFFFFF" />
              {station.isSponsored && <text x="6" y="-6" fontSize="10" fill="#F59E0B">★</text>}
              {isHovered && (
                <foreignObject x={12} y={-20} width={160} height={60}>
                  <div style={{ background: '#FFFFFF', border: '1px solid #E5E5E5', borderRadius: 8, padding: '4px 8px', fontSize: 11, color: '#000000', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', whiteSpace: 'nowrap' }}>
                    <div style={{ fontWeight: 700 }}>{station.name}</div>
                    <div style={{ color, fontWeight: 700 }}>{station.status}</div>
                    <div style={{ color: '#6B7280', fontSize: 10 }}>{station.availablePorts}/{station.totalPorts} ports</div>
                  </div>
                </foreignObject>
              )}
            </g>
          );
        })}
        <text x="790" y="495" textAnchor="end" fontSize="9" fill="#00000030">Illustrative map</text>
      </svg>
    </div>
  );
}
