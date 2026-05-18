/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#6C63FF',
        'primary-dark': '#5048E5',
        'primary-light': '#A29BFF',
        accent: '#FF6584',
        success: '#43D9A2',
        warning: '#FFD166',
        danger: '#FF6B6B',
        ink: '#1F1B3A',
        cloud: '#F5F4FF',
      },
      fontFamily: {
        display: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        body: ['"Pretendard"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        quest: '0 18px 40px -16px rgba(108, 99, 255, 0.35)',
        pop: '0 12px 30px -10px rgba(255, 101, 132, 0.4)',
      },
      keyframes: {
        'pulse-soft': {
          '0%, 100%': { transform: 'scale(1)', opacity: 1 },
          '50%': { transform: 'scale(1.04)', opacity: 0.92 },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200px 0' },
          '100%': { backgroundPosition: 'calc(200px + 100%) 0' },
        },
      },
      animation: {
        'pulse-soft': 'pulse-soft 2s ease-in-out infinite',
        shimmer: 'shimmer 2s linear infinite',
      },
    },
  },
  plugins: [],
};
