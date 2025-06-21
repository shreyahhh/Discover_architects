/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      keyframes: {
        blob1: {
          '0%, 100%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
        },
        blob2: {
          '0%, 100%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(-40px, 60px) scale(1.05)' },
          '66%': { transform: 'translate(20px, -30px) scale(0.95)' },
        },
        blob3: {
          '0%, 100%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(40px, 20px) scale(1.08)' },
          '66%': { transform: 'translate(-30px, 40px) scale(0.92)' },
        },
      },
      animation: {
        blob1: 'blob1 12s infinite ease-in-out',
        blob2: 'blob2 14s infinite ease-in-out',
        blob3: 'blob3 16s infinite ease-in-out',
      },
    },
  },
  plugins: [],
} 