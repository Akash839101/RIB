/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#7047d7',
          dark: '#5d36bd',
        },
      },
    },
  },
  plugins: [],
};
