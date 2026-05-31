/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        bg2: '#f5f5f5',
        bg3: '#ebebeb',
        text1: '#1a1a1a',
        text2: '#6b6b6b',
        border1: '#e5e5e5',
        border2: '#d4d4d4',
      },
    },
  },
  plugins: [],
};
