/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#132B25',
          50: '#E8F0EC',
          100: '#C5D9CC',
          200: '#9DBFAD',
          300: '#76A58E',
          400: '#4E8B6F',
          500: '#2A7150',
          600: '#1F5A3F',
          700: '#132B25',
          800: '#0E201C',
          900: '#0A1613',
          950: '#060E0D',
        },
        coral: {
          DEFAULT: '#D97757',
          50: '#FDF2EC',
          100: '#FBE4D5',
          200: '#F7CAA9',
          300: '#F3AE7D',
          400: '#EE8E54',
          500: '#D97757',
          600: '#C46040',
          700: '#A04A32',
          800: '#74392B',
          900: '#4E2720',
          950: '#2C1510',
        },
        workspace: '#F6F8F6',
      },
      fontFamily: {
        cairo: ['Cairo', 'sans-serif'],
        jakarta: ['Plus Jakarta Sans', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.6s ease-out forwards',
        'slide-up': 'slideUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'float': 'float 6s ease-in-out infinite',
        'float-delayed': 'float 6s ease-in-out 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(30px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
      },
    },
  },
  plugins: [],
}
