/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#00d4ff',
        'primary-dark': '#0099cc',
        'primary-glow': '#00f0ff',
        dark: '#0a0a1a',
        darker: '#050510',
        secondary: '#0f1729',
        accent: '#0066ff',
      },
      fontFamily: {
        tajawal: ['Tajawal', 'sans-serif'],
      },
      animation: {
        'logo-pulse': 'logoPulse 2s ease-in-out infinite',
        'logo-fire': 'logoFire 1.5s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        logoPulse: {
          '0%, 100%': { transform: 'scale(1)', filter: 'brightness(1)' },
          '50%': { transform: 'scale(1.03)', filter: 'brightness(1.2)' },
        },
        logoFire: {
          '0%, 100%': { filter: 'drop-shadow(0 0 10px #00d4ff) drop-shadow(0 0 20px #0066ff)' },
          '50%': { filter: 'drop-shadow(0 0 30px #00f0ff) drop-shadow(0 0 60px #0066ff) drop-shadow(0 0 90px #00d4ff)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { opacity: '0.5', transform: 'translate(-50%, -50%) scale(1)' },
          '100%': { opacity: '1', transform: 'translate(-50%, -50%) scale(1.2)' },
        },
      },
    },
  },
  plugins: [],
};
