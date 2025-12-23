import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Watchman Color Scheme - Premium, sophisticated
        watchman: {
          bg: '#0A0A0B',        // Deep black - Base background
          'bg-secondary': '#111113', // Slightly lighter
          surface: '#18181B',   // Card surfaces
          'surface-hover': '#1F1F23', // Hover state
          border: '#27272A',    // Subtle borders
          'border-light': '#3F3F46', // Visible borders
          accent: '#3B82F6',    // Vibrant blue - Primary
          'accent-hover': '#2563EB', // Darker on hover
          'accent-glow': 'rgba(59, 130, 246, 0.5)', // Glow effect
          mint: '#10B981',      // Emerald - Secondary
          'mint-glow': 'rgba(16, 185, 129, 0.5)',
          purple: '#8B5CF6',    // Violet accent
          pink: '#EC4899',      // Pink accent
          orange: '#F97316',    // Orange accent
          text: '#FAFAFA',      // Pure white - Primary
          'text-secondary': '#A1A1AA', // Zinc-400
          muted: '#71717A',     // Zinc-500
          error: '#EF4444',     // Red-500
          'error-glow': 'rgba(239, 68, 68, 0.5)',
          warning: '#F59E0B',   // Amber-500
          success: '#22C55E',   // Green-500
          'success-glow': 'rgba(34, 197, 94, 0.5)',
        },
        // Work type colors - richer, more vibrant
        work: {
          day: '#FBBF24',       // Warm amber - Day shift
          'day-glow': 'rgba(251, 191, 36, 0.3)',
          night: '#6366F1',     // Indigo - Night shift
          'night-glow': 'rgba(99, 102, 241, 0.3)',
          off: '#22C55E',       // Green - Off days
          'off-glow': 'rgba(34, 197, 94, 0.3)',
        },
        // Commitment colors
        commit: {
          education: '#F97316', // Orange
          personal: '#A855F7',  // Purple
          leave: '#14B8A6',     // Teal
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'monospace'],
        display: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display-xl': ['4.5rem', { lineHeight: '1', letterSpacing: '-0.02em', fontWeight: '700' }],
        'display-lg': ['3.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }],
        'display-md': ['2.5rem', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '600' }],
        'display-sm': ['1.875rem', { lineHeight: '1.3', letterSpacing: '-0.01em', fontWeight: '600' }],
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        'glow-sm': '0 0 20px -5px var(--tw-shadow-color)',
        'glow-md': '0 0 40px -10px var(--tw-shadow-color)',
        'glow-lg': '0 0 60px -15px var(--tw-shadow-color)',
        'inner-glow': 'inset 0 1px 0 0 rgba(255,255,255,0.05)',
        'card': '0 0 0 1px rgba(255,255,255,0.05), 0 2px 4px rgba(0,0,0,0.1), 0 12px 24px rgba(0,0,0,0.1)',
        'card-hover': '0 0 0 1px rgba(255,255,255,0.1), 0 4px 8px rgba(0,0,0,0.15), 0 16px 32px rgba(0,0,0,0.15)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'mesh-gradient': 'radial-gradient(at 40% 20%, hsla(228,67%,53%,0.15) 0px, transparent 50%), radial-gradient(at 80% 0%, hsla(189,82%,48%,0.15) 0px, transparent 50%), radial-gradient(at 0% 50%, hsla(355,85%,52%,0.1) 0px, transparent 50%), radial-gradient(at 80% 50%, hsla(340,65%,47%,0.1) 0px, transparent 50%), radial-gradient(at 0% 100%, hsla(22,90%,52%,0.1) 0px, transparent 50%), radial-gradient(at 80% 100%, hsla(242,74%,61%,0.1) 0px, transparent 50%), radial-gradient(at 0% 0%, hsla(343,81%,54%,0.1) 0px, transparent 50%)',
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E\")",
        'shimmer': 'linear-gradient(110deg, transparent 25%, rgba(255,255,255,0.05) 50%, transparent 75%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'fade-up': 'fadeUp 0.6s ease-out forwards',
        'fade-down': 'fadeDown 0.6s ease-out forwards',
        'scale-in': 'scaleIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-down': 'slideDown 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-left': 'slideLeft 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'slide-right': 'slideRight 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-soft': 'pulseSoft 3s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'spin-slow': 'spin 8s linear infinite',
        'bounce-soft': 'bounceSoft 2s ease-in-out infinite',
        'gradient-shift': 'gradientShift 8s ease infinite',
        'typing': 'typing 1s steps(3) infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeDown: {
          '0%': { opacity: '0', transform: 'translateY(-20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideLeft: {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        slideRight: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px -5px currentColor' },
          '50%': { boxShadow: '0 0 40px -5px currentColor' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        typing: {
          '0%': { content: "'.'" },
          '33%': { content: "'..'" },
          '66%': { content: "'...'" },
        },
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
      transitionDuration: {
        '400': '400ms',
        '600': '600ms',
        '800': '800ms',
      },
    },
  },
  plugins: [],
}

export default config
