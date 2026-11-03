import forms from '@tailwindcss/forms';

/** Stitch 디자인의 tailwind.config 그대로 옮긴 설정 */
/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#4143d4',
        'primary-container': '#5b5fee',
        surface: '#fbf8fe',
        'on-surface': '#1b1b1f',
        'on-surface-variant': '#464555',
        outline: '#767586',
        'outline-variant': '#c6c5d7',
        'surface-container': '#f0edf2',
        'surface-container-low': '#f6f2f8',
        'surface-container-high': '#eae7ed',
        'surface-container-highest': '#e4e1e7',
        'surface-container-lowest': '#ffffff',
        error: '#ba1a1a',
        'error-container': '#ffdad6',
        secondary: '#006b55',
        'secondary-container': '#6dfad2',
        tertiary: '#904400',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
    },
  },
  plugins: [forms],
};
