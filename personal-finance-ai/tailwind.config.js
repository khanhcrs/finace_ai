/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#000000',      // Đổi Vàng thành Đen làm điểm nhấn
        background: '#F9FAFB',   // Trắng xám nhạt (nhìn dịu mắt hơn trắng tinh)
        card: '#FFFFFF',         // Thẻ màu trắng tinh
        income: '#16A34A',       // Xanh lá 
        expense: '#DC2626',      // Đỏ
      }
    },
  },
  plugins: [],
}