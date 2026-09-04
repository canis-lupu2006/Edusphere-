/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts}'],
  theme: {
    extend: {
      colors: {
        edu: {
          bg: '#0a0f1e',
          card: '#111827',
          border: 'rgba(255,255,255,0.08)',
          blue: '#3b82f6',
          purple: '#8b5cf6',
          green: '#10b981',
          amber: '#f59e0b',
          admin: '#10b981',
          parent: '#1a5c45',
          ministere: '#166534',
        },
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 0 20px rgba(59, 130, 246, 0.45)',
        'glow-purple': '0 0 24px rgba(139, 92, 246, 0.4)',
      },
      backgroundImage: {
        'edu-radial':
          'radial-gradient(ellipse at 20% 20%, rgba(59,130,246,0.12), transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(139,92,246,0.1), transparent 45%)',
      },
    },
  },
  plugins: [],
}
