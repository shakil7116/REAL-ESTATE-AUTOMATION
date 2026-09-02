import { defineConfig } from 'nativewind/preset';

export default defineConfig({
  // Map Tailwind classes to React Native styles
  content: ['./app/**/*.{tsx,ts,jsx,js}'],
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
});
