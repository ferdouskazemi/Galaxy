import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        void: '#00000f',
        deep: '#030318',
        star: '#e8e8ff',
        glow: '#a78bfa',
        pulse: '#7c3aed',
        nova: '#f59e0b',
        aurora: '#06b6d4',
      },
      fontFamily: {
        display: ['var(--font-space-grotesk)'],
        mono: ['var(--font-space-mono)'],
        body: ['var(--font-inter)'],
      },
      boxShadow: {
        glow: '0 0 35px rgba(167, 139, 250, 0.35)',
        nova: '0 0 40px rgba(245, 158, 11, 0.28)',
      },
      backdropBlur: {
        galaxy: '20px',
      },
      animation: {
        drift: 'drift 18s ease-in-out infinite',
        pulseSoft: 'pulseSoft 2.8s ease-in-out infinite',
      },
      keyframes: {
        drift: {
          '0%, 100%': { transform: 'translate3d(0, 0, 0)' },
          '50%': { transform: 'translate3d(0, -12px, 0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '0.45' },
          '50%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
};

export default config;
