/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        terracotta: { 50: '#FBEAE2', 100: '#F5D2C0', 400: '#C1502E', 500: '#9B3D22', 600: '#7A2F1A' },
        olive: { 50: '#EAF1E6', 100: '#CFE0C6', 400: '#4B6B3E', 500: '#37502D', 600: '#293D22' },
        mustard: { 50: '#FBF0DC', 100: '#F3DEA8', 400: '#D99A2B', 500: '#8A5F10' },
        clay: { 400: '#A8563F', 500: '#8A2E17' },
        teal: { 50: '#E6F0EF', 400: '#2F6E6A', 500: '#1F4A47' },
        plum: { 400: '#7A4A5C' },
        paper: { DEFAULT: '#FBF6EC', card: '#FFFFFF', hover: '#F5EEE0' },
        ink: { DEFAULT: '#2B2620', secondary: '#5B5346', muted: '#635A4D' },
        line: { DEFAULT: '#E7DCC6', dark: '#D2C4A3' },
      },
      borderRadius: { sm: '4px', DEFAULT: '8px', lg: '12px', xl: '16px' },
      boxShadow: {
        soft: '0 1px 2px rgba(43,38,32,0.06), 0 1px 1px rgba(43,38,32,0.04)',
        card: '0 6px 16px rgba(43,38,32,0.08), 0 2px 6px rgba(43,38,32,0.04)',
        lifted: '0 14px 32px -6px rgba(43,38,32,0.14)',
      },
    },
  },
  plugins: [],
};
