'use client';

export default function TermsOfServicePage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12 md:py-20 space-y-6 text-gray-700 text-sm leading-relaxed bg-white">
      <h1 className="text-3xl font-extrabold text-black">Terms of Service</h1>
      <p className="text-xs text-gray-500 font-bold">Last updated: September 2026</p>

      <p className="font-medium">
        By accessing or using the ChargeAhead platform, web app, or API endpoints, you agree to be bound by these Terms of Service.
      </p>

      <h2 className="text-lg font-extrabold text-black pt-2">1. Predictive Accuracy Disclaimer</h2>
      <p className="font-medium">
        While ChargeAhead's usability confidence engine strives for maximum precision, live station status depends on network telemetry and operator uptime. ChargeAhead is not liable for third-party CPO power grid failures.
      </p>

      <h2 className="text-lg font-extrabold text-black pt-2">2. Station Reservations</h2>
      <p className="font-medium">
        Port hold reservations guarantee slot allocation for up to 30 minutes from booking. Unclaimed reservations after the grace period may be released to prevent queue blockage.
      </p>
    </div>
  );
}
