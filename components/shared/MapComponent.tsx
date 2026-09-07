'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { cn } from '@/lib/utils';
import type { ChargingStation, LatLng } from '@/types';
import { Zap } from 'lucide-react';

interface MapComponentProps {
  stations?: ChargingStation[];
  center?: LatLng;
  zoom?: number;
  height?: string;
  className?: string;
  onStationClick?: (station: ChargingStation) => void;
  route?: LatLng[];
  userLocation?: LatLng;
  selectedStationId?: string;
}

const CONFIDENCE_COLORS: Record<string, string> = {
  high: '#39E5A0',
  medium: '#F59E0B',
  low: '#E85D4C',
  offline: '#6B7280',
};

// Bengaluru center as default
const DEFAULT_CENTER: LatLng = { lat: 12.9716, lng: 77.5946 };

export function MapComponent({
  stations = [],
  center = DEFAULT_CENTER,
  zoom = 12,
  height = '100%',
  className,
  onStationClick,
  route,
  userLocation,
  selectedStationId,
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
      center: [center?.lng ?? 77.5946, center?.lat ?? 12.9716],
      zoom,
    });

    map.on('load', () => setMapLoaded(true));
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, [MapLibre]);

  // Add station markers
  useEffect(() => {
    if (!mapLoaded || !mapInstanceRef.current || !MapLibre) return;
    const map = mapInstanceRef.current;

    // Clear existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    stations.forEach((station) => {
      const color =
        station.status === 'offline'
          ? CONFIDENCE_COLORS.offline
          : CONFIDENCE_COLORS[station.confidenceLevel] ?? CONFIDENCE_COLORS.medium;

      const isSelected = station.id === selectedStationId;

      const el = document.createElement('div');
      el.style.cssText = `
        width: ${isSelected ? 44 : 36}px;
        height: ${isSelected ? 44 : 36}px;
        border-radius: 50%;
        background: ${color};
        border: 3px solid ${isSelected ? '#fff' : color + '50'};
        box-shadow: 0 0 ${isSelected ? 20 : 10}px ${color}70;
        display: flex; align-items: center; justify-content: center;
        cursor: pointer;
        transition: all 0.2s ease;
        position: relative;
      `;
      el.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="${station.status === 'offline' ? '#9CA3AF' : '#0B1F3A'}" xmlns="http://www.w3.org/2000/svg"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>`;
      el.title = station.name;

      el.addEventListener('click', () => onStationClick?.(station));
      el.addEventListener('mouseenter', () => { el.style.transform = 'scale(1.15)'; });
      el.addEventListener('mouseleave', () => { el.style.transform = 'scale(1)'; });

      const marker = new MapLibre.Marker({ element: el })
        .setLngLat([station.coordinates.lng, station.coordinates.lat])
        .setPopup(
          new MapLibre.Popup({ offset: 20, closeButton: false, className: 'ca-popup' })
            .setHTML(
              `<div style="background:#132236;border:1px solid #1E3352;border-radius:12px;padding:10px 14px;color:#fff;min-width:160px">
                <div style="font-weight:600;font-size:13px;margin-bottom:4px">${station.name}</div>
                <div style="font-size:11px;color:${color};font-weight:700">${station.confidenceScore}% reliable</div>
                <div style="font-size:11px;color:rgba(255,255,255,0.5);margin-top:2px">${station.availablePorts}/${station.totalPorts} ports free</div>
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
        background: #1C7293; border: 3px solid #fff;
        box-shadow: 0 0 0 6px rgba(28,114,147,0.25);
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

    if (map.getSource('route')) {
      (map.getSource('route') as any).setData({
        type: 'Feature',
        geometry: { type: 'LineString', coordinates: route.map((p) => [p.lng, p.lat]) },
        properties: {},
      });
    } else {
      map.addSource('route', {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: { type: 'LineString', coordinates: route.map((p) => [p.lng, p.lat]) },
          properties: {},
        },
      });
      map.addLayer({
        id: 'route-line',
        type: 'line',
        source: 'route',
        paint: {
          'line-color': '#39E5A0',
          'line-width': 4,
          'line-opacity': 0.85,
          'line-dasharray': [2, 1],
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
      {!mapLoaded && (
        <div className="absolute inset-0 bg-navy-900 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-full border-2 border-mint-400 border-t-transparent animate-spin" />
            <span className="text-white/50 text-sm">Loading map…</span>
          </div>
        </div>
      )}
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

  // Normalize coordinates to SVG space (800x500 canvas)
  // Using Bengaluru region bounds
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
      <svg
        viewBox="0 0 800 500"
        className="w-full h-full"
        style={{ background: '#F8F9FA' }}
      >
        {/* Grid lines */}
        {[0, 1, 2, 3, 4].map((i) => (
          <line key={`h${i}`} x1="0" y1={i * 125} x2="800" y2={i * 125} stroke="#E5E7EB" strokeWidth="1" />
        ))}
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <line key={`v${i}`} x1={i * 133} y1="0" x2={i * 133} y2="500" stroke="#E5E7EB" strokeWidth="1" />
        ))}

        {/* Road-like lines */}
        <path d="M 100,250 Q 300,100 500,200 T 750,180" stroke="#D1D5DB" strokeWidth="4" fill="none" />
        <path d="M 50,350 Q 200,300 400,350 T 780,320" stroke="#D1D5DB" strokeWidth="3" fill="none" />
        <path d="M 400,50 L 380,450" stroke="#D1D5DB" strokeWidth="3" fill="none" />

        {/* Station pins */}
        {stations?.map((station) => {
          const { x, y } = toSVG(station.coordinates.lat, station.coordinates.lng);
          const color =
            station.status === 'offline'
              ? '#9CA3AF'
              : station.confidenceLevel === 'high'
              ? '#00C853'
              : station.confidenceLevel === 'medium'
              ? '#F59E0B'
              : '#E85D4C';
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
              {isHovered && (
                <circle r="22" fill={color} opacity="0.2" />
              )}
              <circle r={isHovered ? 14 : 11} fill={color} opacity="0.3" />
              <circle r={isHovered ? 10 : 8} fill={color} />
              {/* Zap icon simplified */}
              <path d="M0,-4 L-3,1 L0,1 L0,4 L3,-1 L0,-1 Z" fill="#FFFFFF" />
              {isHovered && (
                <foreignObject x={12} y={-20} width={160} height={50}>
                  <div
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #E5E5E5',
                      borderRadius: 8,
                      padding: '4px 8px',
                      fontSize: 11,
                      color: '#000000',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <div style={{ fontWeight: 700 }}>{station.name}</div>
                    <div style={{ color, fontWeight: 700 }}>{station.confidenceScore}% reliable</div>
                  </div>
                </foreignObject>
              )}
            </g>
          );
        })}

        {/* Attribution */}
        <text x="790" y="495" textAnchor="end" fontSize="9" fill="#ffffff30">Illustrative map</text>
      </svg>
    </div>
  );
}
