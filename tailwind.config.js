/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#12161d',
        muted: '#5e6878',
        line: '#d8dde6',
        panel: '#f6f7f9',
        accent: '#1f7a8c',
        signal: '#d97706',
      },
      boxShadow: {
        soft: '0 24px 70px rgba(18, 22, 29, 0.12)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
