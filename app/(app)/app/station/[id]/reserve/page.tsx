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

  const estimatedCost = selectedPort ? Math.round(selectedPort.pricePerKwh * (activeVehicle?.evModel.batteryCapacityKwh ?? 40) * 0.35) : 0;

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
      <div className="p-4 space-y-4">
        <div className="skeleton h-10 rounded-xl w-32" />
        <div className="skeleton h-48 rounded-2xl" />
        <div className="skeleton h-32 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh pb-6">
      {/* Header */}
      <div className="sticky top-16 z-20 flex items-center gap-3 px-4 py-4 bg-navy-900 border-b border-surface-border">
        <button onClick={() => step === 2 ? setStep(1) : router.back()} className="w-9 h-9 rounded-xl bg-surface-card flex items-center justify-center border border-surface-border">
          <ChevronLeft className="w-5 h-5 text-white" />
        </button>
        <div>
          <h1 className="font-bold text-white">Reserve Slot</h1>
          <p className="text-xs text-white/50">{station.name}</p>
        </div>
        {/* Step indicator */}
        <div className="ml-auto flex items-center gap-1.5">
          {[1, 2].map((s) => (
            <div key={s} className={cn('w-2 h-2 rounded-full transition-all', step >= s ? 'bg-mint-400' : 'bg-surface-border')} />
          ))}
        </div>
      </div>

      <div className="px-4 pt-4 space-y-4">
        {step === 1 ? (
          <>
            {/* Port selection */}
            <div className="glass-card rounded-2xl p-4">
              <h2 className="font-semibold text-white text-sm mb-3">Select Charger</h2>
              <div className="space-y-2">
                {station.ports.filter(p => p.status !== 'offline').map((port) => (
                  <button
                    key={port.id}
                    onClick={() => setSelectedPort(port)}
                    disabled={port.status === 'busy' && !station.isReservable}
                    className={cn('w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left',
                      selectedPort?.id === port.id ? 'border-mint-400/50 bg-mint-400/8' : 'border-surface-border hover:border-white/20'
                    )}
                  >
                    <div className={cn('w-3 h-3 rounded-full shrink-0', port.status === 'available' ? 'bg-mint-400' : port.status === 'busy' ? 'bg-amber-400' : 'bg-red-400')} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">{port.connectorType}</span>
                        <span className="connector-badge text-[10px]">{port.speedKw} kW</span>
                        {port.status === 'busy' && <span className="connector-badge status-busy text-[10px]">Busy</span>}
                      </div>
                      <span className="text-xs text-white/40">₹{port.pricePerKwh}/kWh</span>
                    </div>
                    {selectedPort?.id === port.id && <Check className="w-4 h-4 text-mint-400 shrink-0" />}
                  </button>
                ))}
              </div>
            </div>

            {/* Time slot */}
            <div className="glass-card rounded-2xl p-4">
              <h2 className="font-semibold text-white text-sm mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-teal-300" /> When?
              </h2>
              <div className="flex flex-wrap gap-2">
                {TIME_SLOTS.map((slot) => (
                  <button
                    key={slot}
                    onClick={() => setSelectedTimeSlot(slot)}
                    className={cn('px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all',
                      selectedTimeSlot === slot ? 'border-mint-400/50 bg-mint-400/10 text-mint-400' : 'border-surface-border text-white/60 hover:border-white/20'
                    )}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>

            {/* Duration */}
            <div className="glass-card rounded-2xl p-4">
              <h2 className="font-semibold text-white text-sm mb-3">For how long?</h2>
              <div className="grid grid-cols-4 gap-2">
                {DURATIONS.map((d) => (
                  <button
                    key={d}
                    onClick={() => setSelectedDuration(d)}
                    className={cn('py-2.5 rounded-xl text-xs font-semibold border transition-all',
                      selectedDuration === d ? 'border-mint-400/50 bg-mint-400/10 text-mint-400' : 'border-surface-border text-white/60 hover:border-white/20'
                    )}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Cost estimate */}
            <div className="glass-card rounded-2xl p-4 border border-mint-400/15">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-white/50 mb-0.5">Estimated cost</div>
                  <div className="text-2xl font-bold text-mint-400">₹{estimatedCost}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-white/50 mb-0.5">Session fee</div>
                  <div className="text-sm font-semibold text-white">Included</div>
                </div>
              </div>
              <p className="text-[10px] text-white/30 mt-2">Actual cost depends on energy consumed. Estimate based on ~35% charge to 80%.</p>
            </div>

            <button
              onClick={() => setStep(2)}
              className="w-full py-3.5 rounded-xl bg-mint-gradient text-navy-900 font-bold text-sm hover:opacity-90 transition-opacity"
            >
              Continue to Payment →
            </button>
          </>
        ) : (
          /* Step 2: Payment */
          <>
            {/* Booking summary */}
            <div className="glass-card rounded-2xl p-4 space-y-3">
              <h2 className="font-semibold text-white text-sm">Booking Summary</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-white/50">Station</span><span className="text-white font-medium">{station.name}</span></div>
                <div className="flex justify-between"><span className="text-white/50">Connector</span><span className="text-white font-medium">{selectedPort?.connectorType} · {selectedPort?.speedKw} kW</span></div>
                <div className="flex justify-between"><span className="text-white/50">Time</span><span className="text-white font-medium">{selectedTimeSlot}</span></div>
                <div className="flex justify-between"><span className="text-white/50">Duration</span><span className="text-white font-medium">{selectedDuration}</span></div>
                <div className="flex justify-between border-t border-surface-border pt-2 mt-2">
                  <span className="text-white/50">Estimated Total</span>
                  <span className="text-mint-400 font-bold text-base">₹{estimatedCost}</span>
                </div>
              </div>
            </div>

            {/* Payment method */}
            <div className="glass-card rounded-2xl p-4">
              <h2 className="font-semibold text-white text-sm mb-3 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-teal-300" /> Payment Method
              </h2>
              <div className="space-y-2">
                {paymentMethods.map((pm) => (
                  <button
                    key={pm.id}
                    onClick={() => setSelectedPaymentId(pm.id)}
                    className={cn('w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left',
                      selectedPaymentId === pm.id ? 'border-mint-400/50 bg-mint-400/8' : 'border-surface-border hover:border-white/20'
                    )}
                  >
                    <div className="w-8 h-8 rounded-lg bg-teal-gradient flex items-center justify-center">
                      <CreditCard className="w-4 h-4 text-white" />
                    </div>
                    <span className="flex-1 text-sm font-medium text-white">{pm.label}</span>
                    {selectedPaymentId === pm.id && <Check className="w-4 h-4 text-mint-400 shrink-0" />}
                  </button>
                ))}
                <Link href="/app/wallet">
                  <button className="w-full text-center text-xs font-semibold text-teal-300 hover:text-teal-200 py-2 transition-colors">
                    + Add payment method
                  </button>
                </Link>
              </div>
            </div>

            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={handleConfirmBooking}
              disabled={bookingLoading || !selectedPaymentId}
              className="w-full py-3.5 rounded-xl bg-mint-gradient text-navy-900 font-bold text-sm hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2 shadow-mint-glow"
            >
              {bookingLoading ? (
                <div className="w-5 h-5 border-2 border-navy-900/30 border-t-navy-900 rounded-full animate-spin" />
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
