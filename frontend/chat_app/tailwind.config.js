/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
 darkMode: ['selector', '.dark-mode'], 
  theme: {
    extend: {
      animation: {
        'ping': 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite',
        'ring-pulse': 'ring-pulse 1.5s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
      keyframes: {
        ping: {
          '0%': { transform: 'scale(1)', opacity: '1' },
          '75%, 100%': { transform: 'scale(1.2)', opacity: '0' },
        },
        'ring-pulse': {
          '0%': { transform: 'scale(1)', opacity: '1', boxShadow: '0 0 0 0 rgba(59, 130, 246, 0.7)' },
          '70%': { transform: 'scale(1.05)', opacity: '0.7', boxShadow: '0 0 0 15px rgba(59, 130, 246, 0)' },
          '100%': { transform: 'scale(1)', opacity: '1', boxShadow: '0 0 0 0 rgba(59, 130, 246, 0)' }
        }
      },
      colors:{
        bg:'var(--color-bg)',
        surface:'var(--color-surface)',
        text: 'var(--color-text)',
        muted: 'var(--color-muted)',
        border: 'var(--color-border)',
        'avatar-bg': 'var(--color-avatar-bg)',
        'hover-surface':'var(--color-hover)',
        accent: 'var(--color-accent)',
        'toggle-off':'var(--color-toggle-off)',
      }
    },
  },
  plugins: [],
};