'use client';

import { useEffect, useState } from 'react';
import type { LatLng } from '@/types';

interface OCMMapEmbedProps {
  center?: LatLng;
  height?: string;
  className?: string;
}

const DEFAULT_CENTER: LatLng = { lat: 12.9716, lng: 77.5946 };

export function OCMMapEmbed({
  center = DEFAULT_CENTER,
  height = '100%',
  className = '',
}: OCMMapEmbedProps) {
  const [src, setSrc] = useState<string | null>(null);

  useEffect(() => {
    // Build the embed URL; if geolocation is available the iframe will
    // auto-geolocate, but we pre-seed lat/lng so the map opens
    // centred on the user's approximate position immediately.
    const params = new URLSearchParams({
      mode: 'embedded',
      latitude: (center?.lat ?? DEFAULT_CENTER.lat).toString(),
      longitude: (center?.lng ?? DEFAULT_CENTER.lng).toString(),
    });
    setSrc(`https://map.openchargemap.io/?${params.toString()}`);
  }, [center?.lat, center?.lng]);

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ height }}>
      {/* Loading skeleton while iframe boots */}
      {!src && (
        <div className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center">
          <span className="text-gray-400 text-sm font-medium">Loading map…</span>
        </div>
      )}
      {src && (
        <iframe
          src={src}
          allow="geolocation"
          frameBorder="0"
          width="100%"
          height="100%"
          className="w-full h-full border-0"
          title="Open Charge Map – EV Charging Stations"
          loading="lazy"
          style={{ display: 'block' }}
        />
      )}
    </div>
  );
}
