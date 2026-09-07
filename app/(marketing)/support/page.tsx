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
    <div className="max-w-4xl mx-auto px-4 py-12 md:py-20 space-y-12">
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-extrabold text-white">Help & Support</h1>
        <p className="text-sm text-white/60">Have a question or experienced a station issue? We're here to help 24/7.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="glass-card p-6 rounded-2xl text-center space-y-2">
          <MessageSquare className="w-8 h-8 text-mint-400 mx-auto" />
          <h3 className="text-base font-bold text-white">Live In-App Chat</h3>
          <p className="text-xs text-white/50">Instant resolution during charging sessions</p>
        </div>
        <div className="glass-card p-6 rounded-2xl text-center space-y-2">
          <Mail className="w-8 h-8 text-teal-400 mx-auto" />
          <h3 className="text-base font-bold text-white">Email Support</h3>
          <p className="text-xs text-white/50">support@chargeahead.in</p>
        </div>
        <div className="glass-card p-6 rounded-2xl text-center space-y-2">
          <Phone className="w-8 h-8 text-emerald-400 mx-auto" />
          <h3 className="text-base font-bold text-white">Driver Hotline</h3>
          <p className="text-xs text-white/50">1800-267-CHARGE (Toll-Free)</p>
        </div>
      </div>

      <div className="glass-card rounded-3xl p-8 max-w-xl mx-auto border-mint-400/30 space-y-6">
        <h2 className="text-xl font-bold text-white text-center">Submit a Support Inquiry</h2>

        {submitted ? (
          <div className="text-center space-y-3 py-4">
            <CheckCircle2 className="w-12 h-12 text-mint-400 mx-auto" />
            <h3 className="text-lg font-bold text-white">Ticket Submitted</h3>
            <p className="text-xs text-white/60">Ticket ID: #TK-89421. Response expected within 15 minutes.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-white/60 mb-1">Subject</label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Charging session payment failed"
                className="w-full bg-navy-900 border border-surface-border rounded-xl px-4 py-3 text-white"
              />
            </div>
            <div>
              <label className="block text-white/60 mb-1">Description</label>
              <textarea
                rows={4}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Provide station name or transaction details..."
                className="w-full bg-navy-900 border border-surface-border rounded-xl px-4 py-3 text-white"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3.5 rounded-xl bg-mint-gradient text-navy-900 font-bold text-xs shadow-mint-glow hover:opacity-90 transition-all flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" /> Send Ticket
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
