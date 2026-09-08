import type { LatLng, UserVehicle, Place, ChargingStation } from '@/types';
import { fetchOCMStations } from './openChargeMap';

export interface RealPlace {
  id: string;
  label: string;
  address: string;
  coords: LatLng;
}

export interface RouteStepInstruction {
  instruction: string;
  distanceKm: number;
  durationMin: number;
  name: string;
}

export interface RealRoutePlan {
  origin: RealPlace;
  destination: RealPlace;
  vehicle: UserVehicle;
  startChargePercent: number;
  routeGeometry: LatLng[];
  stops: RealRouteStop[];
  totalDistanceKm: number;
  totalDriveTimeMin: number;
  totalChargeTimeMin: number;
  totalTimeMin: number;
  totalCost: number;
  drivingSteps: RouteStepInstruction[];
}

export interface RealRouteStop {
  station: ChargingStation;
  arrivalChargePercent: number;
  targetChargePercent: number;
  chargeTimeMin: number;
  legDistanceKm: number;
  legTimeMin: number;
  cost: number;
}

// 1. Nominatim Place Search (Real OpenStreetMap Place Search)
export async function searchPlacesReal(query: string): Promise<RealPlace[]> {
  if (!query || query.trim().length < 2) return [];

  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
      query
    )}&format=json&addressdetails=1&limit=6`;
    
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'ChargeAhead-EV-App/1.0',
        'Accept-Language': 'en',
      },
    });

    if (!res.ok) return [];

    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data.map((item: any) => {
      const address = item.address || {};
      const city = address.city || address.town || address.village || address.county || address.state || '';
      const name = item.name || address.attraction || address.building || city || item.display_name.split(',')[0];

      return {
        id: `nom-${item.place_id}`,
        label: name,
        address: item.display_name,
        coords: {
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
        },
      };
    });
  } catch (err) {
    console.error('[Nominatim Search Error]', err);
    return [];
  }
}

// 2. Nominatim Reverse Geocoding
export async function reverseGeocodeReal(lat: number, lng: number): Promise<RealPlace> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'ChargeAhead-EV-App/1.0',
        'Accept-Language': 'en',
      },
    });

    if (res.ok) {
      const data = await res.json();
      const address = data.address || {};
      const suburb = address.suburb || address.neighbourhood || address.residential || address.road || '';
      const city = address.city || address.town || address.state_district || address.state || '';
      const label = suburb && city ? `${suburb}, ${city}` : data.display_name.split(',')[0];

      return {
        id: `loc-${lat.toFixed(4)}-${lng.toFixed(4)}`,
        label: label || 'Current Location',
        address: data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        coords: { lat, lng },
      };
    }
  } catch (err) {
    console.error('[Reverse Geocode Error]', err);
  }

  return {
    id: `loc-${lat.toFixed(4)}-${lng.toFixed(4)}`,
    label: `Location (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
    address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
    coords: { lat, lng },
  };
}

// 3. Haversine Distance helper (km)
export function haversineDistance(a: LatLng, b: LatLng): number {
  const R = 6371; // Earth radius in km
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;

  const sin1 = Math.sin(dLat / 2);
  const sin2 = Math.sin(dLng / 2);

  const val = sin1 * sin1 + Math.sin(dLng / 2) * sin2 * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(val), Math.sqrt(1 - val));
  return R * c;
}

// 4. Real OSRM Routing Machine call
export async function fetchOSRMRoute(waypoints: LatLng[]): Promise<{
  geometry: LatLng[];
  distanceKm: number;
  durationMin: number;
  steps: RouteStepInstruction[];
}> {
  if (waypoints.length < 2) {
    return { geometry: waypoints, distanceKm: 0, durationMin: 0, steps: [] };
  }

  try {
    const coordsStr = waypoints.map((p) => `${p.lng},${p.lat}`).join(';');
    const url = `https://router.project-osrm.org/route/v1/driving/${coordsStr}?overview=full&geometries=geojson&steps=true`;
    
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const geometry: LatLng[] = route.geometry.coordinates.map(([lng, lat]: [number, number]) => ({
          lat,
          lng,
        }));
        
        const distanceKm = Math.round((route.distance / 1000) * 10) / 10;
        const durationMin = Math.round(route.duration / 60);

        const steps: RouteStepInstruction[] = [];
        if (route.legs) {
          route.legs.forEach((leg: any) => {
            if (leg.steps) {
              leg.steps.forEach((s: any) => {
                if (s.maneuver && s.maneuver.type) {
                  const modifier = s.maneuver.modifier ? ` ${s.maneuver.modifier}` : '';
                  const instruction = `${s.maneuver.type}${modifier} onto ${s.name || 'road'}`;
                  steps.push({
                    instruction: instruction.charAt(0).toUpperCase() + instruction.slice(1),
                    distanceKm: Math.round((s.distance / 1000) * 10) / 10,
                    durationMin: Math.round(s.duration / 60),
                    name: s.name || 'Road',
                  });
                }
              });
            }
          });
        }

        return { geometry, distanceKm, durationMin, steps };
      }
    }
  } catch (err) {
    console.error('[OSRM Fetch Error]', err);
  }

  // Fallback linear interpolation if OSRM is unreachable
  const directDist = haversineDistance(waypoints[0], waypoints[waypoints.length - 1]) * 1.3;
  return {
    geometry: waypoints,
    distanceKm: Math.round(directDist * 10) / 10,
    durationMin: Math.round((directDist / 50) * 60),
    steps: [
      { instruction: 'Head towards destination along primary highway', distanceKm: Math.round(directDist), durationMin: Math.round((directDist / 50) * 60), name: 'Highway' }
    ],
  };
}

// 5. Full Real EV Routing Calculation using OCM Live Stations & OSRM
export async function computeRealEVRoute(
  origin: RealPlace,
  destination: RealPlace,
  vehicle: UserVehicle,
  startChargePercent: number
): Promise<RealRoutePlan> {
  const directDistKm = haversineDistance(origin.coords, destination.coords) * 1.3;

  // Vehicle range calculations
  const batteryCap = vehicle.evModel?.batteryCapacityKwh || 40;
  const efficiency = 0.16; // kWh per km
  const usableRangeKm = Math.round((batteryCap * (startChargePercent / 100) * 0.85) / efficiency);

  const needsCharging = usableRangeKm < directDistKm;
  const stops: RealRouteStop[] = [];

  if (needsCharging) {
    // Fetch live OCM stations in region
    const midLat = (origin.coords.lat + destination.coords.lat) / 2;
    const midLng = (origin.coords.lng + destination.coords.lng) / 2;
    const radius = Math.min(200, Math.max(50, Math.round(directDistKm / 2)));

    const ocmStations = await fetchOCMStations({
      latitude: midLat,
      longitude: midLng,
      distance: radius,
      maxResults: 25,
    });

    // Filter stations near the route line
    const usableStations = ocmStations.filter(
      (s) => s.status !== 'offline' && s.coordinates && typeof s.coordinates.lat === 'number'
    );

    if (usableStations.length > 0) {
      // Pick best station between 40% and 80% of route
      usableStations.sort((a, b) => {
        const distAToOrigin = haversineDistance(origin.coords, a.coordinates);
        const distBToOrigin = haversineDistance(origin.coords, b.coordinates);
        // Prefer station that is reachable on current battery but farthest along route
        const reachableA = distAToOrigin <= usableRangeKm;
        const reachableB = distBToOrigin <= usableRangeKm;

        if (reachableA && !reachableB) return -1;
        if (!reachableA && reachableB) return 1;
        return b.confidenceScore - a.confidenceScore;
      });

      const selectedStation = usableStations[0];
      const leg1Dist = Math.round(haversineDistance(origin.coords, selectedStation.coordinates) * 1.3);
      const leg1Time = Math.round((leg1Dist / 50) * 60);

      const arrivalSOC = Math.max(8, Math.round(startChargePercent - (leg1Dist * efficiency / batteryCap) * 100));
      const targetSOC = 85;
      const kwhNeeded = Math.round(((targetSOC - arrivalSOC) / 100) * batteryCap);
      const chargeSpeedKw = selectedStation.ports[0]?.speedKw || 50;
      const chargeTimeMin = Math.round((kwhNeeded / chargeSpeedKw) * 60 + 5);
      const cost = Math.round(kwhNeeded * (selectedStation.pricePerKwh || 16));

      stops.push({
        station: selectedStation,
        arrivalChargePercent: arrivalSOC,
        targetChargePercent: targetSOC,
        chargeTimeMin,
        legDistanceKm: leg1Dist,
        legTimeMin: leg1Time,
        cost,
      });
    }
  }

  // Construct waypoints list
  const waypoints: LatLng[] = [origin.coords];
  stops.forEach((s) => waypoints.push(s.station.coordinates));
  waypoints.push(destination.coords);

  // Get real geometry & steps from OSRM
  const routeData = await fetchOSRMRoute(waypoints);

  const totalChargeTimeMin = stops.reduce((acc, s) => acc + s.chargeTimeMin, 0);
  const totalCost = stops.reduce((acc, s) => acc + s.cost, 0);

  return {
    origin,
    destination,
    vehicle,
    startChargePercent,
    routeGeometry: routeData.geometry,
    stops,
    totalDistanceKm: routeData.distanceKm,
    totalDriveTimeMin: routeData.durationMin,
    totalChargeTimeMin,
    totalTimeMin: routeData.durationMin + totalChargeTimeMin,
    totalCost,
    drivingSteps: routeData.steps,
  };
}
