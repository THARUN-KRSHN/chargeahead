'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import * as maplibregl from 'maplibre-gl';
import { cn } from '@/lib/utils';
import type { ChargingStation, LatLng } from '@/types';
import { LocateFixed, Map as MapIcon, Compass } from 'lucide-react';

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
  followUser?: boolean;
  autoFitRouteOnLoad?: boolean;
}

const CONFIDENCE_COLORS: Record<string, string> = {
  high: '#00C853',
  medium: '#F59E0B',
  low: '#E85D4C',
  offline: '#9CA3AF',
};

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

export function MapComponent({
  stations = [],
  center = DEFAULT_CENTER,
  zoom = 13,
  height = '100%',
  className,
  onStationClick,
  route,
  userLocation,
  selectedStationId,
  followUser = true,
  autoFitRouteOnLoad = true,
}: MapComponentProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const maplibreInstanceRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const userMarkerRef = useRef<google.maps.Marker | null>(null);

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '';
  const [isReady, setIsReady] = useState(false);
  const [hasMapError, setHasMapError] = useState(false);
  const [isFollowing, setIsFollowing] = useState(followUser);
  const routeFittedRef = useRef<string>('');

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
      if (maplibreInstanceRef.current) return;
      const initialCenter = userLocation || center || DEFAULT_CENTER;

      try {
        const mlMap = new maplibregl.Map({
          container: mapRef.current,
          style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
          center: [initialCenter.lng, initialCenter.lat],
          zoom: userLocation ? 15 : zoom ?? 13,
        });

        maplibreInstanceRef.current = mlMap;
        setIsReady(true);
      } catch (err) {
        console.error('[MapLibre Fallback] Load error:', err);
        setIsReady(true);
      }

      return () => {
        if (maplibreInstanceRef.current) {
          maplibreInstanceRef.current.remove();
          maplibreInstanceRef.current = null;
        }
      };
    }

    if (mapInstanceRef.current) return;
    initGoogleMaps(apiKey);

    importLibrary('maps')
      .then((mapsLib) => {
        if (!mapRef.current) return;

        const initialCenter = userLocation || center || DEFAULT_CENTER;

        const map = new mapsLib.Map(mapRef.current, {
          center: { lat: initialCenter.lat, lng: initialCenter.lng },
          zoom: userLocation ? 15 : zoom ?? 13,
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
      if (userMarkerRef.current) userMarkerRef.current.setMap(null);
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];
      mapInstanceRef.current = null;
    };
  }, [hasMapError]);

  // Update user position marker and smoothly pan map if following vehicle
  useEffect(() => {
    if (!isReady || !mapInstanceRef.current) return;

    if (userLocation) {
      const vehicleNavSymbol = {
        path: 'M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z', // Arrow/car nav symbol
        fillColor: '#2563EB',
        fillOpacity: 1,
        strokeColor: '#FFFFFF',
        strokeWeight: 2,
        scale: 1.5,
        anchor: new google.maps.Point(12, 12),
      };

      if (!userMarkerRef.current) {
        userMarkerRef.current = new google.maps.Marker({
          position: { lat: userLocation.lat, lng: userLocation.lng },
          map: mapInstanceRef.current,
          title: 'Your EV Location',
          icon: vehicleNavSymbol,
          zIndex: 999,
        });
      } else {
        userMarkerRef.current.setPosition({ lat: userLocation.lat, lng: userLocation.lng });
      }

      if (isFollowing) {
        mapInstanceRef.current.panTo({ lat: userLocation.lat, lng: userLocation.lng });
      }
    }
  }, [isReady, userLocation?.lat, userLocation?.lng, isFollowing]);

  // Render Station Markers
  useEffect(() => {
    if (!isReady || !mapInstanceRef.current) return;

    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    stations.forEach((station) => {
      if (!station.coordinates) return;

      const isSelected = station.id === selectedStationId;
      const color =
        station.status === 'offline'
          ? CONFIDENCE_COLORS.offline
          : CONFIDENCE_COLORS[station.confidenceLevel] ?? CONFIDENCE_COLORS.medium;

      const evLightningPath = 'M13 2L3 14h9l-1 8 10-12h-9l1-8z';
      const svgIcon = {
        path: evLightningPath,
        fillColor: color,
        fillOpacity: 1,
        strokeColor: isSelected ? '#000000' : '#FFFFFF',
        strokeWeight: isSelected ? 2 : 1.2,
        scale: isSelected ? 1.4 : 1.1,
        anchor: new google.maps.Point(12, 12),
      };

      const marker = new google.maps.Marker({
        position: { lat: station.coordinates.lat, lng: station.coordinates.lng },
        map: mapInstanceRef.current!,
        title: station.name,
        icon: svgIcon,
        zIndex: isSelected ? 100 : 10,
      });

      const infoWindow = new google.maps.InfoWindow({
        content: `
          <div style="padding:6px; font-family:sans-serif; min-width:140px;">
            <div style="font-weight:800; font-size:13px; color:#000;">${station.name}</div>
            <div style="font-size:11px; color:#555; margin-top:2px;">${station.availablePorts}/${station.totalPorts} ports free</div>
            <div style="font-size:11px; color:${color}; font-weight:700; margin-top:2px;">${station.confidenceScore}% reliable</div>
          </div>
        `,
      });

      marker.addListener('click', () => {
        infoWindow.open(mapInstanceRef.current!, marker);
        onStationClick?.(station);
      });

      markersRef.current.push(marker);
    });
  }, [isReady, stations, selectedStationId, onStationClick]);

  // Render Route Polyline (fit bounds only once per unique route to avoid locking view)
  useEffect(() => {
    if (!isReady || !mapInstanceRef.current) return;

    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }

    if (route && route.length >= 2) {
      polylineRef.current = new google.maps.Polyline({
        path: route.map((p) => ({ lat: p.lat, lng: p.lng })),
        geodesic: true,
        strokeColor: '#000000',
        strokeOpacity: 0.9,
        strokeWeight: 5,
        map: mapInstanceRef.current,
      });

      const routeKey = `${route[0].lat},${route[0].lng}-${route[route.length - 1].lat},${route[route.length - 1].lng}`;
      if (autoFitRouteOnLoad && routeFittedRef.current !== routeKey && !userLocation) {
        routeFittedRef.current = routeKey;
        const bounds = new google.maps.LatLngBounds();
        route.forEach((p) => bounds.extend({ lat: p.lat, lng: p.lng }));
        mapInstanceRef.current.fitBounds(bounds, { top: 70, bottom: 120, left: 60, right: 60 });
      }
    }
  }, [isReady, route, autoFitRouteOnLoad, userLocation]);

  // Recenter handler
  const handleRecenter = useCallback(() => {
    if (!mapInstanceRef.current) return;
    setIsFollowing(true);
    const target = userLocation || center || DEFAULT_CENTER;
    mapInstanceRef.current.panTo({ lat: target.lat, lng: target.lng });
    mapInstanceRef.current.setZoom(16);
  }, [userLocation, center]);

  // Fit whole route handler
  const handleFitOverview = useCallback(() => {
    if (!mapInstanceRef.current || !route || route.length < 2) return;
    setIsFollowing(false);
    const bounds = new google.maps.LatLngBounds();
    route.forEach((p) => bounds.extend({ lat: p.lat, lng: p.lng }));
    mapInstanceRef.current.fitBounds(bounds, { top: 80, bottom: 140, left: 40, right: 40 });
  }, [route]);

  return (
    <div className={cn('relative overflow-hidden', className)} style={{ height }}>
      <div ref={mapRef} className="w-full h-full" />
      
      {/* Map Controls */}
      {isReady && (
        <div className="absolute right-4 bottom-28 z-20 flex flex-col gap-2">
          {route && route.length >= 2 && (
            <button
              type="button"
              onClick={handleFitOverview}
              title="Overview entire route"
              className="bg-white border border-gray-200 text-black p-3 rounded-full shadow-lg hover:bg-gray-50 active:scale-95 transition-all flex items-center justify-center"
            >
              <MapIcon className="w-5 h-5 text-gray-700" />
            </button>
          )}

          <button
            type="button"
            onClick={handleRecenter}
            title="Recenter on vehicle"
            className={cn(
              'p-3 rounded-full shadow-lg border transition-all flex items-center justify-center',
              isFollowing ? 'bg-black border-black text-white' : 'bg-white border-gray-200 text-black hover:bg-gray-50'
            )}
          >
            <LocateFixed className="w-5 h-5" />
          </button>
        </div>
      )}

      {!isReady && (
        <div className="absolute inset-0 bg-gray-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-full border-2 border-black border-t-transparent animate-spin" />
            <span className="text-gray-500 text-xs font-bold">Loading Google Maps…</span>
          </div>
        </div>
      )}
    </div>
  );
}
