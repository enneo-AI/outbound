/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        'brand-navy': '#181825',
        ink: '#292C3F',
        paper: '#F8F7F9',
        line: '#D4CFD8',
        purple: '#7B5AE2',
        'purple-dark': '#613CDD',
        lavender: '#B09CEE',
      },
      boxShadow: {
        glass: '0 34px 120px rgba(0, 0, 0, 0.34)',
        'inner-soft': 'inset 0 1px 0 rgba(255, 255, 255, 0.14)',
        purple: '0 18px 42px rgba(123, 90, 226, 0.32)',
      },
      fontFamily: {
        sans: ['Geist', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['Geist Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
    },
  },
  plugins: [],
}
