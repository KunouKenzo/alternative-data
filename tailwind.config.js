/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#8b5cf6',
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
        accent: {
          DEFAULT: '#06b6d4',
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
        },
        surface: {
          DEFAULT: '#ffffff',
          deep: '#f8fafc',
          elevated: '#f1f5f9',
          hover: '#e2e8f0',
          border: '#e2e8f0',
        },
      },
      fontFamily: {
        display: ['Space Grotesk', 'Noto Sans JP', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 20px rgba(139, 92, 246, 0.1)',
        'glow-lg': '0 0 40px rgba(139, 92, 246, 0.15)',
        'glow-accent': '0 0 20px rgba(6, 182, 212, 0.1)',
        'card': '0 1px 3px rgba(0, 0, 0, 0.08), 0 1px 2px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 10px 25px rgba(0, 0, 0, 0.08)',
      },
      animation: {
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        'shimmer': {
          '0%': { 'background-position': '-200% 0' },
          '100%': { 'background-position': '200% 0' },
        },
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #8b5cf6, #06b6d4)',
      },
    },
  },
  plugins: [],
};
