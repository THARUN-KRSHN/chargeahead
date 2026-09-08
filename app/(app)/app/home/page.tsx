'use client';

import { useState, useEffect } from 'react';
import { InteractiveMap } from '@/components/shared/InteractiveMap';
import { LeftTripPlannerPanel } from '@/components/map/LeftTripPlannerPanel';
import { RightNavigationPanel } from '@/components/map/RightNavigationPanel';
import { StationDetailsModal } from '@/components/shared/StationDetailsModal';
import { fetchOCMStations } from '@/lib/api/openChargeMap';
import type { ChargingStation, LatLng } from '@/types';
import { computeRealEVRoute, reverseGeocodeReal, type RealRoutePlan, type RealPlace } from '@/lib/api/geoServices';
import { useVehicleStore } from '@/lib/store/vehicleStore';
import { MOCK_VEHICLES } from '@/lib/mock/users';
import { toast } from 'sonner';

const BENGALURU_CENTER: LatLng = { lat: 12.9716, lng: 77.5946 };

export default function HomePage() {
  const { activeVehicle } = useVehicleStore();
  const [stations, setStations] = useState<ChargingStation[]>([]);
  const [leftPanelOpen, setLeftPanelOpen] = useState(false);
  const [routePlan, setRoutePlan] = useState<RealRoutePlan | null>(null);
  const [activeJourney, setActiveJourney] = useState<RealRoutePlan | null>(null);
  const [userLocation, setUserLocation] = useState<LatLng>(BENGALURU_CENTER);
  const [selectedStation, setSelectedStation] = useState<ChargingStation | null>(null);

  // Fetch initial live OCM stations around user center
  useEffect(() => {
    fetchOCMStations({
      latitude: BENGALURU_CENTER.lat,
      longitude: BENGALURU_CENTER.lng,
      distance: 60,
      maxResults: 30,
    }).then(setStations);

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setUserLocation(coords);
          fetchOCMStations({
            latitude: coords.lat,
            longitude: coords.lng,
            distance: 60,
            maxResults: 35,
          }).then((res) => {
            if (res.length > 0) setStations(res);
          });
        },
        () => {}
      );
    }
  }, []);

  const currentPlan = activeJourney || routePlan;

  const handleSelectAsStop = async (station: ChargingStation) => {
    setSelectedStation(null);
    toast.loading(`Rerouting map to include ${station.name}...`, { id: 'reroute-stop' });

    try {
      const vehicle = activeVehicle || MOCK_VEHICLES[0];

      if (currentPlan) {
        // Recalculate existing trip inserting selected station as forced charging stop
        const updatedPlan = await computeRealEVRoute(
          currentPlan.origin,
          currentPlan.destination,
          vehicle,
          currentPlan.startChargePercent,
          station
        );
        setRoutePlan(updatedPlan);
        if (activeJourney) setActiveJourney(updatedPlan);
        setLeftPanelOpen(true);
        toast.success(`Map rerouted via ${station.name}! ⚡`, { id: 'reroute-stop' });
      } else {
        // Direct route to this station from current user location
        const originPlace: RealPlace = await reverseGeocodeReal(userLocation.lat, userLocation.lng);
        const destPlace: RealPlace = {
          id: station.id,
          label: station.name,
          address: station.address,
          coords: station.coordinates,
        };
        const newPlan = await computeRealEVRoute(originPlace, destPlace, vehicle, 65, station);
        setRoutePlan(newPlan);
        setLeftPanelOpen(true);
        toast.success(`Map rerouted to ${station.name}! ⚡`, { id: 'reroute-stop' });
      }
    } catch (err) {
      console.error('Reroute error:', err);
      toast.error('Could not reroute to station. Please try again.', { id: 'reroute-stop' });
    }
  };

  return (
    <div className="relative w-full h-[calc(100vh-64px)] overflow-hidden bg-slate-950 flex">
      {/* Interactive Map */}
      <div className="relative flex-1 h-full">
        <InteractiveMap
          center={userLocation}
          stations={
            currentPlan
              ? [
                  ...currentPlan.stops.map((s) => s.station),
                  ...(currentPlan.allEnrouteStations || []),
                  ...stations,
                ]
              : stations
          }
          routeGeometry={currentPlan?.routeGeometry}
          origin={currentPlan?.origin.coords}
          destination={currentPlan?.destination.coords}
          activeVehiclePos={activeJourney ? currentPlan?.origin.coords : undefined}
          onStationClick={(station) => {
            setSelectedStation(station);
          }}
          className="w-full h-full"
        />
      </div>

      {/* Left Trip Planner Panel */}
      <LeftTripPlannerPanel
        isOpen={leftPanelOpen}
        onToggle={setLeftPanelOpen}
        onRouteCalculated={(plan) => {
          setRoutePlan(plan);
        }}
        onStartJourney={(plan) => {
          setActiveJourney(plan);
          setLeftPanelOpen(false);
        }}
      />

      {/* Right Navigation & Driver Co-pilot Panel */}
      {activeJourney && (
        <RightNavigationPanel
          plan={activeJourney}
          onEndJourney={() => {
            setActiveJourney(null);
            setRoutePlan(null);
          }}
        />
      )}

      {/* Station Details Modal on Pin Click */}
      {selectedStation && (
        <StationDetailsModal
          station={selectedStation}
          onClose={() => setSelectedStation(null)}
          onSelectAsStop={handleSelectAsStop}
        />
      )}
    </div>
  );
}
