/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        /* Cyber Ops Theme - Primary */
        'cyber-bg': '#0A0A0A',
        'cyber-surface': '#131313',
        'cyber-card': '#1A1A1A',
        'cyber-neon': '#00FF41',
        'cyber-text': '#EAEAEA',
        'cyber-text-secondary': '#8A8A8A',
        'cyber-border': 'rgba(0, 255, 65, 0.15)',
        
        /* Aurora Theme - Primary (for backward compatibility) */
        'aurora-bg': '#0A0A0F',
        'aurora-surface': '#111118',
        'aurora-card': '#16161F',
        'aurora-accent': '#6C63FF',
        'aurora-secondary': '#00D4AA',
        'aurora-text': '#F0F0FF',
        'aurora-text-secondary': '#8888AA',
        
        /* Legacy colors for compatibility */
        void: '#0A0A0A',
        canvas: '#131313',
        surface: {
          DEFAULT: '#131313',
          raised: '#1A1A1A',
          inset: '#0F0F0F',
        },
        fg: {
          primary: '#EAEAEA',
          secondary: '#8A8A8A',
          tertiary: '#525252',
        },
        accent: {
          DEFAULT: '#00FF41',
          soft: 'rgba(0, 255, 65, 0.15)',
        },
        success: {
          DEFAULT: '#00FF41',
          bg: 'rgba(0, 255, 65, 0.12)',
          border: 'rgba(0, 255, 65, 0.25)',
        },
        danger: {
          DEFAULT: '#FF3B3B',
          bg: 'rgba(255, 59, 59, 0.12)',
          border: 'rgba(255, 59, 59, 0.25)',
        },
        warning: {
          DEFAULT: '#FFD700',
          bg: 'rgba(255, 215, 0, 0.12)',
          border: 'rgba(255, 215, 0, 0.25)',
        },
        info: {
          DEFAULT: '#00BFFF',
          bg: 'rgba(0, 191, 255, 0.12)',
          border: 'rgba(0, 191, 255, 0.25)',
        },
        'border-subtle': 'rgba(0, 255, 65, 0.08)',
        'border-default': 'rgba(0, 255, 65, 0.15)',
        'border-strong': 'rgba(0, 255, 65, 0.25)',
      },
      fontFamily: {
        display: ['Space Grotesk', 'Inter', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        sm: '6px',
        md: '10px',
        lg: '14px',
        xl: '18px',
        '2xl': '24px',
        '3xl': '20px',
        full: '9999px',
      },
      backgroundImage: {
        'cyber-glow': 'radial-gradient(ellipse 600px 300px at 50% -60px, rgba(0, 255, 65, 0.15), transparent 70%)',
        'neon-pulse': 'linear-gradient(90deg, rgba(0, 255, 65, 0) 0%, rgba(0, 255, 65, 0.15) 50%, rgba(0, 255, 65, 0) 100%)',
        'card-shine': 'linear-gradient(180deg, rgba(0, 255, 65, 0.05) 0%, transparent 50%)',
        'dot-grid': 'radial-gradient(rgba(0, 255, 65, 0.08) 1px, transparent 1px)',
        'cosmic-glow': 'radial-gradient(ellipse 600px 300px at 50% -60px, rgba(0, 255, 65, 0.2), transparent 70%)',
      },
      backgroundSize: {
        'dot-grid': '24px 24px',
      },
      boxShadow: {
        'neon-glow': '0 0 20px rgba(0, 255, 65, 0.5), 0 0 40px rgba(0, 255, 65, 0.25)',
        'neon-glow-sm': '0 0 10px rgba(0, 255, 65, 0.4)',
        'card-hover': '0 20px 40px rgba(0, 255, 65, 0.15)',
        'card-lift': '0 24px 48px rgba(0, 0, 0, 0.6)',
        'error-glow': '0 0 15px rgba(255, 59, 59, 0.4)',
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'bounce-out': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      animation: {
        'pulse-neon': 'pulse-neon 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
        'matrix-fall': 'matrix-fall 20s linear infinite',
        'blink': 'blink 1s infinite',
      },
      keyframes: {
        'pulse-neon': {
          '0%, 100%': { opacity: '0.6' },
          '50%': { opacity: '1' },
        },
        'glow-pulse': {
          '0%, 100%': { boxShadow: '0 0 5px rgba(0, 255, 65, 0.4)' },
          '50%': { boxShadow: '0 0 20px rgba(0, 255, 65, 0.6)' },
        },
        'matrix-fall': {
          '0%': { transform: 'translateY(-100vh)' },
          '100%': { transform: 'translateY(100vh)' },
        },
        'blink': {
          '0%, 50%, 100%': { opacity: '1' },
          '50.1%': { opacity: '0' },
        },
      },
    },
  },
  plugins: [],
};

