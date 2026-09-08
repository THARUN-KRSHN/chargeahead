'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import * as maplibregl from 'maplibre-gl';
import type { ChargingStation, LatLng } from '@/types';
import { LocateFixed } from 'lucide-react';

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

let mapsInitialized = false;
function initGoogleMaps(apiKey: string) {
  if (!mapsInitialized && apiKey) {
    try {
      setOptions({ key: apiKey, v: 'weekly', libraries: ['places', 'geometry', 'marker'] });
      mapsInitialized = true;
    } catch (e) {
      console.warn('[Google Maps] Failed to initialize options:', e);
    }
  }
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
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const maplibreInstanceRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const vehicleMarkerRef = useRef<google.maps.Marker | null>(null);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';
  const [isReady, setIsReady] = useState(false);
  const [hasMapError, setHasMapError] = useState(false);

  // Catch Google Maps Auth Failure (ApiProjectMapError)
  useEffect(() => {
    const prevFailure = (window as any).gm_authFailure;
    (window as any).gm_authFailure = () => {
      console.warn('[Google Maps] ApiProjectMapError detected. Switching to MapLibre GL fallback engine.');
      setHasMapError(true);
      if (typeof prevFailure === 'function') prevFailure();
    };
    return () => {
      (window as any).gm_authFailure = prevFailure;
    };
  }, []);

  // Initialize Map (Google Maps or MapLibre GL Fallback)
  useEffect(() => {
    if (!mapRef.current) return;

    if (!apiKey || hasMapError) {
      // MapLibre GL Fallback Initialization
      if (maplibreInstanceRef.current) return;
      const targetCenter = activeVehiclePos || origin || center || DEFAULT_CENTER;

      try {
        const mlMap = new maplibregl.Map({
          container: mapRef.current,
          style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
          center: [targetCenter.lng, targetCenter.lat],
          zoom: zoom ?? 12,
        });

        maplibreInstanceRef.current = mlMap;
        setIsReady(true);

        mlMap.on('error', (e) => {
          console.warn('[MapLibre] Tile load warning:', e);
        });
      } catch (err) {
        console.error('[MapLibre Fallback] Map load error:', err);
        setIsReady(true);
      }

      return () => {
        if (maplibreInstanceRef.current) {
          maplibreInstanceRef.current.remove();
          maplibreInstanceRef.current = null;
        }
      };
    }

    // Google Maps Loader
    if (mapInstanceRef.current) return;
    initGoogleMaps(apiKey);

    importLibrary('maps')
      .then((mapsLib) => {
        if (!mapRef.current) return;

        const map = new mapsLib.Map(mapRef.current, {
          center: { lat: center?.lat ?? DEFAULT_CENTER.lat, lng: center?.lng ?? DEFAULT_CENTER.lng },
          zoom: zoom ?? 12,
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          styles: [
            { featureType: 'poi', elementType: 'labels', stylers: [{ visibility: 'off' }] },
            { featureType: 'transit', elementType: 'labels.icon', stylers: [{ visibility: 'off' }] },
          ],
        });

        mapInstanceRef.current = map;
        setIsReady(true);
      })
      .catch((err) => {
        console.warn('[Google Maps] Loader failed (ApiProjectMapError). Switching to MapLibre fallback:', err);
        setHasMapError(true);
      });

    return () => {
      if (polylineRef.current) polylineRef.current.setMap(null);
      if (vehicleMarkerRef.current) vehicleMarkerRef.current.setMap(null);
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];
      mapInstanceRef.current = null;
    };
  }, [hasMapError]);

  // Update center
  useEffect(() => {
    const target = activeVehiclePos || origin || center;
    if (!target) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.panTo({ lat: target.lat, lng: target.lng });
    } else if (maplibreInstanceRef.current) {
      maplibreInstanceRef.current.panTo([target.lng, target.lat]);
    }
  }, [isReady, center?.lat, center?.lng, activeVehiclePos?.lat, activeVehiclePos?.lng, origin?.lat, origin?.lng]);

  // Render Stations and Origin/Dest Markers
  useEffect(() => {
    if (!isReady) return;

    // Google Maps Markers
    if (mapInstanceRef.current) {
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];

      if (origin) {
        const origMarker = new google.maps.Marker({
          position: { lat: origin.lat, lng: origin.lng },
          map: mapInstanceRef.current,
          title: 'Start Location',
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            fillColor: '#10B981',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 3,
            scale: 8,
          },
        });
        markersRef.current.push(origMarker);
      }

      if (destination) {
        const destMarker = new google.maps.Marker({
          position: { lat: destination.lat, lng: destination.lng },
          map: mapInstanceRef.current,
          title: 'Destination',
          icon: {
            path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
            fillColor: '#EF4444',
            fillOpacity: 1,
            strokeColor: '#FFFFFF',
            strokeWeight: 2,
            scale: 6,
          },
        });
        markersRef.current.push(destMarker);
      }

      stations.forEach((station) => {
        if (!station.coordinates) return;

        const color =
          station.status === 'offline'
            ? '#9CA3AF'
            : station.confidenceLevel === 'high'
            ? '#00C853'
            : station.confidenceLevel === 'medium'
            ? '#F59E0B'
            : '#E85D4C';

        const evLightningPath = 'M13 2L3 14h9l-1 8 10-12h-9l1-8z';
        const marker = new google.maps.Marker({
          position: { lat: station.coordinates.lat, lng: station.coordinates.lng },
          map: mapInstanceRef.current!,
          title: station.name,
          icon: {
            path: evLightningPath,
            fillColor: color,
            fillOpacity: 1,
            strokeColor: '#000000',
            strokeWeight: 1.2,
            scale: 1.1,
            anchor: new google.maps.Point(12, 12),
          },
        });

        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="padding:6px; font-family:sans-serif; min-width:140px;">
              <div style="font-weight:800; font-size:13px; color:#000;">${station.name}</div>
              <div style="font-size:11px; color:${color}; font-weight:700; margin-top:2px;">${station.confidenceScore}% reliable</div>
              <div style="font-size:11px; color:#555; margin-top:2px;">${station.availablePorts}/${station.totalPorts} ports free</div>
            </div>
          `,
        });

        marker.addListener('click', () => {
          infoWindow.open(mapInstanceRef.current!, marker);
          onStationClick?.(station);
        });

        markersRef.current.push(marker);
      });
    }

    // MapLibre GL Fallback Markers
    if (maplibreInstanceRef.current) {
      const ml = maplibreInstanceRef.current;

      stations.forEach((station) => {
        if (!station.coordinates) return;
        const color =
          station.status === 'offline'
            ? '#9CA3AF'
            : station.confidenceLevel === 'high'
            ? '#00C853'
            : station.confidenceLevel === 'medium'
            ? '#F59E0B'
            : '#E85D4C';

        const el = document.createElement('div');
        el.className = 'w-7 h-7 rounded-full flex items-center justify-center shadow-lg border-2 border-slate-900 cursor-pointer font-black text-xs';
        el.style.backgroundColor = color;
        el.style.color = '#FFFFFF';
        el.innerHTML = '⚡';

        el.addEventListener('click', () => {
          onStationClick?.(station);
        });

        new maplibregl.Marker({ element: el })
          .setLngLat([station.coordinates.lng, station.coordinates.lat])
          .addTo(ml);
      });
    }
  }, [isReady, stations, origin, destination, onStationClick]);

  // Route Polyline
  useEffect(() => {
    if (!isReady) return;

    // Google Maps Polyline
    if (mapInstanceRef.current) {
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
        polylineRef.current = null;
      }

      if (routeGeometry && routeGeometry.length >= 2) {
        polylineRef.current = new google.maps.Polyline({
          path: routeGeometry.map((p) => ({ lat: p.lat, lng: p.lng })),
          geodesic: true,
          strokeColor: '#000000',
          strokeOpacity: 0.85,
          strokeWeight: 5,
          map: mapInstanceRef.current,
        });

        const bounds = new google.maps.LatLngBounds();
        routeGeometry.forEach((p) => bounds.extend({ lat: p.lat, lng: p.lng }));
        mapInstanceRef.current.fitBounds(bounds, { top: 50, bottom: 50, left: 50, right: 50 });
      }
    }

    // MapLibre GL Polyline
    if (maplibreInstanceRef.current && routeGeometry && routeGeometry.length >= 2) {
      const ml = maplibreInstanceRef.current;
      const coordinates = routeGeometry.map((p) => [p.lng, p.lat]);

      if (ml.getSource('fallback-route')) {
        (ml.getSource('fallback-route') as maplibregl.GeoJSONSource).setData({
          type: 'Feature',
          properties: {},
          geometry: { type: 'LineString', coordinates },
        });
      } else {
        ml.addSource('fallback-route', {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: { type: 'LineString', coordinates },
          },
        });

        ml.addLayer({
          id: 'fallback-route-line',
          type: 'line',
          source: 'fallback-route',
          paint: {
            'line-color': '#00FF88',
            'line-width': 6,
          },
        });
      }
    }
  }, [isReady, routeGeometry]);

  // Recenter handler
  const handleRecenter = useCallback(() => {
    const target = activeVehiclePos || origin || center || DEFAULT_CENTER;
    if (mapInstanceRef.current) {
      mapInstanceRef.current.panTo({ lat: target.lat, lng: target.lng });
      mapInstanceRef.current.setZoom(14);
    } else if (maplibreInstanceRef.current) {
      maplibreInstanceRef.current.panTo([target.lng, target.lat]);
      maplibreInstanceRef.current.setZoom(14);
    }
  }, [activeVehiclePos, origin, center]);

  return (
    <div className={`relative overflow-hidden w-full h-full ${className}`}>
      <div ref={mapRef} className="w-full h-full" />

      {/* Recenter Button */}
      {isReady && (
        <button
          type="button"
          onClick={handleRecenter}
          title="Recenter Map"
          className="absolute right-4 bottom-20 sm:bottom-6 z-30 bg-white border border-gray-200 text-black p-3 rounded-full shadow-lg hover:bg-gray-50 active:scale-95 transition-all flex items-center justify-center"
        >
          <LocateFixed className="w-5 h-5 text-black" />
        </button>
      )}

      {!isReady && (
        <div className="absolute inset-0 bg-gray-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-full border-2 border-black border-t-transparent animate-spin" />
            <span className="text-gray-500 text-xs font-bold">Loading Map…</span>
          </div>
        </div>
      )}
    </div>
  );
}

