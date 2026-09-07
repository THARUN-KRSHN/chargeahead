'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ChevronLeft, Clock, Zap, CreditCard, Check, Calendar } from 'lucide-react';
import { fetchStationById, fetchPaymentMethods, createBooking, processPayment } from '@/lib/mock/api';
import type { ChargingStation, PaymentMethod, ChargerPort } from '@/types';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useVehicleStore } from '@/lib/store/vehicleStore';
import { addHours, format, addMinutes } from 'date-fns';

const TIME_SLOTS = ['Now', '30 min', '1 hour', '2 hours', '3 hours', 'Tomorrow 9AM', 'Tomorrow 2PM'];
const DURATIONS = ['30 min', '1 hour', '1.5 hours', '2 hours'];

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

  useEffect(() => {
    Promise.all([fetchStationById(id), fetchPaymentMethods()]).then(([s, pm]) => {
      setStation(s);
      const availablePort = s.ports.find(p => p.status === 'available') ?? s.ports[0];
      setSelectedPort(availablePort);
      setPaymentMethods(pm);
      setSelectedPaymentId(pm.find(p => p.isDefault)?.id ?? pm[0]?.id ?? '');
    }).finally(() => setLoading(false));
  }, [id]);

  const estimatedCost = selectedPort ? Math.round(selectedPort.pricePerKwh * (activeVehicle?.evModel?.batteryCapacityKwh ?? 40) * 0.35) : 0;

  const handleConfirmBooking = async () => {
    if (!selectedPort) return;
    setBookingLoading(true);
    try {
      await processPayment(estimatedCost, selectedPaymentId);
      const booking = await createBooking({
        portId: selectedPort.id,
        startTime: new Date().toISOString(),
        endTime: addHours(new Date(), 1).toISOString(),
        vehicleId: activeVehicle?.id ?? 'uv-001',
        paymentMethodId: selectedPaymentId,
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
            {/* Port selection */}
            <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
              <h2 className="font-extrabold text-black text-sm mb-3">Select Charger</h2>
              <div className="space-y-2">
                {station.ports.filter(p => p.status !== 'offline').map((port) => (
                  <button
                    key={port.id}
                    onClick={() => setSelectedPort(port)}
                    disabled={port.status === 'busy' && !station.isReservable}
                    className={cn('w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left',
                      selectedPort?.id === port.id ? 'border-black bg-gray-50' : 'border-gray-200 hover:border-black'
                    )}
                  >
                    <div className={cn('w-3 h-3 rounded-full shrink-0', port.status === 'available' ? 'bg-emerald-500' : port.status === 'busy' ? 'bg-amber-500' : 'bg-red-500')} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold text-black">{port.connectorType}</span>
                        <span className="text-[10px] font-bold bg-gray-100 text-gray-700 px-2 py-0.5 rounded">{port.speedKw} kW</span>
                        {port.status === 'busy' && <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded">Busy</span>}
                      </div>
                      <span className="text-xs text-gray-500 font-bold">₹{port.pricePerKwh}/kWh</span>
                    </div>
                    {selectedPort?.id === port.id && <Check className="w-4 h-4 text-black shrink-0" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Time slot */}
            <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm">
              <h2 className="font-extrabold text-black text-sm mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-black" /> When?
              </h2>
              <div className="flex flex-wrap gap-2">
                {TIME_SLOTS.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => setSelectedTimeSlot(slot)}
                    className={cn('px-3.5 py-2 rounded-xl text-xs font-extrabold border transition-all',
                      selectedTimeSlot === slot ? 'border-black bg-black text-white' : 'border-gray-200 text-gray-700 hover:border-black'
                    )}
                  >
                    {slot}
                  </button>
                ))}
              </div>
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

            {/* Cost estimate */}
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-gray-500 font-bold mb-0.5">Estimated cost</div>
                  <div className="text-2xl font-extrabold text-black">₹{estimatedCost}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500 font-bold mb-0.5">Session fee</div>
                  <div className="text-sm font-extrabold text-black">Included</div>
                </div>
              </div>
              <p className="text-[10px] text-gray-500 font-medium mt-2">Actual cost depends on energy consumed. Estimate based on ~35% charge to 80%.</p>
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
            {/* Booking summary */}
            <div className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm space-y-3">
              <h2 className="font-extrabold text-black text-sm">Booking Summary</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500 font-bold">Station</span><span className="text-black font-extrabold">{station.name}</span></div>
                <div className="flex justify-between"><span className="text-gray-500 font-bold">Connector</span><span className="text-black font-extrabold">{selectedPort?.connectorType} · {selectedPort?.speedKw} kW</span></div>
                <div className="flex justify-between"><span className="text-gray-500 font-bold">Time</span><span className="text-black font-extrabold">{selectedTimeSlot}</span></div>
                <div className="flex justify-between"><span className="text-gray-500 font-bold">Duration</span><span className="text-black font-extrabold">{selectedDuration}</span></div>
                <div className="flex justify-between border-t border-gray-200 pt-2 mt-2">
                  <span className="text-gray-500 font-bold">Estimated Total</span>
                  <span className="text-black font-extrabold text-base">₹{estimatedCost}</span>
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
                <>Pay ₹{estimatedCost} & Confirm</>
              )}
            </motion.button>
          </>
        )}
      </div>
    </div>
  );
}
