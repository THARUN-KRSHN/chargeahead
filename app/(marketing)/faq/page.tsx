'use client';

import { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const FAQS = [
  {
    q: 'How does ChargeAhead calculate the Confidence Score (Reliability Score)?',
    a: 'Our algorithm combines 4 live data signals: live CPO telemetry heartbeat, voltage stability over past 24 hours, active EV count en-route to the station, and driver community check-in reports submitted in the last 2 hours.',
  },
  {
    q: 'Does ChargeAhead work with all EV models in India?',
    a: 'Yes! ChargeAhead supports Tata Nexon EV, MG ZS EV, Hyundai IONIQ 5, BYD Atto 3, Mahindra XUV400, Kia EV6, Tesla, and all CCS2, Type 2, and CHAdeMO compatible electric vehicles.',
  },
  {
    q: 'Can I reserve a charger port before arriving?',
    a: 'Yes. For participating partner networks (Zeon, Tata Power, Statiq, Nexcharge), ChargeAhead allows holding a charging gun for 15-30 minutes so no other driver can take it while you are en route.',
  },
  {
    q: 'What happens if a charger goes offline while I am driving toward it?',
    a: 'ChargeAhead automatically detects the outage and triggers a Predictive Live Reroute alert on your navigation screen, offering an instant 1-tap route update to the nearest reliable alternative.',
  },
  {
    q: 'Are charging fees higher when booking through ChargeAhead?',
    a: 'No. ChargeAhead matches standard CPO pricing (e.g. ₹18–24/kWh) with zero markups. Small reservation hold fees are fully refunded when you plug in.',
  },
];

export default function FaqPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="max-w-3xl mx-auto px-4 py-12 md:py-20 space-y-8 bg-white text-black">
      <div className="text-center space-y-3">
        <HelpCircle className="w-10 h-10 text-black mx-auto" />
        <h1 className="text-3xl font-extrabold text-black">Frequently Asked Questions</h1>
        <p className="text-sm text-gray-500 font-medium">Everything you need to know about ChargeAhead's trip planning platform.</p>
      </div>

      <div className="space-y-3">
        {FAQS.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <div key={idx} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              <button
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full text-left p-5 flex items-center justify-between gap-4 font-bold text-black text-sm hover:bg-gray-50 transition-colors"
              >
                <span>{faq.q}</span>
                <ChevronDown className={`w-4 h-4 text-black shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
              </button>

              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-5 pb-5 text-xs text-gray-600 font-medium leading-relaxed border-t border-gray-200 pt-3 bg-gray-50/50"
                  >
                    {faq.a}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}
