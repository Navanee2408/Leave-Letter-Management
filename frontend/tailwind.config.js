/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#eef2f9',
          100: '#d8e0ef',
          200: '#b3c2de',
          300: '#839bc5',
          400: '#5574a8',
          500: '#33548b',
          600: '#213f70',
          700: '#16325c',
          800: '#0b2447',
          900: '#001b3d',
          950: '#001126',
        },
        brand: {
          50: '#f5f1e8',
          100: '#e8dfc9',
          200: '#d7c69f',
          300: '#c4aa73',
          400: '#b39150',
          500: '#9c7a3d',
          600: '#7f602f',
          700: '#634a27',
          800: '#4a3720',
          900: '#332617',
        },
        maroon: {
          50: '#fbf1f1',
          100: '#f5dddd',
          200: '#eabbbb',
          300: '#d98e8e',
          400: '#c15f5f',
          500: '#a53e3e',
          600: '#8a2c2c',
          700: '#742727',
          800: '#5e2323',
          900: '#4d2020',
          950: '#2b0f0f',
        },
        canvas: '#f4f6fa',
        ink: '#172033',
      },
      fontFamily: {
        sans: ['Roboto', 'system-ui', 'sans-serif'],
        display: ['Montserrat', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(16, 24, 40, 0.04), 0 4px 16px rgba(16, 24, 40, 0.05)',
        lift: '0 12px 30px rgba(0, 27, 61, 0.12)',
        dropdown: '0 10px 40px rgba(0, 27, 61, 0.16)',
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.125rem',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          from: { opacity: '0', transform: 'translateX(24px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-4px)' },
          '75%': { transform: 'translateX(4px)' },
        },
      },
      animation: {
        fadeIn: 'fadeIn 0.25s ease-out',
        slideUp: 'slideUp 0.3s ease-out',
        slideInRight: 'slideInRight 0.3s ease-out',
        shake: 'shake 0.3s ease-in-out',
      },
    },
  },
  plugins: [],
}
