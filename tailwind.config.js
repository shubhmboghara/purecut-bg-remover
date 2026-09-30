/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        studio: {
          950: '#0a0d14',
          900: '#121722',
          850: '#171e2c',
          800: '#1b2130',
          700: '#242c3d',
          600: '#333f54',
          border: 'rgba(255, 255, 255, 0.08)',
        },
        brand: {
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 25px rgba(99, 102, 241, 0.35)',
        studio: '0 10px 40px rgba(0, 0, 0, 0.5)',
      }
    },
  },
  plugins: [],
};
