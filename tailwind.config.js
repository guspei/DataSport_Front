/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        'milo-red': '#DC2626',
        'milo-dark': '#991B1B'
      }
    }
  },
  plugins: []
}