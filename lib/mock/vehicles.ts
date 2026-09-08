import type { EVModel } from '@/types';

export const EV_MODELS: EVModel[] = [
  // Tata Motors
  {
    id: 'tata-nexon-ev-empowered',
    make: 'Tata',
    model: 'Nexon EV Empowered+ LR',
    year: 2024,
    batteryCapacityKwh: 45,
    rangKm: 489,
    connectorTypes: ['CCS2', 'Type2', 'Bharat DC-001'],
    imageUrl: '/images/vehicles/tata-nexon-ev.webp',
  },
  {
    id: 'tata-nexon-ev-max',
    make: 'Tata',
    model: 'Nexon EV Max',
    year: 2023,
    batteryCapacityKwh: 40.5,
    rangKm: 437,
    connectorTypes: ['CCS2', 'Type2', 'Bharat DC-001'],
    imageUrl: '/images/vehicles/tata-nexon-ev.webp',
  },
  {
    id: 'tata-punch-ev-lr',
    make: 'Tata',
    model: 'Punch EV Long Range',
    year: 2024,
    batteryCapacityKwh: 35,
    rangKm: 421,
    connectorTypes: ['CCS2', 'Type2'],
    imageUrl: '/images/vehicles/tata-punch-ev.webp',
  },
  {
    id: 'tata-curvv-ev',
    make: 'Tata',
    model: 'Curvv EV 55',
    year: 2024,
    batteryCapacityKwh: 55,
    rangKm: 585,
    connectorTypes: ['CCS2', 'Type2'],
    imageUrl: '/images/vehicles/tata-nexon-ev.webp',
  },
  {
    id: 'tata-tiago-ev',
    make: 'Tata',
    model: 'Tiago EV Long Range',
    year: 2023,
    batteryCapacityKwh: 24,
    rangKm: 315,
    connectorTypes: ['CCS2', 'Type2'],
    imageUrl: '/images/vehicles/tata-nexon-ev.webp',
  },

  // MG Motor
  {
    id: 'mg-zs-ev',
    make: 'MG',
    model: 'ZS EV Exclusive',
    year: 2024,
    batteryCapacityKwh: 50.3,
    rangKm: 461,
    connectorTypes: ['CCS2', 'Type2'],
    imageUrl: '/images/vehicles/mg-zs-ev.webp',
  },
  {
    id: 'mg-windsor-ev',
    make: 'MG',
    model: 'Windsor EV',
    year: 2024,
    batteryCapacityKwh: 38,
    rangKm: 331,
    connectorTypes: ['CCS2', 'Type2'],
    imageUrl: '/images/vehicles/mg-zs-ev.webp',
  },
  {
    id: 'mg-comet-ev',
    make: 'MG',
    model: 'Comet EV Plush',
    year: 2023,
    batteryCapacityKwh: 17.3,
    rangKm: 230,
    connectorTypes: ['Type2'],
    imageUrl: '/images/vehicles/mg-zs-ev.webp',
  },

  // Mahindra
  {
    id: 'mahindra-xuv400-el-pro',
    make: 'Mahindra',
    model: 'XUV400 EV EL Pro',
    year: 2024,
    batteryCapacityKwh: 39.4,
    rangKm: 456,
    connectorTypes: ['CCS2', 'Type2'],
    imageUrl: '/images/vehicles/tata-nexon-ev.webp',
  },
  {
    id: 'mahindra-be6e',
    make: 'Mahindra',
    model: 'BE 6e Pack Three',
    year: 2025,
    batteryCapacityKwh: 59,
    rangKm: 535,
    connectorTypes: ['CCS2', 'Type2'],
    imageUrl: '/images/vehicles/tata-nexon-ev.webp',
  },

  // Hyundai
  {
    id: 'hyundai-ioniq5',
    make: 'Hyundai',
    model: 'IONIQ 5 RWD',
    year: 2024,
    batteryCapacityKwh: 72.6,
    rangKm: 631,
    connectorTypes: ['CCS2', 'Type2'],
    imageUrl: '/images/vehicles/hyundai-ioniq5.webp',
  },
  {
    id: 'hyundai-kona-ev',
    make: 'Hyundai',
    model: 'Kona Electric Premium',
    year: 2023,
    batteryCapacityKwh: 39.2,
    rangKm: 452,
    connectorTypes: ['CCS2', 'Type2'],
    imageUrl: '/images/vehicles/hyundai-kona.webp',
  },

  // Kia
  {
    id: 'kia-ev6-gt-line',
    make: 'Kia',
    model: 'EV6 GT-Line AWD',
    year: 2024,
    batteryCapacityKwh: 77.4,
    rangKm: 708,
    connectorTypes: ['CCS2', 'Type2'],
    imageUrl: '/images/vehicles/kia-ev6.webp',
  },

  // BYD
  {
    id: 'byd-atto3-superior',
    make: 'BYD',
    model: 'Atto 3 Superior',
    year: 2024,
    batteryCapacityKwh: 60.48,
    rangKm: 521,
    connectorTypes: ['CCS2', 'GB/T', 'Type2'],
    imageUrl: '/images/vehicles/byd-atto3.webp',
  },
  {
    id: 'byd-seal-awd',
    make: 'BYD',
    model: 'Seal Performance AWD',
    year: 2024,
    batteryCapacityKwh: 82.56,
    rangKm: 650,
    connectorTypes: ['CCS2', 'Type2'],
    imageUrl: '/images/vehicles/byd-atto3.webp',
  },

  // Tesla
  {
    id: 'tesla-model-3-lr',
    make: 'Tesla',
    model: 'Model 3 Long Range',
    year: 2024,
    batteryCapacityKwh: 75,
    rangKm: 602,
    connectorTypes: ['CCS2', 'Type2'],
    imageUrl: '/images/vehicles/tesla-model3.webp',
  },
  {
    id: 'tesla-model-y-perf',
    make: 'Tesla',
    model: 'Model Y Performance',
    year: 2024,
    batteryCapacityKwh: 75,
    rangKm: 533,
    connectorTypes: ['CCS2', 'Type2'],
    imageUrl: '/images/vehicles/tesla-model3.webp',
  },

  // BMW & Luxury EVs
  {
    id: 'bmw-i4-edrive40',
    make: 'BMW',
    model: 'i4 eDrive40 M Sport',
    year: 2024,
    batteryCapacityKwh: 83.9,
    rangKm: 590,
    connectorTypes: ['CCS2', 'Type2'],
    imageUrl: '/images/vehicles/kia-ev6.webp',
  },

  // 2-Wheelers
  {
    id: 'ather-450x-apex',
    make: 'Ather',
    model: 'Ather 450X Apex',
    year: 2024,
    batteryCapacityKwh: 3.7,
    rangKm: 150,
    connectorTypes: ['Type2', 'Bharat AC-001'],
    imageUrl: '/images/vehicles/tata-punch-ev.webp',
  },
  {
    id: 'ola-s1-pro-gen2',
    make: 'Ola Electric',
    model: 'Ola S1 Pro Gen 2',
    year: 2024,
    batteryCapacityKwh: 4.0,
    rangKm: 195,
    connectorTypes: ['Type2', 'Bharat AC-001'],
    imageUrl: '/images/vehicles/tata-punch-ev.webp',
  },
];

export function getEvModelById(id: string): EVModel | undefined {
  return EV_MODELS.find((m) => m.id === id);
}

export function getEvModelsByMake(make: string): EVModel[] {
  return EV_MODELS.filter((m) => m.make.toLowerCase() === make.toLowerCase());
}
