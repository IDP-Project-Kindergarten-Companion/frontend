// tailwind.config.js
/** @type {import('tailwindcss').Config} */

// These are the brand colors from your app.js.
// Defining them here allows Tailwind to generate utility classes for them.
const brandColors = {
  primary: '#967259',
  primaryHover: '#7A5C47',
  secondary: '#FBC4A6',
  secondaryHover: '#F8B08B',
  background: '#FFF7ED',
  surface: '#FFFCF7',
  text: '#654321',
  textLight: '#8B6B5A',
  border: '#D1BFAE',
  error: '#E57373',
  errorBg: '#FFEBEE',
  success: '#81C784',
  successBg: '#E8F5E9',
  info: '#64B5F6',
  infoBg: '#E3F2FD',
  warning: '#FFB74D',
  warningBg: '#FFF8E1',
};

module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // Scans all JS/JSX/TS/TSX files in your src folder
    "./public/index.html",      // Scans your main HTML file
  ],
  theme: {
    extend: {
      colors: {
        // You can access these as e.g., bg-brand-primary, text-brand-text
        brand: brandColors,
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', '"Noto Sans"', 'sans-serif', '"Apple Color Emoji"', '"Segoe UI Emoji"', '"Segoe UI Symbol"', '"Noto Color Emoji"'],
      },
    },
  },
  plugins: [],
};
