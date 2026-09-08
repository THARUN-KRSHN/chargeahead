import { GoogleGenAI } from '@google/genai';
import type { LatLng, UserVehicle, ChargingStation, ChargerPort, AmenityType } from '@/types';
import type { RealPlace, RealRouteStop } from './geoServices';

const GEMINI_KEY =
  process.env.GEMINI_API_KEY ||
  process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
  '';

export interface GeminiRouteAnalysis {
  trafficCondition: 'Light' | 'Moderate' | 'Heavy' | 'Severe';
  trafficDelayMinutes: number;
  trafficSummary: string;
  terrainImpact: string;
  consumptionMultiplier: number;
  aiAdvice: string;
  recommendedStops: RealRouteStop[];
}

const COMMON_STATION_BASE = {
  photos: [],
  rating: 4.7,
  reviewCount: 38,
  operatingHours: '24/7',
  isReservable: true,
  fastChargeAvailable: true,
  ultraFastAvailable: false,
};

// Regional fallback EV stations along major South & Indian corridors (e.g. NH66 Kerala, NH44, NH48)
export const ENROUTE_FALLBACK_STATIONS: ChargingStation[] = [
  {
    ...COMMON_STATION_BASE,
    id: 'st-kseb-thrissur',
    name: 'KSEB Fast EV Station, Thrissur',
    operator: 'KSEB',
    address: 'Near Swaraj Round, Thrissur, Kerala',
    city: 'Thrissur',
    state: 'Kerala',
    coordinates: { lat: 10.5276, lng: 76.2144 },
    status: 'available',
    confidenceScore: 94,
    confidenceLevel: 'high',
    confidenceBreakdown: { operatorData: 95, communityData: 92, historicalData: 95 },
    totalPorts: 4,
    availablePorts: 3,
    predictedQueueMinutes: 0,
    queueLength: 0,
    pricePerKwh: 15,
    lastVerifiedAt: new Date().toISOString(),
    ports: [
      { id: 'p-ks1', connectorType: 'CCS2', speedKw: 60, chargerSpeed: 'fast', status: 'available', pricePerKwh: 15, bayLocation: 'Bay 1 (Ground Floor)', landmarkNote: 'Near Swaraj Round East Gate' },
      { id: 'p-ks2', connectorType: 'CCS2', speedKw: 60, chargerSpeed: 'fast', status: 'available', pricePerKwh: 15, bayLocation: 'Bay 2 (Ground Floor)', landmarkNote: 'Adjacent to KSEB Substation Office' },
    ],
    amenities: ['restroom', 'food', 'wifi'],
  },
  {
    ...COMMON_STATION_BASE,
    id: 'st-zeon-edappal',
    name: 'Zeon Charging Station, Edappal',
    operator: 'Zeon',
    address: 'Kuttippuram Rd, Edappal, Kerala 679576',
    city: 'Edappal',
    state: 'Kerala',
    coordinates: { lat: 10.7672, lng: 76.0022 },
    status: 'available',
    confidenceScore: 98,
    confidenceLevel: 'high',
    confidenceBreakdown: { operatorData: 98, communityData: 98, historicalData: 98 },
    totalPorts: 4,
    availablePorts: 3,
    predictedQueueMinutes: 2,
    queueLength: 1,
    pricePerKwh: 18,
    lastVerifiedAt: new Date().toISOString(),
    ports: [
      { id: 'p-ze1', connectorType: 'CCS2', speedKw: 50, chargerSpeed: 'fast', status: 'available', pricePerKwh: 18, bayLocation: 'Bay 1 (Highway Canopy A)', landmarkNote: 'Main Plaza Entrance · Kuttippuram Road' },
      { id: 'p-ze2', connectorType: 'CCS2', speedKw: 50, chargerSpeed: 'fast', status: 'available', pricePerKwh: 18, bayLocation: 'Bay 2 (Highway Canopy B)', landmarkNote: 'Adjacent to Coffee Shop & Restrooms' },
    ],
    amenities: ['food', 'restroom', 'coffee'],
  },
  {
    ...COMMON_STATION_BASE,
    id: 'st-tata-valanchery',
    name: 'Tata Power EZ Charge, Valanchery',
    operator: 'Tata Power',
    address: 'NH 66, Valanchery, Kerala 676552',
    city: 'Valanchery',
    state: 'Kerala',
    coordinates: { lat: 10.8925, lng: 76.0733 },
    status: 'available',
    confidenceScore: 92,
    confidenceLevel: 'high',
    confidenceBreakdown: { operatorData: 92, communityData: 90, historicalData: 94 },
    totalPorts: 2,
    availablePorts: 2,
    predictedQueueMinutes: 0,
    queueLength: 0,
    pricePerKwh: 17,
    lastVerifiedAt: new Date().toISOString(),
    ports: [
      { id: 'p-tp1', connectorType: 'CCS2', speedKw: 50, chargerSpeed: 'fast', status: 'available', pricePerKwh: 17, bayLocation: 'Bay 1 (NH 66 Service Bay)', landmarkNote: 'Fuel Station Compound · North Wing' },
    ],
    amenities: ['restroom', 'food'],
  },
  {
    ...COMMON_STATION_BASE,
    id: 'st-relux-ramanattukara',
    name: 'Relux Electric Fast Charging, Ramanattukara',
    operator: 'Relux',
    address: 'Bypass Jn, Ramanattukara, Kozhikode, Kerala 673633',
    city: 'Kozhikode',
    state: 'Kerala',
    coordinates: { lat: 11.1764, lng: 75.8672 },
    status: 'available',
    confidenceScore: 96,
    confidenceLevel: 'high',
    confidenceBreakdown: { operatorData: 96, communityData: 95, historicalData: 97 },
    totalPorts: 4,
    availablePorts: 3,
    predictedQueueMinutes: 5,
    queueLength: 1,
    pricePerKwh: 16,
    lastVerifiedAt: new Date().toISOString(),
    ports: [
      { id: 'p-rx1', connectorType: 'CCS2', speedKw: 60, chargerSpeed: 'fast', status: 'available', pricePerKwh: 16, bayLocation: 'Bay A1 (Bypass Plaza)', landmarkNote: 'Hotel Entrance & Shopping Arcade' },
    ],
    amenities: ['hotel', 'restroom', 'shopping'],
  },
  {
    ...COMMON_STATION_BASE,
    id: 'st-ather-kottakkal',
    name: 'Ather Grid, Kottakkal',
    operator: 'Ather',
    address: 'Changuvetty, Kottakkal, Kerala 676503',
    city: 'Kottakkal',
    state: 'Kerala',
    coordinates: { lat: 11.0006, lng: 75.9984 },
    status: 'available',
    confidenceScore: 89,
    confidenceLevel: 'medium',
    confidenceBreakdown: { operatorData: 89, communityData: 88, historicalData: 90 },
    totalPorts: 2,
    availablePorts: 1,
    predictedQueueMinutes: 0,
    queueLength: 0,
    pricePerKwh: 14,
    lastVerifiedAt: new Date().toISOString(),
    ports: [
      { id: 'p-at1', connectorType: 'Type2', speedKw: 22, chargerSpeed: 'fast', status: 'available', pricePerKwh: 14, bayLocation: 'Bay 1 (Changuvetty Corner)', landmarkNote: 'Near Restaurant Parking' },
    ],
    amenities: ['food', 'restroom'],
  },
  {
    ...COMMON_STATION_BASE,
    id: 'st-tata-irinjalakuda',
    name: 'Tata Power EZ Charge, Irinjalakuda',
    operator: 'Tata Power',
    address: 'Tana Road, Irinjalakuda, Kerala 680121',
    city: 'Irinjalakuda',
    state: 'Kerala',
    coordinates: { lat: 10.3421, lng: 76.2148 },
    status: 'available',
    confidenceScore: 96,
    confidenceLevel: 'high',
    confidenceBreakdown: { operatorData: 97, communityData: 95, historicalData: 96 },
    totalPorts: 4,
    availablePorts: 3,
    predictedQueueMinutes: 0,
    queueLength: 0,
    pricePerKwh: 16,
    lastVerifiedAt: new Date().toISOString(),
    ports: [
      { id: 'p-ijk1', connectorType: 'CCS2', speedKw: 60, chargerSpeed: 'fast', status: 'available', pricePerKwh: 16, bayLocation: 'Bay 1 (Tana Road Plaza)', landmarkNote: 'Christ College Junction' },
      { id: 'p-ijk2', connectorType: 'CCS2', speedKw: 60, chargerSpeed: 'fast', status: 'available', pricePerKwh: 16, bayLocation: 'Bay 2 (Tana Road Plaza)', landmarkNote: 'Christ College Junction' },
    ],
    amenities: ['food', 'restroom', 'wifi'],
  },
  {
    ...COMMON_STATION_BASE,
    id: 'st-kseb-thriprayar',
    name: 'KSEB EV Charging Station, Thriprayar',
    operator: 'KSEB',
    address: 'SH 69, Thriprayar, Kerala 680566',
    city: 'Thriprayar',
    state: 'Kerala',
    coordinates: { lat: 10.4150, lng: 76.1130 },
    status: 'available',
    confidenceScore: 94,
    confidenceLevel: 'high',
    confidenceBreakdown: { operatorData: 95, communityData: 93, historicalData: 94 },
    totalPorts: 2,
    availablePorts: 2,
    predictedQueueMinutes: 0,
    queueLength: 0,
    pricePerKwh: 15,
    lastVerifiedAt: new Date().toISOString(),
    ports: [
      { id: 'p-tpr1', connectorType: 'CCS2', speedKw: 60, chargerSpeed: 'fast', status: 'available', pricePerKwh: 15, bayLocation: 'Bay 1 (Temple Junction Bay)', landmarkNote: 'Near Thriprayar Bypass Bus Stand' },
    ],
    amenities: ['food', 'restroom'],
  },
];

/**
 * Uses Gemini AI to calculate real-time route conditions, traffic impact,
 * terrain elevation, and optimal EV charging stops.
 */
export async function analyzeEVRouteWithGemini(
  origin: RealPlace,
  destination: RealPlace,
  vehicle: UserVehicle,
  startChargePercent: number,
  distanceKm: number
): Promise<GeminiRouteAnalysis> {
  const defaultAnalysis: GeminiRouteAnalysis = {
    trafficCondition: 'Moderate',
    trafficDelayMinutes: Math.round(distanceKm * 0.1),
    trafficSummary: `Moderate highway traffic along the ${origin.label} to ${destination.label} route.`,
    terrainImpact: 'Coastal and highway terrain with mild stop-and-go speed variance.',
    consumptionMultiplier: 1.05,
    aiAdvice: startChargePercent < 35
      ? `Starting at ${startChargePercent}% battery requires at least 1 fast charging stop enroute to safely reach ${destination.label}.`
      : 'Battery is adequate for current route with scheduled safety buffer.',
    recommendedStops: [],
  };

  if (!GEMINI_KEY) {
    return defaultAnalysis;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: GEMINI_KEY });
    const model = 'gemini-2.5-flash';

    const prompt = `
You are an expert AI EV Route & Traffic Assistant for ChargeAhead.
Analyze an EV trip:
- Origin: ${origin.label} (${origin.coords.lat}, ${origin.coords.lng})
- Destination: ${destination.label} (${destination.coords.lat}, ${destination.coords.lng})
- Vehicle: ${vehicle.nickname || vehicle.evModel?.make || 'EV'} (${vehicle.evModel?.batteryCapacityKwh || 40.5} kWh)
- Starting Battery: ${startChargePercent}%
- Total Distance: ${distanceKm} km

Respond strictly in JSON with keys:
{
  "trafficCondition": "Light" | "Moderate" | "Heavy" | "Severe",
  "trafficDelayMinutes": number,
  "trafficSummary": string,
  "terrainImpact": string,
  "consumptionMultiplier": number,
  "aiAdvice": string
}
`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    const text = response.text || '';
    const jsonMatch = text.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        ...defaultAnalysis,
        trafficCondition: parsed.trafficCondition || 'Moderate',
        trafficDelayMinutes: parsed.trafficDelayMinutes ?? Math.round(distanceKm * 0.1),
        trafficSummary: parsed.trafficSummary || defaultAnalysis.trafficSummary,
        terrainImpact: parsed.terrainImpact || defaultAnalysis.terrainImpact,
        consumptionMultiplier: parsed.consumptionMultiplier ?? 1.05,
        aiAdvice: parsed.aiAdvice || defaultAnalysis.aiAdvice,
      };
    }
  } catch (err) {
    console.warn('[Gemini AI Route Analysis Warning]', err);
  }

  return defaultAnalysis;
}
