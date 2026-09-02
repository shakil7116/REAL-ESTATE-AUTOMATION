/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './app/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#132B25',
        coral: '#D97757',
        workspace: '#F6F8F6',
      },
    },
  },
  plugins: [],
};
