/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: '#FAF9F6',
        'bg-alt': '#F8F7F3',
        surface: '#FFFFFF',
        border: '#E8E6E0',
        primary: {
          DEFAULT: '#3346B8',
          hover: '#4054C5',
          soft: '#EEF2FF',
        },
        violet: {
          DEFAULT: '#7C3AED',
          soft: '#F5F3FF',
        },
        success: {
          DEFAULT: '#16A34A',
          soft: '#F0FDF4',
        },
        warning: {
          DEFAULT: '#D97706',
          soft: '#FFFBEB',
        },
        danger: {
          DEFAULT: '#DC2626',
          soft: '#FEF2F2',
        },
        info: {
          DEFAULT: '#2563EB',
          soft: '#EFF6FF',
        },
        partner: {
          DEFAULT: '#9333EA',
          soft: '#FAF5FF',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderRadius: {
        card: '16px',
        input: '12px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(0, 0, 0, 0.05), 0 10px 25px -5px rgba(0, 0, 0, 0.04)',
        hover: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 20px 25px -5px rgba(0, 0, 0, 0.06)',
      },
    },
  },
  plugins: [],
};
