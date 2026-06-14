/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#fff5f5',
          100: '#ffe0e0',
          500: '#e53e3e',
          600: '#c0392b',
          700: '#9b2335',
          900: '#63171b',
        },
      },
    },
  },
  plugins: [],
};
