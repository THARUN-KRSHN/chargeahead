'use client';

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 md:py-20 space-y-6 text-white/70 text-sm leading-relaxed">
      <h1 className="text-3xl font-extrabold text-white">Privacy Policy</h1>
      <p className="text-xs text-white/40">Last updated: September 2026</p>

      <p>
        At ChargeAhead Technologies Inc., we respect your privacy and are committed to protecting the telemetry and location data of your electric vehicle.
      </p>

      <h2 className="text-lg font-bold text-white pt-2">1. Data We Collect</h2>
      <p>
        We collect location data exclusively while active navigation or trip planning is enabled to calculate accurate station arrival ETAs and battery level estimates.
      </p>

      <h2 className="text-lg font-bold text-white pt-2">2. How We Use Telemetry</h2>
      <p>
        Vehicle telemetry (battery SOC %, maximum charging rate, connector type) is used strictly to match your EV with compatible charging stations and optimize trip itineraries.
      </p>

      <h2 className="text-lg font-bold text-white pt-2">3. Third-Party CPO Networks</h2>
      <p>
        When reserving a port or initiating a charging session, necessary station identification codes are transmitted to participating Charge Point Operators via encrypted OCPI protocol channels.
      </p>
    </div>
  );
}
