/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#e6edf5',
          100: '#b3c8df',
          200: '#80a3ca',
          300: '#4d7eb4',
          400: '#1a599e',
          500: '#003366',
          600: '#002d5c',
          700: '#002652',
          800: '#001f47',
          900: '#00183d',
        },
        gold: {
          50: '#fdf6e9',
          100: '#f9e7c3',
          200: '#f5d89e',
          300: '#f0c878',
          400: '#ecb952',
          500: '#C8963E',
          600: '#b37f2e',
          700: '#9e681e',
          800: '#89510e',
          900: '#743a00',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px 0 rgba(0,0,0,0.08), 0 1px 2px -1px rgba(0,0,0,0.06)',
        'card-hover': '0 4px 12px 0 rgba(0,0,0,0.12), 0 2px 4px -1px rgba(0,0,0,0.08)',
      },
    },
  },
  plugins: [],
}
