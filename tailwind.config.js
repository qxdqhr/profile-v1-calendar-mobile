/** @type {import('tailwindcss').Config} */
const path = require('path');

const sa2kitRnSrc = path.resolve(
  __dirname,
  '../../../sa2kit-ui/packages/rn/src',
);

module.exports = {
  content: [
    './App.{js,jsx,ts,tsx}',
    './src/**/*.{js,jsx,ts,tsx}',
    path.join(sa2kitRnSrc, '**/*.{js,jsx,ts,tsx}'),
  ],
  presets: [
    require('nativewind/preset'),
    require('@sa2kit-ui/theme-animal-island/tailwind.preset'),
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};
