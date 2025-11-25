/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'], // Ensure you have a nice sans font
      },
      colors: {
        // We rely on standard Tailwind colors:
        // slate, teal, amber, rose, indigo, violet
      }
    },
  },
  plugins: [],
}