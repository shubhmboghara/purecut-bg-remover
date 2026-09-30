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
          950: 'oklch(0.12 0.02 260)',
          900: 'oklch(0.16 0.025 260)',
          850: 'oklch(0.19 0.03 260)',
          800: 'oklch(0.24 0.035 260)',
          700: 'oklch(0.30 0.04 260)',
          600: 'oklch(0.38 0.045 260)',
          border: 'color-mix(in oklch, white 10%, transparent)',
          borderHighlight: 'color-mix(in oklch, white 22%, transparent)',
          glass: 'color-mix(in oklch, oklch(0.16 0.025 260) 80%, transparent)',
        },
        brand: {
          300: 'oklch(0.80 0.16 275)',
          400: 'oklch(0.72 0.20 275)',
          500: 'oklch(0.63 0.25 275)',
          600: 'oklch(0.55 0.27 275)',
          700: 'oklch(0.48 0.26 275)',
        },
        accent: {
          purple: 'oklch(0.68 0.25 310)',
          cyan: 'oklch(0.78 0.16 195)',
          emerald: 'oklch(0.75 0.19 155)',
          amber: 'oklch(0.78 0.18 75)',
          rose: 'oklch(0.68 0.24 25)',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Plus Jakarta Sans', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 30px -5px oklch(0.63 0.25 275 / 0.45)',
        'glow-purple': '0 0 30px -5px oklch(0.68 0.25 310 / 0.45)',
        'glow-emerald': '0 0 30px -5px oklch(0.75 0.19 155 / 0.45)',
        studio: '0 20px 50px -15px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.08)',
        glass: 'inset 0 1px 0 rgba(255, 255, 255, 0.12), 0 12px 32px rgba(0, 0, 0, 0.45)',
      }
    },
  },
  plugins: [],
};
