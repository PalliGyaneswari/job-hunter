/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Vault Ledger Design System — deep navy + brass/gold palette
        vault: {
          'bg':         '#07080f',
          'navy':       '#0a0e1a',
          'indigo':     '#10142a',
          'card':       '#131729',
          'border':     '#1e2444',
          'border-l':   '#2a3060',
          'brass':      '#c9a84c',
          'gold':       '#f0c040',
          'gold-dim':   '#a87e2a',
          'emerald':    '#10b981',
          'emerald-dim':'#065f46',
          'rose':       '#ef4444',
          'rose-dim':   '#7f1d1d',
          'amber':      '#f59e0b',
          'amber-dim':  '#78350f',
          'sky':        '#38bdf8',
          'purple':     '#a78bfa',
          'text':       '#e2e8f0',
          'text-muted': '#94a3b8',
          'text-dim':   '#64748b',
        },
      },
      fontFamily: {
        'mono': ['"JetBrains Mono"', '"Fira Code"', 'Consolas', 'monospace'],
        'sans': ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      backgroundImage: {
        'vault-gradient':   'linear-gradient(135deg, #0a0e1a 0%, #10142a 50%, #07080f 100%)',
        'brass-gradient':   'linear-gradient(135deg, #c9a84c 0%, #f0c040 50%, #a87e2a 100%)',
        'gold-shine':       'linear-gradient(90deg, transparent 0%, rgba(240,192,64,0.15) 50%, transparent 100%)',
        'card-gradient':    'linear-gradient(135deg, #131729 0%, #10142a 100%)',
        'emerald-gradient': 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      },
      boxShadow: {
        'vault':    '0 4px 24px rgba(0,0,0,0.6)',
        'vault-lg': '0 8px 48px rgba(0,0,0,0.8)',
        'brass':    '0 0 20px rgba(201,168,76,0.25)',
        'gold':     '0 0 30px rgba(240,192,64,0.3)',
        'emerald':  '0 0 16px rgba(16,185,129,0.3)',
        'glow-sm':  '0 0 8px rgba(201,168,76,0.4)',
      },
      animation: {
        'pulse-slow':   'pulse 3s ease-in-out infinite',
        'float':        'float 6s ease-in-out infinite',
        'shimmer':      'shimmer 2s linear infinite',
        'fade-in':      'fadeIn 0.4s ease-out',
        'slide-up':     'slideUp 0.3s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-6px)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          from: { opacity: '0', transform: 'translateY(16px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}
