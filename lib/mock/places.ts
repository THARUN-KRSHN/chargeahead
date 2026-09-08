import type { Place } from '@/types';

// ============================================================
// ChargeAhead — Mock Places Dataset
// Named destinations across South India + major metros
// Used for search autocomplete and route planning
// ============================================================

export const MOCK_PLACES: Place[] = [
  // ── Bengaluru ──────────────────────────────────────────
  {
    id: 'place-blr-koramangala',
    label: 'Koramangala, Bengaluru',
    address: '5th Block, Koramangala, Bengaluru, Karnataka 560095',
    coords: { lat: 12.9352, lng: 77.6245 },
    type: 'area',
  },
  {
    id: 'place-blr-indiranagar',
    label: 'Indiranagar, Bengaluru',
    address: '12th Main Rd, Indiranagar, Bengaluru, Karnataka 560038',
    coords: { lat: 12.9784, lng: 77.6408 },
    type: 'area',
  },
  {
    id: 'place-blr-mg-road',
    label: 'MG Road, Bengaluru',
    address: 'Mahatma Gandhi Rd, Bengaluru, Karnataka 560001',
    coords: { lat: 12.9756, lng: 77.6097 },
    type: 'area',
  },
  {
    id: 'place-blr-whitefield',
    label: 'Whitefield, Bengaluru',
    address: 'Whitefield, Bengaluru, Karnataka 560066',
    coords: { lat: 12.9698, lng: 77.7499 },
    type: 'area',
  },
  {
    id: 'place-blr-electronic-city',
    label: 'Electronic City, Bengaluru',
    address: 'Electronic City Phase 1, Bengaluru, Karnataka 560100',
    coords: { lat: 12.8399, lng: 77.6770 },
    type: 'area',
  },
  {
    id: 'place-blr-airport',
    label: 'Kempegowda International Airport, Bengaluru',
    address: 'Devanahalli, Bengaluru, Karnataka 562300',
    coords: { lat: 13.1979, lng: 77.7063 },
    type: 'landmark',
  },

  // ── Mysuru ─────────────────────────────────────────────
  {
    id: 'place-mys-palace',
    label: 'Mysuru Palace, Mysuru',
    address: 'Mysuru Palace Rd, Agrahara, Mysuru, Karnataka 570001',
    coords: { lat: 12.3052, lng: 76.6552 },
    type: 'landmark',
  },
  {
    id: 'place-mys-city',
    label: 'Mysuru City Centre',
    address: 'Sayyaji Rao Rd, Mysuru, Karnataka 570001',
    coords: { lat: 12.2958, lng: 76.6394 },
    type: 'city',
  },

  // ── Chennai ────────────────────────────────────────────
  {
    id: 'place-chn-express-avenue',
    label: 'Express Avenue Mall, Chennai',
    address: 'Whites Rd, Royapettah, Chennai, Tamil Nadu 600002',
    coords: { lat: 13.0543, lng: 80.2629 },
    type: 'landmark',
  },
  {
    id: 'place-chn-airport',
    label: 'Chennai International Airport',
    address: 'Tirusulam, Chennai, Tamil Nadu 600027',
    coords: { lat: 12.9941, lng: 80.1709 },
    type: 'landmark',
  },
  {
    id: 'place-chn-marina',
    label: 'Marina Beach, Chennai',
    address: 'Marina Beach Rd, Triplicane, Chennai, Tamil Nadu 600005',
    coords: { lat: 13.0500, lng: 80.2824 },
    type: 'landmark',
  },

  // ── Hyderabad ──────────────────────────────────────────
  {
    id: 'place-hyd-hitech',
    label: 'HITEC City, Hyderabad',
    address: 'Madhapur, Hyderabad, Telangana 500081',
    coords: { lat: 17.4435, lng: 78.3772 },
    type: 'area',
  },
  {
    id: 'place-hyd-charminar',
    label: 'Charminar, Hyderabad',
    address: 'Charminar, Hyderabad, Telangana 500002',
    coords: { lat: 17.3616, lng: 78.4747 },
    type: 'landmark',
  },
  {
    id: 'place-hyd-airport',
    label: 'Rajiv Gandhi International Airport, Hyderabad',
    address: 'Shamshabad, Hyderabad, Telangana 500409',
    coords: { lat: 17.2403, lng: 78.4294 },
    type: 'landmark',
  },

  // ── Mumbai & Pune ──────────────────────────────────────
  {
    id: 'place-mum-bkc',
    label: 'Bandra Kurla Complex, Mumbai',
    address: 'BKC, Bandra East, Mumbai, Maharashtra 400051',
    coords: { lat: 19.0596, lng: 72.8656 },
    type: 'area',
  },
  {
    id: 'place-mum-airport',
    label: 'Chhatrapati Shivaji Maharaj Airport, Mumbai',
    address: 'Santacruz East, Mumbai, Maharashtra 400099',
    coords: { lat: 19.0896, lng: 72.8656 },
    type: 'landmark',
  },
  {
    id: 'place-pun-koregaon',
    label: 'Koregaon Park, Pune',
    address: 'Koregaon Park, Pune, Maharashtra 411001',
    coords: { lat: 18.5362, lng: 73.8941 },
    type: 'area',
  },
  {
    id: 'place-pun-lonavala',
    label: 'Lonavala Expressway Stop, Pune',
    address: 'Lonavala, Maharashtra 410401',
    coords: { lat: 18.7546, lng: 73.4062 },
    type: 'landmark',
  },

  // ── Coorg & Hill Stations ──────────────────────────────
  {
    id: 'place-coorg-madikeri',
    label: 'Madikeri, Coorg',
    address: 'Madikeri, Kodagu, Karnataka 571201',
    coords: { lat: 12.4244, lng: 75.7382 },
    type: 'city',
  },
  {
    id: 'place-ooty',
    label: 'Ooty (Udhagamandalam)',
    address: 'Udhagamandalam, The Nilgiris, Tamil Nadu 643001',
    coords: { lat: 11.4102, lng: 76.6950 },
    type: 'city',
  },
  {
    id: 'place-chikmagalur',
    label: 'Chikmagalur',
    address: 'Chikmagalur, Karnataka 577101',
    coords: { lat: 13.3161, lng: 75.7720 },
    type: 'city',
  },

  // ── Goa ───────────────────────────────────────────────
  {
    id: 'place-goa-panaji',
    label: 'Panaji, Goa',
    address: 'Panaji, North Goa, Goa 403001',
    coords: { lat: 15.4909, lng: 73.8278 },
    type: 'city',
  },
  {
    id: 'place-goa-baga',
    label: 'Baga Beach, Goa',
    address: 'Baga, Calangute, Goa 403516',
    coords: { lat: 15.5524, lng: 73.7518 },
    type: 'landmark',
  },

  // ── New Delhi & NCR ────────────────────────────────────
  {
    id: 'place-del-cyber-city',
    label: 'Cyber City, Gurugram',
    address: 'DLF Cyber City, Gurugram, Haryana 122002',
    coords: { lat: 28.4947, lng: 77.0889 },
    type: 'area',
  },
  {
    id: 'place-del-connaught',
    label: 'Connaught Place, New Delhi',
    address: 'Connaught Place, New Delhi 110001',
    coords: { lat: 28.6315, lng: 77.2167 },
    type: 'area',
  },
  {
    id: 'place-del-airport',
    label: 'Indira Gandhi International Airport, Delhi',
    address: 'Palam, New Delhi 110037',
    coords: { lat: 28.5562, lng: 77.1000 },
    type: 'landmark',
  },

  // ── Kochi ─────────────────────────────────────────────
  {
    id: 'place-kochi-marine',
    label: 'Marine Drive, Kochi',
    address: 'Marine Drive, Ernakulam, Kochi, Kerala 682031',
    coords: { lat: 9.9816, lng: 76.2999 },
    type: 'landmark',
  },
  {
    id: 'place-kochi-airport',
    label: 'Cochin International Airport',
    address: 'Nedumbassery, Ernakulam, Kerala 683572',
    coords: { lat: 10.1520, lng: 76.3919 },
    type: 'landmark',
  },

  // ── Ramanagara (midpoint for Bengaluru–Mysuru) ─────────
  {
    id: 'place-ramanagara',
    label: 'Ramanagara',
    address: 'Ramanagara, Karnataka 562159',
    coords: { lat: 12.7166, lng: 77.2826 },
    type: 'city',
  },

  // ── Mandya ─────────────────────────────────────────────
  {
    id: 'place-mandya',
    label: 'Mandya',
    address: 'Mandya, Karnataka 571401',
    coords: { lat: 12.5220, lng: 76.8950 },
    type: 'city',
  },
];

// ── Search helper ──────────────────────────────────────────

export function searchPlacesLocal(query: string): Place[] {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase();
  return MOCK_PLACES.filter(
    (p) => p.label.toLowerCase().includes(q) || p.address.toLowerCase().includes(q),
  ).slice(0, 8);
}

export function getPlaceById(id: string): Place | undefined {
  return MOCK_PLACES.find((p) => p.id === id);
}

/** Reverse-lookup: given a LatLng, return the closest mock place label */
export function reverseGeocode(lat: number, lng: number): Place {
  let closest = MOCK_PLACES[0];
  let minDist = Infinity;
  for (const place of MOCK_PLACES) {
    const d = Math.hypot(place.coords.lat - lat, place.coords.lng - lng);
    if (d < minDist) {
      minDist = d;
      closest = place;
    }
  }
  return closest;
}
