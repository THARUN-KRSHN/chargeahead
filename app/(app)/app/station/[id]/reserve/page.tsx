'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronLeft, Clock, Zap, CreditCard, Check, Sparkles, Navigation, AlertCircle, MapPin, Building2 } from 'lucide-react';
import { fetchStationById, fetchPaymentMethods, createBooking, processPayment } from '@/lib/mock/api';
import type { ChargingStation, PaymentMethod, ChargerPort } from '@/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useVehicleStore } from '@/lib/store/vehicleStore';
import { addHours } from 'date-fns';
import { getGeminiBookingRecommendation, formatSlotClockTime, type GeminiBookingRecommendation } from '@/lib/api/geminiBookingPlanner';

const TIME_SLOTS = ['Now', '30 min', '1 hour', '2 hours', '3 hours', 'Tomorrow 9AM', 'Tomorrow 2PM'];
const DURATIONS = ['30 min', '1 hour', '1.5 hours', '2 hours'];

const DURATION_HOURS_MAP: Record<string, number> = {
  '30 min': 0.5,
  '1 hour': 1.0,
  '1.5 hours': 1.5,
  '2 hours': 2.0,
};

export default function ReservePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { activeVehicle } = useVehicleStore();
  const [station, setStation] = useState<ChargingStation | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPort, setSelectedPort] = useState<ChargerPort | null>(null);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('Now');
  const [selectedDuration, setSelectedDuration] = useState('1 hour');
  const [selectedPaymentId, setSelectedPaymentId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  // Gemini AI recommendation state
  const [aiRecommendation, setAiRecommendation] = useState<GeminiBookingRecommendation | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    Promise.all([fetchStationById(id), fetchPaymentMethods()]).then(([s, pm]) => {
      setStation(s);
      const availablePort = s.ports.find(p => p.status === 'available') ?? s.ports[0];
      setSelectedPort(availablePort);
      setPaymentMethods(pm);
      setSelectedPaymentId(pm.find(p => p.isDefault)?.id ?? pm[0]?.id ?? '');

      // Load Gemini booking AI advisor recommendation with location details
      if (s && availablePort) {
        setAiLoading(true);
        getGeminiBookingRecommendation(s, availablePort, activeVehicle)
          .then((rec) => {
            setAiRecommendation(rec);
            if (rec.recommendedSlot && TIME_SLOTS.includes(rec.recommendedSlot)) {
              setSelectedTimeSlot(rec.recommendedSlot);
            }
          })
          .catch((err) => console.warn('Gemini booking recommendation error:', err))
          .finally(() => setAiLoading(false));
      }
    }).finally(() => setLoading(false));
  }, [id, activeVehicle]);

  // Recalculate Gemini AI recommendation when port changes
  const handlePortSelect = (port: ChargerPort) => {
    setSelectedPort(port);
    if (station) {
      setAiLoading(true);
      getGeminiBookingRecommendation(station, port, activeVehicle)
        .then((rec) => setAiRecommendation(rec))
        .catch((err) => console.warn('Gemini recommendation error:', err))
        .finally(() => setAiLoading(false));
    }
  };

  // Dynamic Price Calculation
  const batteryCap = activeVehicle?.evModel?.batteryCapacityKwh ?? 40;
  const durationHours = DURATION_HOURS_MAP[selectedDuration] ?? 1.0;
  const maxKwDelivered = selectedPort ? selectedPort.speedKw * durationHours : 20;
  const estimatedKwh = Math.min(maxKwDelivered, batteryCap * 0.65);
  
  const baseRatePerKwh = selectedPort?.pricePerKwh ?? 18;
  const baseCost = Math.round(estimatedKwh * baseRatePerKwh);

  const slotAnalysis = aiRecommendation?.slotAnalyses[selectedTimeSlot];
  const priceMultiplier = slotAnalysis?.priceMultiplier ?? 1.0;
  const trafficSurcharge = Math.round(baseCost * (priceMultiplier - 1.0));
  const totalCost = Math.max(60, baseCost + trafficSurcharge);

  const handleConfirmBooking = async () => {
    if (!selectedPort || !station) return;
    setBookingLoading(true);
    try {
      await processPayment(totalCost, selectedPaymentId);
      const booking = await createBooking({
        stationId: station.id,
        portId: selectedPort.id,
        startTime: new Date().toISOString(),
        endTime: addHours(new Date(), durationHours).toISOString(),
        vehicleId: activeVehicle?.id ?? 'uv-001',
        paymentMethodId: selectedPaymentId,
        estimatedCostInr: totalCost,
      });
      toast.success('Booking confirmed! Check your QR code. ⚡');
      router.push(`/app/bookings/${booking.id}`);
    } catch (err: any) {
      toast.error(err.message ?? 'Booking failed. Please try again.');
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading || !station) {
    return (
      <div className="p-4 space-y-4 bg-white min-h-dvh">
        <div className="skeleton h-10 rounded-xl w-32" />
        <div className="skeleton h-48 rounded-2xl" />
        <div className="skeleton h-32 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh pb-6 bg-white text-black">
      {/* Header */}
      <div className="sticky top-16 z-20 flex items-center gap-3 px-4 py-4 bg-white border-b border-gray-200">
        <button onClick={() => step === 2 ? setStep(1) : router.back()} className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center border border-gray-200">
          <ChevronLeft className="w-5 h-5 text-black" />
        </button>
        <div>
          <h1 className="font-extrabold text-black">Reserve Slot</h1>
          <p className="text-xs text-gray-500 font-bold">{station.name}</p>
        </div>
        {/* Step indicator */}
        <div className="ml-auto flex items-center gap-1.5">
          {[1, 2].map((s) => (
            <div key={s} className={cn('w-2 h-2 rounded-full transition-all', step >= s ? 'bg-black' : 'bg-gray-300')} />
          ))}
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {step === 1 ? (
          <>
            {/* Gemini AI Road & Traffic Smart Advisor Card */}
            <div className="bg-gradient-to-br from-slate-900 via-gray-900 to-black text-white rounded-2xl p-4 shadow-lg border border-gray-800">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white animate-pulse" />
                  </div>
                  <div>
                    <h2 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                      Gemini AI Traffic & Timing Advisor
                      <span className="text-[10px] font-bold bg-purple-500/30 text-purple-300 px-2 py-0.5 rounded-full border border-purple-400/30">Live AI</span>
                    </h2>
                    <p className="text-[11px] text-gray-400 font-medium">Road traffic analysis & slot optimization</p>
                  </div>
                </div>
                {aiLoading && (
                  <div className="w-4 h-4 border-2 border-purple-400 border-t-transparent rounded-full animate-spin" />
                )}
              </div>

              {aiRecommendation && (
                <div className="space-y-3 pt-1 border-t border-gray-800/80">
                  <div className="flex items-start gap-2 bg-white/5 rounded-xl p-2.5 text-xs text-gray-200">
                    <Navigation className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-purple-300">Road & Traffic Status: </span>
                      {aiRecommendation.trafficSummary}
                    </div>
                  </div>

                  {selectedPort && (
                    <div className="flex items-center gap-2 text-[11px] text-gray-300 bg-purple-950/20 px-2.5 py-1.5 rounded-lg border border-purple-800/30">
                      <MapPin className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                      <span className="truncate">
                        <strong className="text-white">Target Bay:</strong> {selectedPort.bayLocation ?? 'Bay 1 (Main Canopy)'}
                        {selectedPort.landmarkNote ? ` · ${selectedPort.landmarkNote}` : ''}
                      </span>
                    </div>
                  )}

                  <div className="flex items-center justify-between bg-purple-950/40 border border-purple-800/40 rounded-xl p-3">
                    <div>
                      <div className="text-[11px] text-purple-300 font-extrabold uppercase tracking-wide">Recommended Accurate Slot</div>
                      <div className="text-base font-black text-white flex items-center gap-2 mt-0.5">
                        <span>{aiRecommendation.recommendedSlot}</span>
                        <span className="text-xs text-purple-300 font-mono">
                          ({aiRecommendation.slotAnalyses[aiRecommendation.recommendedSlot]?.clockTime ?? formatSlotClockTime(aiRecommendation.recommendedSlot)})
                        </span>
                        {slotAnalysis?.priceMultiplier && slotAnalysis.priceMultiplier < 1.0 && (
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">Tariff discount</span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-300 font-medium mt-1">{aiRecommendation.geminiAdvice}</p>
                    </div>

                    {selectedTimeSlot !== aiRecommendation.recommendedSlot && (
                      <button
                        onClick={() => setSelectedTimeSlot(aiRecommendation.recommendedSlot)}
                        className="shrink-0 px-3 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white rounded-xl text-xs font-black shadow-md transition-all flex items-center gap-1"
                      >
                        Apply <Sparkles className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Charger Selection with Location Details */}
            <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-extrabold text-black text-sm">Select Charger & Bay Location</h2>
                <span className="text-[11px] text-gray-500 font-bold">{station.ports.filter(p => p.status !== 'offline').length} active ports</span>
              </div>

              {/* Station location header note */}
              <div className="flex items-start gap-2 bg-gray-50 rounded-xl p-2.5 border border-gray-200 text-xs text-gray-600">
                <Building2 className="w-4 h-4 text-black shrink-0 mt-0.5" />
                <div>
                  <span className="font-extrabold text-black">{station.name}</span>
                  <div className="text-[11px] text-gray-500 font-medium mt-0.5">{station.address}, {station.city}</div>
                </div>
              </div>

              <div className="space-y-2">
                {station.ports.filter(p => p.status !== 'offline').map((port, idx) => {
                  const bayName = port.bayLocation ?? `Bay ${idx + 1} (${port.chargerSpeed === 'ultra-fast' ? 'Express Canopy' : 'Ground Floor'})`;
                  const landmark = port.landmarkNote ?? (idx === 0 ? 'Main Plaza Entrance · Near Restrooms' : 'East Wing Parking · Adjacent to Coffee Shop');

                  return (
                    <button
                      key={port.id}
                      onClick={() => handlePortSelect(port)}
                      disabled={port.status === 'busy' && !station.isReservable}
                      className={cn('w-full flex items-start gap-3 p-3.5 rounded-xl border transition-all text-left',
                        selectedPort?.id === port.id ? 'border-black bg-gray-50/80 ring-1 ring-black/10' : 'border-gray-200 hover:border-black'
                      )}
                    >
                      <div className={cn('w-3 h-3 rounded-full shrink-0 mt-1.5', port.status === 'available' ? 'bg-emerald-500' : port.status === 'busy' ? 'bg-amber-500' : 'bg-red-500')} />
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-extrabold text-black">{port.connectorType}</span>
                            <span className="text-[10px] font-bold bg-black text-white px-2 py-0.5 rounded-md">{port.speedKw} kW</span>
                            {port.status === 'busy' && <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">In Use</span>}
                          </div>
                          <span className="text-sm font-black text-black">₹{port.pricePerKwh}/kWh</span>
                        </div>

                        {/* Exact Charger Location Details */}
                        <div className="space-y-0.5 pt-0.5">
                          <div className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-black shrink-0" />
                            <span>{bayName}</span>
                          </div>
                          <div className="text-[11px] text-gray-500 font-medium pl-5">
                            Landmark: {landmark}
                          </div>
                        </div>
                      </div>
                      {selectedPort?.id === port.id && <Check className="w-4 h-4 text-black shrink-0 mt-1" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time Slot with Accurate Clock Timing */}
            <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-extrabold text-black text-sm flex items-center gap-2">
                  <Clock className="w-4 h-4 text-black" /> Select Time Slot (Accurate Clock Timing)
                </h2>
                {slotAnalysis && (
                  <span className={cn('text-[10px] font-extrabold px-2.5 py-1 rounded-full border',
                    slotAnalysis.trafficLevel === 'Low' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                    slotAnalysis.trafficLevel === 'Moderate' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    'bg-amber-50 text-amber-800 border-amber-200'
                  )}>
                    Traffic: {slotAnalysis.trafficLevel}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {TIME_SLOTS.map((slot) => {
                  const isAiPick = aiRecommendation?.recommendedSlot === slot;
                  const slotInfo = aiRecommendation?.slotAnalyses[slot];
                  const clockTimeDisplay = slotInfo?.clockTime ?? formatSlotClockTime(slot);

                  return (
                    <button
                      key={slot}
                      onClick={() => setSelectedTimeSlot(slot)}
                      className={cn('p-3 rounded-xl border text-left transition-all flex flex-col justify-between relative',
                        selectedTimeSlot === slot
                          ? 'border-black bg-black text-white shadow-sm'
                          : 'border-gray-200 text-gray-800 hover:border-black bg-white',
                        isAiPick && selectedTimeSlot !== slot && 'border-purple-500 ring-2 ring-purple-500/20'
                      )}
                    >
                      <div className="flex items-center justify-between w-full mb-1">
                        <span className="text-xs font-black">{slot}</span>
                        {isAiPick && (
                          <span className={cn('text-[9px] px-1.5 py-0.5 rounded font-black uppercase',
                            selectedTimeSlot === slot ? 'bg-purple-500 text-white' : 'bg-purple-100 text-purple-800'
                          )}>
                            AI Pick ✨
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between w-full">
                        <span className={cn('text-[11px] font-mono font-bold', selectedTimeSlot === slot ? 'text-gray-300' : 'text-gray-500')}>
                          {clockTimeDisplay}
                        </span>
                        {slotInfo && slotInfo.priceMultiplier !== 1.0 && (
                          <span className={cn('text-[9px] font-black px-1 rounded',
                            slotInfo.priceMultiplier > 1.0
                              ? (selectedTimeSlot === slot ? 'text-amber-300' : 'text-amber-600')
                              : (selectedTimeSlot === slot ? 'text-emerald-300' : 'text-emerald-600')
                          )}>
                            {slotInfo.priceMultiplier > 1.0 ? `+${Math.round((slotInfo.priceMultiplier - 1) * 100)}%` : `-${Math.round((1 - slotInfo.priceMultiplier) * 100)}%`}
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {slotAnalysis?.reason && (
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs text-gray-700 space-y-1">
                  <div className="flex items-center justify-between font-extrabold text-black">
                    <span>Selected Slot Timing: {selectedTimeSlot} ({slotAnalysis.clockTime})</span>
                    <span className="text-[10px] text-gray-500">Wait: ~{slotAnalysis.estimatedWaitMin} min</span>
                  </div>
                  <p className="text-gray-600 text-[11px]">{slotAnalysis.reason}</p>
                </div>
              )}
            </div>

            {/* Duration */}
            <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
              <h2 className="font-extrabold text-black text-sm mb-3">For how long?</h2>
              <div className="grid grid-cols-4 gap-2">
                {DURATIONS.map((d) => (
                  <button
                    key={d}
                    onClick={() => setSelectedDuration(d)}
                    className={cn('py-2.5 rounded-xl text-xs font-extrabold border transition-all',
                      selectedDuration === d ? 'border-black bg-black text-white' : 'border-gray-200 text-gray-700 hover:border-black'
                    )}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic Cost Estimate Breakdown */}
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-500 font-bold mb-0.5">Calculated Total Price</div>
                  <div className="text-3xl font-black text-black">₹{totalCost}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500 font-bold mb-0.5">Est. Energy</div>
                  <div className="text-sm font-extrabold text-black">{estimatedKwh.toFixed(1)} kWh</div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-2 space-y-1 text-xs">
                <div className="flex justify-between text-gray-600 font-medium">
                  <span>Base Energy ({estimatedKwh.toFixed(1)} kWh × ₹{baseRatePerKwh})</span>
                  <span>₹{baseCost}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span className="flex items-center gap-1 text-purple-700">
                    <Sparkles className="w-3 h-3" /> Traffic & Tariff Adjustment
                  </span>
                  <span className={trafficSurcharge > 0 ? 'text-amber-600' : trafficSurcharge < 0 ? 'text-emerald-600' : 'text-gray-600'}>
                    {trafficSurcharge > 0 ? `+₹${trafficSurcharge} (Traffic Rush)` : trafficSurcharge < 0 ? `-₹${Math.abs(trafficSurcharge)} (Off-Peak Discount)` : '₹0 (Standard)'}
                  </span>
                </div>
              </div>

              <p className="text-[10px] text-gray-500 font-medium">Calculated taking live traffic congestion, station queue length, and bay availability into account.</p>
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full py-3.5 rounded-xl bg-black text-white font-extrabold text-sm hover:bg-gray-900 transition-all shadow-md"
            >
              Continue to Payment →
            </button>
          </>
        ) : (
          /* Step 2: Payment */
          <>
            {/* Booking summary with charger location details */}
            <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm space-y-3">
              <h2 className="font-extrabold text-black text-sm">Booking Summary</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500 font-bold">Station</span><span className="text-black font-extrabold text-right">{station.name}</span></div>
                <div className="flex justify-between"><span className="text-gray-500 font-bold">Connector</span><span className="text-black font-extrabold">{selectedPort?.connectorType} · {selectedPort?.speedKw} kW</span></div>
                <div className="flex justify-between"><span className="text-gray-500 font-bold">Charger Location</span><span className="text-black font-extrabold text-right">{selectedPort?.bayLocation ?? 'Bay 1'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500 font-bold">Landmark Note</span><span className="text-gray-700 font-medium text-right text-xs max-w-[200px]">{selectedPort?.landmarkNote ?? 'Main Plaza Canopy'}</span></div>
                <div className="flex justify-between"><span className="text-gray-500 font-bold">Scheduled Time</span><span className="text-black font-extrabold">{selectedTimeSlot} ({slotAnalysis?.clockTime ?? formatSlotClockTime(selectedTimeSlot)})</span></div>
                <div className="flex justify-between"><span className="text-gray-500 font-bold">Duration</span><span className="text-black font-extrabold">{selectedDuration}</span></div>
                <div className="flex justify-between border-t border-gray-200 pt-2 mt-2">
                  <span className="text-gray-500 font-bold">Total Payable</span>
                  <span className="text-black font-extrabold text-base">₹{totalCost}</span>
                </div>
              </div>
            </div>

            {/* Payment method */}
            <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
              <h2 className="font-extrabold text-black text-sm mb-3 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-black" /> Payment Method
              </h2>
              <div className="space-y-2">
                {paymentMethods.map((pm) => (
                  <button
                    key={pm.id}
                    onClick={() => setSelectedPaymentId(pm.id)}
                    className={cn('w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left',
                      selectedPaymentId === pm.id ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-black'
                    )}
                  >
                    <div className="w-8 h-8 rounded-lg bg-black flex items-center justify-center">
                      <CreditCard className="w-4 h-4 text-white" />
                    </div>
                    <span className="flex-1 text-sm font-extrabold text-black">{pm.label}</span>
                    {selectedPaymentId === pm.id && <Check className="w-4 h-4 text-black shrink-0" />}
                  </button>
                ))}
                <Link href="/app/wallet">
                  <button className="w-full text-center text-xs font-extrabold text-black hover:underline py-2 transition-colors">
                    + Add payment method
                  </button>
                </Link>
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleConfirmBooking}
              disabled={bookingLoading || !selectedPaymentId}
              className="w-full py-3.5 rounded-xl bg-black text-white font-extrabold text-sm hover:bg-gray-900 disabled:opacity-60 flex items-center justify-center gap-2 shadow-md"
            >
              {bookingLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Pay ₹{totalCost} & Confirm</>
              )}
            </motion.button>
          </>
        )}
      </div>
    </div>
  );
}
