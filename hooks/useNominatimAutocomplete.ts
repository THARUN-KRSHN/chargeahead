'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';

export interface AutocompleteResult {
  placeId: string;
  label: string;
  sublabel: string;
  lat?: number;
  lng?: number;
}

let mapsInitialized = false;
function initMaps() {
  if (!mapsInitialized) {
    setOptions({
      key: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? '',
      v: 'weekly',
      libraries: ['places'],
    });
    mapsInitialized = true;
  }
}

export function useNominatimAutocomplete(
  query: string,
  { country = 'in', debounceMs = 280 }: { country?: string; debounceMs?: number } = {},
) {
  const [results, setResults] = useState<AutocompleteResult[]>([]);
  const [loading, setLoading] = useState(false);
  const svcRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeRef = useRef(true);

  // Init Google Places once
  useEffect(() => {
    initMaps();
    importLibrary('places').then(() => {
      svcRef.current = new google.maps.places.AutocompleteService();
      geocoderRef.current = new google.maps.Geocoder();
    }).catch(() => {});
  }, []);

  useEffect(() => {
    activeRef.current = true;
    if (timerRef.current) clearTimeout(timerRef.current);

    if (!query || query.trim().length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    timerRef.current = setTimeout(() => {
      if (!activeRef.current) return;

      if (svcRef.current) {
        setLoading(true);
        svcRef.current.getPlacePredictions(
          { input: query.trim(), componentRestrictions: { country }, types: ['geocode', 'establishment'] },
          (predictions, status) => {
            if (!activeRef.current) return;
            setLoading(false);
            if (status === google.maps.places.PlacesServiceStatus.OK && predictions?.length) {
              setResults(predictions.slice(0, 8).map((p) => ({
                placeId: p.place_id,
                label: p.structured_formatting.main_text,
                sublabel: p.structured_formatting.secondary_text ?? '',
              })));
            } else {
              nominatimSearch(query, country, setResults, setLoading, activeRef);
            }
          },
        );
      } else {
        nominatimSearch(query, country, setResults, setLoading, activeRef);
      }
    }, debounceMs);

    return () => {
      activeRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query, country, debounceMs]);

  /** Resolve a prediction to precise lat/lng */
  const resolvePlace = useCallback(async (item: AutocompleteResult): Promise<AutocompleteResult> => {
    if (item.lat !== undefined) return item;

    // Google Geocoder
    if (geocoderRef.current && !item.placeId.startsWith('nom-')) {
      return new Promise((resolve) => {
        geocoderRef.current!.geocode({ placeId: item.placeId }, (results, status) => {
          if (status === google.maps.GeocoderStatus.OK && results?.[0]) {
            const loc = results[0].geometry.location;
            resolve({ ...item, lat: loc.lat(), lng: loc.lng() });
          } else resolve(item);
        });
      });
    }

    // Nominatim fallback
    try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(item.label + ' ' + item.sublabel)}&format=json&limit=1`;
      const res = await fetch(url, { headers: { 'User-Agent': 'ChargeAhead-EV-App/1.0' } });
      if (res.ok) {
        const data = await res.json();
        if (data?.[0]) return { ...item, lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
      }
    } catch {}

    return item;
  }, []);

  return { results, loading, resolvePlace };
}

async function nominatimSearch(
  query: string,
  country: string,
  setResults: (r: AutocompleteResult[]) => void,
  setLoading: (v: boolean) => void,
  activeRef: React.MutableRefObject<boolean>,
) {
  setLoading(true);
  try {
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', query.trim());
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '8');
    url.searchParams.set('accept-language', 'en');
    if (country) url.searchParams.set('countrycodes', country);
    const res = await fetch(url.toString(), { headers: { 'User-Agent': 'ChargeAhead-EV-App/1.0' } });
    if (res.ok && activeRef.current) {
      const data = await res.json();
      setResults((data ?? []).map((d: any) => {
        const parts = (d.display_name as string).split(',').map((s: string) => s.trim());
        return {
          placeId: `nom-${d.place_id}`,
          label: parts[0] ?? d.display_name,
          sublabel: parts.slice(1, 3).join(', '),
          lat: parseFloat(d.lat),
          lng: parseFloat(d.lon),
        };
      }));
    }
  } catch {
    if (activeRef.current) setResults([]);
  } finally {
    if (activeRef.current) setLoading(false);
  }
}
