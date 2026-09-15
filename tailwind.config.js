/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        dark: "#00373A",
        brand: "#00DC46",
        purple: "#7C3AED",
        orange: "#FF6A3D",
        cream: "#F9F7E8",
      },
      fontFamily: {
        gellix: ["Gellix", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
