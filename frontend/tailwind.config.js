/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#ff6b9d',
          50: '#fff0f5',
          100: '#ffe3ec',
          200: '#ffc2d9',
          300: '#ff90b9',
          400: '#ff6b9d',
          500: '#e85a8a',
          600: '#d6336c',
        },
        secondary: {
          DEFAULT: '#4ecdc4',
          50: '#e6fcfb',
          100: '#c5f7f4',
          500: '#4ecdc4',
        }
      },
    },
  },
  plugins: [],
}
