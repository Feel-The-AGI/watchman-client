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
        // Watchman Color Scheme - Calm, not startup
        watchman: {
          bg: '#1A1B1E',        // Charcoal - Base background
          surface: '#25262B',   // Slightly lighter surface
          border: '#373A40',    // Border color
          accent: '#2979FF',    // Electric blue - Primary accent
          mint: '#1DE9B6',      // Mint - Secondary accent
          text: '#F4F4F4',      // Soft white - Primary text
          muted: '#909296',     // Muted text
          error: '#FF5252',     // Coral - Errors
          warning: '#FFB74D',   // Amber - Warnings
          success: '#4CAF50',   // Green - Success
        },
        // Work type colors
        work: {
          day: '#4A90D9',       // Muted blue - Day shift
          night: '#5C6BC0',     // Deep indigo - Night shift
          off: '#66BB6A',       // Soft green - Off days
        },
        // Commitment colors
        commit: {
          education: '#FF9800', // Orange - Study/Education
          personal: '#9C27B0',  // Purple - Personal
          leave: '#26A69A',     // Teal - Leave
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
    },
  },
  plugins: [],
}

export default config
