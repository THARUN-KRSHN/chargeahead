'use client';

export default function TermsOfServicePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 md:py-20 space-y-6 text-white/70 text-sm leading-relaxed">
      <h1 className="text-3xl font-extrabold text-white">Terms of Service</h1>
      <p className="text-xs text-white/40">Last updated: September 2026</p>

      <p>
        By accessing or using the ChargeAhead platform, web app, or API endpoints, you agree to be bound by these Terms of Service.
      </p>

      <h2 className="text-lg font-bold text-white pt-2">1. Predictive Accuracy Disclaimer</h2>
      <p>
        While ChargeAhead's usability confidence engine strives for maximum precision, live station status depends on network telemetry and operator uptime. ChargeAhead is not liable for third-party CPO power grid failures.
      </p>

      <h2 className="text-lg font-bold text-white pt-2">2. Station Reservations</h2>
      <p>
        Port hold reservations guarantee slot allocation for up to 30 minutes from booking. Unclaimed reservations after the grace period may be released to prevent queue blockage.
      </p>
    </div>
  );
}
