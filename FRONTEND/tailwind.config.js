/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts}'],
  theme: {
    extend: {
      colors: {
        edu: {
          bg: '#F5F8FC',
          card: '#FFFFFF',
          border: 'rgba(15, 23, 42, 0.08)',
          blue: '#2563EB',
          indigo: '#5B4FCF',
          teal: '#0F766E',
          amber: '#F59E0B',
          green: '#0F766E',
          admin: '#0F766E',
          parent: '#1A5C45',
          ministere: '#166534',
          text: '#0F172A',
          muted: '#64748B',
        },
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 8px 24px rgba(37, 99, 235, 0.18)',
        'glow-purple': '0 8px 24px rgba(91, 79, 207, 0.16)',
        soft: '0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)',
      },
      backgroundImage: {
        'edu-radial':
          'radial-gradient(ellipse at 15% 10%, rgba(37,99,235,0.06), transparent 45%), radial-gradient(ellipse at 85% 90%, rgba(245,158,11,0.05), transparent 40%)',
        'edu-radial-teacher':
          'radial-gradient(ellipse at 15% 10%, rgba(91,79,207,0.06), transparent 45%), radial-gradient(ellipse at 85% 90%, rgba(13,148,136,0.05), transparent 40%)',
        'edu-radial-admin':
          'radial-gradient(ellipse at 15% 10%, rgba(15,118,110,0.06), transparent 45%), radial-gradient(ellipse at 85% 90%, rgba(217,119,6,0.05), transparent 40%)',
      },
    },
  },
  plugins: [],
}
