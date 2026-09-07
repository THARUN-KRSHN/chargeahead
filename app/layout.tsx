import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'ChargeAhead — Intelligent EV Trip Planning',
    template: '%s | ChargeAhead',
  },
  description:
    'ChargeAhead tells you whether a charger will be usable when you arrive — with predictive availability, queue estimation, reliability scores, live rerouting, and seamless reservations.',
  keywords: ['EV charging', 'electric vehicle', 'trip planning', 'charging stations', 'India EV'],
  openGraph: {
    title: 'ChargeAhead — Intelligent EV Trip Planning',
    description: 'Predict. Act. Adapt. The smarter way to charge.',
    type: 'website',
    locale: 'en_IN',
    siteName: 'ChargeAhead',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ChargeAhead',
    description: 'Predict. Act. Adapt. The smarter way to charge.',
  },
  robots: { index: true, follow: true },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#FFFFFF',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#FFFFFF" />
      </head>
      <body className={`${plusJakartaSans.variable} font-sans antialiased bg-white text-black`}>
        {children}
        <Toaster
          position="top-right"
          richColors
          closeButton
          toastOptions={{
            duration: 4000,
            className: 'border border-gray-200 bg-white text-black shadow-lg',
          }}
        />
      </body>
    </html>
  );
}
