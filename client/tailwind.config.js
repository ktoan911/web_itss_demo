/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg:      'rgb(var(--bg) / <alpha-value>)',
        surface: 'rgb(var(--surface) / <alpha-value>)',
        border:  'rgb(var(--border) / <alpha-value>)',
        text: {
          DEFAULT: 'rgb(var(--text))',
          muted:   'rgb(var(--text-muted))',
        },
        primary: {
          50:'#eef2ff', 100:'#e0e7ff', 200:'#c7d2fe',
          500:'#6366f1', 600:'#4f46e5', 700:'#4338ca', 800:'#3730a3',
        },
        priority: { low:'#16a34a', medium:'#f59e0b', high:'#dc2626' },
        status:   { todo:'#64748b', progress:'#2563eb', done:'#16a34a', overdue:'#dc2626' },
      },
      borderRadius: { '2xl':'16px', '3xl':'20px' },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
};
