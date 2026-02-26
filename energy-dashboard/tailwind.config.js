/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        midnight: '#0b1224',
        neon: '#7cf3c7',
      },
      boxShadow: {
        glow: '0 0 40px rgba(124, 243, 199, 0.25)',
      },
    },
  },
  plugins: [],
};