'use client';

import { useState, useEffect } from 'react';
import type { LatLng } from '@/types';

interface GeolocationState {
  location: LatLng | null;
  accuracy: number | null;
  error: string | null;
  loading: boolean;
}

const BENGALURU_FALLBACK: LatLng = { lat: 12.9716, lng: 77.5946 };

/**
 * Real browser geolocation hook.
 * Watches position continuously (for active trip page).
 * Falls back gracefully on permission denial.
 */
export function useGeolocation(watch = false): GeolocationState {
  const [state, setState] = useState<GeolocationState>({
    location: null,
    accuracy: null,
    error: null,
    loading: true,
  });

  useEffect(() => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setState({ location: BENGALURU_FALLBACK, accuracy: null, error: 'Geolocation not supported', loading: false });
      return;
    }

    const onSuccess = (pos: GeolocationPosition) => {
      setState({
        location: { lat: pos.coords.latitude, lng: pos.coords.longitude },
        accuracy: Math.round(pos.coords.accuracy),
        error: null,
        loading: false,
      });
    };

    const onError = (err: GeolocationPositionError) => {
      // Fall back to Bengaluru centre so the map still works
      setState({ location: BENGALURU_FALLBACK, accuracy: null, error: err.message, loading: false });
    };

    const options: PositionOptions = {
      enableHighAccuracy: true,
      maximumAge: 15_000,
      timeout: 10_000,
    };

    if (watch) {
      const id = navigator.geolocation.watchPosition(onSuccess, onError, options);
      return () => navigator.geolocation.clearWatch(id);
    } else {
      navigator.geolocation.getCurrentPosition(onSuccess, onError, options);
    }
  }, [watch]);

  return state;
}
