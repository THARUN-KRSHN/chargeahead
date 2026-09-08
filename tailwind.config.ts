import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Uber-inspired light palette
        navy: {
          DEFAULT: '#FFFFFF',
          50: '#F8F9FA',
          100: '#F1F3F5',
          200: '#E9ECEF',
          300: '#DEE2E6',
          400: '#CED4DA',
          500: '#ADB5BD',
          600: '#6C757D',
          700: '#495057',
          800: '#343A40',
          900: '#FFFFFF',
          950: '#F8F9FA',
        },
        teal: {
          DEFAULT: '#000000',
          50: '#F8F9FA',
          100: '#F1F3F5',
          200: '#E5E5E5',
          300: '#767676',
          400: '#555555',
          500: '#222222',
          600: '#111111',
          700: '#000000',
          800: '#000000',
          900: '#000000',
        },
        mint: {
          DEFAULT: '#000000',
          50: '#F8F9FA',
          100: '#E5E5E5',
          200: '#CCCCCC',
          300: '#666666',
          400: '#000000',
          500: '#111111',
          600: '#000000',
          700: '#000000',
          800: '#000000',
          900: '#000000',
        },
        red: {
          DEFAULT: '#E85D4C',
          50: '#FDF0EE',
          100: '#FAD9D5',
          200: '#F4B2AB',
          300: '#EE8B82',
          400: '#E85D4C',
          500: '#D63B29',
          600: '#AA2E20',
          700: '#7E2218',
          800: '#531610',
          900: '#280B08',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          dark: '#F8F9FA',
          card: '#FFFFFF',
          border: '#E5E5E5',
        },
        // shadcn/ui compatible semantic colors
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        xl: 'calc(var(--radius) + 4px)',
        '2xl': 'calc(var(--radius) + 8px)',
        '3xl': 'calc(var(--radius) + 16px)',
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '88': '22rem',
        '100': '25rem',
        '112': '28rem',
        '128': '32rem',
      },
      boxShadow: {
        'card': '0 2px 12px 0 rgba(0, 0, 0, 0.06)',
        'card-hover': '0 8px 24px 0 rgba(0, 0, 0, 0.12)',
        'mint-glow': '0 4px 14px 0 rgba(0, 0, 0, 0.15)',
        'teal-glow': '0 4px 14px 0 rgba(0, 0, 0, 0.15)',
        'sheet': '0 -8px 30px 0 rgba(0, 0, 0, 0.12)',
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(180deg, #FFFFFF 0%, #F8F9FA 100%)',
        'mint-gradient': 'linear-gradient(135deg, #000000 0%, #1A1A1A 100%)',
        'teal-gradient': 'linear-gradient(135deg, #000000 0%, #222222 100%)',
        'card-gradient': 'linear-gradient(145deg, #FFFFFF 0%, #F8F9FA 100%)',
        'score-green': 'conic-gradient(#00C853 0%, #00C853 var(--score), #E5E5E5 var(--score))',
        'score-yellow': 'conic-gradient(#F59E0B 0%, #F59E0B var(--score), #E5E5E5 var(--score))',
        'score-red': 'conic-gradient(#E85D4C 0%, #E85D4C var(--score), #E5E5E5 var(--score))',
      },
      keyframes: {
        'pulse-mint': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(0, 0, 0, 0.2)' },
          '50%': { boxShadow: '0 0 0 12px rgba(0, 0, 0, 0)' },
        },
        'slide-up': {
          from: { transform: 'translateY(100%)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        'slide-down': {
          from: { transform: 'translateY(-20px)', opacity: '0' },
          to: { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'charge-fill': {
          from: { width: '0%' },
          to: { width: 'var(--target-width)' },
        },
        'spin-slow': {
          to: { transform: 'rotate(360deg)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        'bounce-in': {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '70%': { transform: 'scale(1.05)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      animation: {
        'pulse-mint': 'pulse-mint 2s ease-in-out infinite',
        'slide-up': 'slide-up 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-down': 'slide-down 0.25s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
        'charge-fill': 'charge-fill 2s ease-out forwards',
        'spin-slow': 'spin-slow 3s linear infinite',
        shimmer: 'shimmer 1.5s infinite linear',
        'bounce-in': 'bounce-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
