// ============================================================
// ChargeAhead — EV Routing Engine
// Pure TypeScript — no React, fully offline, unit-testable
// ============================================================

import type { LatLng, ChargingStation, UserVehicle, Place, RouteStop, RoutePlan } from '@/types';
import { MOCK_STATIONS } from './stations';

// ── Constants ────────────────────────────────────────────────

const ROAD_FACTOR = 1.3;           // real roads ≈ 30% longer than straight-line
const AVG_SPEED_KMH = 55;          // average incl. traffic, city+highway mix
const SAFETY_MARGIN = 0.88;        // don't plan to arrive at 0% — buffer
const TARGET_CHARGE_PCT = 80;      // fast-charge convention: charge to 80%
const PARKING_BUFFER_MIN = 5;      // fixed buffer per stop (park + plug in)
const MAX_STOPS = 3;               // cap to avoid infinite loop on very long trips
const CORRIDOR_PERPENDICULAR_KM = 35; // station must be within 35km of direct path

// ── Haversine Distance ────────────────────────────────────────

/** Returns straight-line distance in km between two LatLng points */
export function haversineDistance(a: LatLng, b: LatLng): number {
  const R = 6371; // Earth radius in km
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const c =
    sinDLat * sinDLat +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinDLng * sinDLng;
  return 2 * R * Math.asin(Math.sqrt(c));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/** Road distance estimate = straight-line × ROAD_FACTOR */
export function roadDistance(a: LatLng, b: LatLng): number {
  return haversineDistance(a, b) * ROAD_FACTOR;
}

/** Drive time in minutes given road distance */
export function driveTimeMin(distanceKm: number): number {
  return (distanceKm / AVG_SPEED_KMH) * 60;
}

// ── Corridor Filter ────────────────────────────────────────────

/**
 * Perpendicular distance from point P to segment AB.
 * Used to filter stations inside the "route corridor".
 */
function perpendicularDistance(p: LatLng, a: LatLng, b: LatLng): number {
  const abLat = b.lat - a.lat;
  const abLng = b.lng - a.lng;
  const abLen = Math.sqrt(abLat * abLat + abLng * abLng);
  if (abLen === 0) return haversineDistance(p, a);

  const t = Math.max(
    0,
    Math.min(1, ((p.lat - a.lat) * abLat + (p.lng - a.lng) * abLng) / (abLen * abLen)),
  );
  const closestLat = a.lat + t * abLat;
  const closestLng = a.lng + t * abLng;
  return haversineDistance(p, { lat: closestLat, lng: closestLng });
}

// ── Charging Time Calculation ──────────────────────────────────

/**
 * Returns estimated charging time in minutes.
 * Uses the fastest port available at the station that matches vehicle connectors.
 */
export function chargeTimeMin(
  fromPct: number,
  toPct: number,
  batteryKwh: number,
  station: ChargingStation,
  vehicle: UserVehicle,
): number {
  const vehicleConnectors = vehicle.evModel?.connectorTypes ?? [];

  // Find fastest compatible port
  const compatiblePorts = station.ports.filter(
    (p) => vehicleConnectors.includes(p.connectorType) && p.status !== 'offline',
  );
  const fastestKw =
    compatiblePorts.length > 0
      ? Math.max(...compatiblePorts.map((p) => p.speedKw))
      : station.pricePerKwh > 0
      ? 50 // fallback: assume 50kW DC
      : 22;

  const kwhNeeded = ((toPct - fromPct) / 100) * batteryKwh;
  if (kwhNeeded <= 0) return 0;
  return Math.round((kwhNeeded / fastestKw) * 60);
}

// ── Station Scoring ────────────────────────────────────────────

/**
 * Score a candidate station for routing.
 * Higher = better. Weights:
 *   - Confidence score: 40%
 *   - Inverse detour:   30%
 *   - Inverse queue:    15%
 *   - Charger speed:    15%
 */
function scoreStation(
  station: ChargingStation,
  fromCoords: LatLng,
  toCoords: LatLng,
  vehicle: UserVehicle,
): number {
  const directDist = haversineDistance(fromCoords, toCoords);
  const detourKm =
    haversineDistance(fromCoords, station.coordinates) +
    haversineDistance(station.coordinates, toCoords) -
    directDist;

  // Normalize detour: 0km = 1.0, 50km = 0.0
  const detourScore = Math.max(0, 1 - detourKm / 50);

  // Queue: 0min = 1.0, 30min = 0.0
  const queueScore = Math.max(0, 1 - station.predictedQueueMinutes / 30);

  // Speed: find max compatible port speed
  const vehicleConnectors = vehicle.evModel?.connectorTypes ?? [];
  const maxKw = Math.max(
    ...station.ports
      .filter((p) => vehicleConnectors.includes(p.connectorType))
      .map((p) => p.speedKw),
    22, // fallback min
  );
  // 150kW = 1.0, 7kW = 0.0
  const speedScore = Math.min(1, (maxKw - 7) / 143);

  const confidenceScore = station.confidenceScore / 100;

  return (
    confidenceScore * 0.4 +
    detourScore * 0.3 +
    queueScore * 0.15 +
    speedScore * 0.15
  );
}

// ── Usable Range Calculation ───────────────────────────────────

function usableRange(vehicle: UserVehicle, chargePercent: number): number {
  const efficiency = vehicle.evModel?.batteryCapacityKwh / (vehicle.evModel?.rangKm || 400);
  const batteryKwh = vehicle.evModel?.batteryCapacityKwh ?? 40;
  const availableKwh = batteryKwh * (chargePercent / 100);
  return (availableKwh / efficiency) * SAFETY_MARGIN;
}

// ── Main Routing Function ──────────────────────────────────────

/**
 * Compute an EV-aware route from origin to destination.
 * Returns a RoutePlan with computed stops, times, and costs.
 */
export function computeRoute(
  origin: Place,
  destination: Place,
  vehicle: UserVehicle,
  startChargePercent: number,
  allStations: ChargingStation[] = MOCK_STATIONS,
): RoutePlan {
  const stops: RouteStop[] = [];
  let currentCoords: LatLng = origin.coords;
  let currentCharge = startChargePercent;
  let longTripWarning: string | undefined;

  const totalStraightKm = haversineDistance(origin.coords, destination.coords);
  const totalRoadKm = roadDistance(origin.coords, destination.coords);

  // ── Direct trip check ─────────────────────────────────────
  const rangeKm = usableRange(vehicle, currentCharge);
  const needsCharging = rangeKm < totalRoadKm;

  if (!needsCharging) {
    const drivingMin = driveTimeMin(totalRoadKm);
    return {
      origin,
      destination,
      vehicle,
      startChargePercent,
      stops: [],
      finalLegDistanceKm: totalRoadKm,
      finalLegTimeMin: drivingMin,
      totalDistanceKm: totalRoadKm,
      totalDrivingMin: drivingMin,
      totalChargingMin: 0,
      totalTimeMin: drivingMin,
      totalCostInr: 0,
      needsCharging: false,
    };
  }

  // ── Multi-stop planning loop ───────────────────────────────
  for (let iteration = 0; iteration < MAX_STOPS + 1; iteration++) {
    const remainingRoadKm = roadDistance(currentCoords, destination.coords);
    const currentRange = usableRange(vehicle, currentCharge);

    if (currentRange >= remainingRoadKm) break; // we can reach destination — done

    if (iteration >= MAX_STOPS) {
      longTripWarning =
        'This is a very long trip — additional overnight charging may be needed before starting.';
      break;
    }

    // ── Candidate stations: inside corridor AND reachable ──
    const candidates = allStations.filter((s) => {
      const distToStation = roadDistance(currentCoords, s.coordinates);
      const isReachable = distToStation <= currentRange * 0.95; // slight buffer
      const inCorridor =
        perpendicularDistance(s.coordinates, currentCoords, destination.coords) <=
        CORRIDOR_PERPENDICULAR_KM;
      const isOperational = s.status !== 'offline';
      const alreadyUsed = stops.some((stop) => stop.station.id === s.id);
      return isReachable && inCorridor && isOperational && !alreadyUsed;
    });

    if (candidates.length === 0) {
      // No stations in corridor — try any reachable station as emergency
      const emergency = allStations
        .filter((s) => {
          const dist = roadDistance(currentCoords, s.coordinates);
          return dist <= currentRange * 0.9 && s.status !== 'offline' && !stops.some((stop) => stop.station.id === s.id);
        })
        .sort((a, b) => b.confidenceScore - a.confidenceScore)[0];

      if (!emergency) {
        // Fallback to highest confidence station available in dataset
        const fallbackStation = allStations.find((s) => s.status !== 'offline' && !stops.some((stop) => stop.station.id === s.id)) || allStations[0];
        candidates.push(fallbackStation);
      } else {
        candidates.push(emergency);
      }
    }

    // ── Rank & pick best candidate ──────────────────────────
    const best = candidates.sort(
      (a, b) =>
        scoreStation(b, currentCoords, destination.coords, vehicle) -
        scoreStation(a, currentCoords, destination.coords, vehicle),
    )[0];

    // ── Compute leg ─────────────────────────────────────────
    const legRoadKm = roadDistance(currentCoords, best.coordinates);
    const legDriveMin = driveTimeMin(legRoadKm);

    const directForLeg = haversineDistance(currentCoords, best.coordinates);
    const detourKm = Math.max(0, legRoadKm - directForLeg * ROAD_FACTOR);

    const arrivalPct = Math.max(
      5,
      currentCharge - (legRoadKm / usableRange(vehicle, currentCharge)) * currentCharge,
    );
    const arrivalPctRounded = Math.round(arrivalPct);
    const targetPct = TARGET_CHARGE_PCT;

    const chargingMin = chargeTimeMin(
      arrivalPctRounded,
      targetPct,
      vehicle.evModel?.batteryCapacityKwh ?? 40,
      best,
      vehicle,
    );

    // Cost using fastest compatible port price
    const vehicleConnectors = vehicle.evModel?.connectorTypes ?? [];
    const bestPort = best.ports
      .filter((p) => vehicleConnectors.includes(p.connectorType) && p.status !== 'offline')
      .sort((a, b) => b.speedKw - a.speedKw)[0];
    const pricePerKwh = bestPort?.pricePerKwh ?? best.pricePerKwh;
    const kwhNeeded = ((targetPct - arrivalPctRounded) / 100) * (vehicle.evModel?.batteryCapacityKwh ?? 40);
    const estimatedCostInr = Math.round(kwhNeeded * pricePerKwh);

    stops.push({
      station: best,
      arrivalChargePercent: arrivalPctRounded,
      targetChargePercent: targetPct,
      chargeTimeMin: chargingMin,
      legDistanceKm: Math.round(legRoadKm * 10) / 10,
      legTimeMin: Math.round(legDriveMin),
      estimatedCostInr,
      detourKm: Math.round(detourKm * 10) / 10,
    });

    currentCoords = best.coordinates;
    currentCharge = targetPct;
  }

  // ── Final leg ──────────────────────────────────────────────
  const finalLegRoadKm = roadDistance(currentCoords, destination.coords);
  const finalLegMin = driveTimeMin(finalLegRoadKm);

  // ── Aggregate totals ───────────────────────────────────────
  const totalDrivingMin =
    stops.reduce((acc, s) => acc + s.legTimeMin, 0) + Math.round(finalLegMin);
  const totalChargingMin =
    stops.reduce((acc, s) => acc + s.chargeTimeMin, 0) +
    stops.length * PARKING_BUFFER_MIN;
  const totalCostInr = stops.reduce((acc, s) => acc + s.estimatedCostInr, 0);

  const totalDistanceKm =
    stops.reduce((acc, s) => acc + s.legDistanceKm, 0) +
    Math.round(finalLegRoadKm * 10) / 10;

  return {
    origin,
    destination,
    vehicle,
    startChargePercent,
    stops,
    finalLegDistanceKm: Math.round(finalLegRoadKm * 10) / 10,
    finalLegTimeMin: Math.round(finalLegMin),
    totalDistanceKm: Math.round(totalDistanceKm * 10) / 10,
    totalDrivingMin,
    totalChargingMin,
    totalTimeMin: totalDrivingMin + totalChargingMin,
    totalCostInr,
    needsCharging: true,
    longTripWarning,
  };
}

// ── Formatting Helpers ─────────────────────────────────────────

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}

export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m`;
  return `${km.toFixed(0)} km`;
}
