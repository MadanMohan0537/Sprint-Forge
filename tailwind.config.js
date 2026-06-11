/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        surface: '#0f172a',
        panel: '#1e293b',
        edge: '#334155',
      },
    },
  },
  plugins: [],
}
