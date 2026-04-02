/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // <--- Chỉ cần 1 dòng này là đủ pháp thuật
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#000000',
        background: '#F9FAFB',
        card: '#FFFFFF',
        income: '#16A34A',
        expense: '#DC2626',
      }
    },
  },
  plugins: [],
}