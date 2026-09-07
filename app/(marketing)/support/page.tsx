'use client';

import { useState } from 'react';
import { Mail, Phone, MessageSquare, Send, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function SupportPage() {
  const [submitted, setSubmitted] = useState(false);
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    toast.success('Support ticket created (#TK-89421)!');
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 md:py-20 space-y-12 bg-white text-black">
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-extrabold text-black">Help & Support</h1>
        <p className="text-sm text-gray-600 font-medium">Have a question or experienced a station issue? We're here to help 24/7.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm text-center space-y-2">
          <MessageSquare className="w-8 h-8 text-black mx-auto" />
          <h3 className="text-base font-extrabold text-black">Live In-App Chat</h3>
          <p className="text-xs text-gray-500 font-medium">Instant resolution during charging sessions</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm text-center space-y-2">
          <Mail className="w-8 h-8 text-black mx-auto" />
          <h3 className="text-base font-extrabold text-black">Email Support</h3>
          <p className="text-xs text-gray-500 font-medium">support@chargeahead.in</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm text-center space-y-2">
          <Phone className="w-8 h-8 text-black mx-auto" />
          <h3 className="text-base font-extrabold text-black">Driver Hotline</h3>
          <p className="text-xs text-gray-500 font-medium">1800-267-CHARGE (Toll-Free)</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-8 max-w-xl mx-auto border border-gray-200 shadow-xl space-y-6">
        <h2 className="text-xl font-extrabold text-black text-center">Submit a Support Inquiry</h2>

        {submitted ? (
          <div className="text-center space-y-3 py-4">
            <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
            <h3 className="text-lg font-extrabold text-black">Ticket Submitted</h3>
            <p className="text-xs text-gray-600 font-medium">Ticket ID: #TK-89421. Response expected within 15 minutes.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs font-medium">
            <div>
              <label className="block text-gray-700 font-bold mb-1">Subject</label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Charging session payment failed"
                className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-black focus:border-black outline-none"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-bold mb-1">Description</label>
              <textarea
                rows={4}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Provide station name or transaction details..."
                className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3 text-black focus:border-black outline-none"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-black text-white font-extrabold text-xs shadow-md hover:bg-gray-900 transition-all flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" /> Send Ticket
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
