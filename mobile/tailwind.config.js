/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#ef4444',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#7f1d1d',
          900: '#450a0a',
        },
        background: '#0a0a0a',
        surface: '#1a1a1a',
        card: '#1f1f1f',
      },
      fontFamily: {
        sans: ['Poppins_400Regular', 'system-ui'],
        'sans-semibold': ['Poppins_600SemiBold', 'system-ui'],
        'sans-bold': ['Poppins_700Bold', 'system-ui'],
      },
    },
  },
  plugins: [],
}