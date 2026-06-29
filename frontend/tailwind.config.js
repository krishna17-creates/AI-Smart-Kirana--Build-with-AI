/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          light: '#f8fff3',
          DEFAULT: '#16a34a', // A vibrant green similar to Blinkit
          dark: '#15803d',
        },
        accent: {
          DEFAULT: '#f59e0b', // Amber/Yellow
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        display: ['Outfit', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
