/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Enhanced dark mode color palette
        dark: {
          50: '#18181b',
          100: '#121217',
          200: '#0f0f14',
          300: '#0c0c10',
          400: '#0a0a0f',
          500: '#09090b',
        }
      },
      animation: {
        // Slow, smooth pulse for backgrounds
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',

        // Very slow pulse for ambient effects
        'pulse-slower': 'pulse 6s cubic-bezier(0.4, 0, 0.6, 1) infinite',

        // Subtle float animation
        'float': 'float 3s ease-in-out infinite',

        // Shimmer effect for loading states
        'shimmer': 'shimmer 2s linear infinite',

        // Glow pulse for status indicators
        'glow': 'glow 2s ease-in-out infinite',

        // Fade in from bottom
        'fade-in-up': 'fadeInUp 0.5s ease-out',

        // Fade in with scale
        'fade-in-scale': 'fadeInScale 0.5s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
        glow: {
          '0%, 100%': {
            opacity: '1',
            boxShadow: '0 0 20px currentColor',
          },
          '50%': {
            opacity: '0.5',
            boxShadow: '0 0 10px currentColor',
          },
        },
        fadeInUp: {
          '0%': {
            opacity: '0',
            transform: 'translateY(20px)',
          },
          '100%': {
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        fadeInScale: {
          '0%': {
            opacity: '0',
            transform: 'scale(0.95)',
          },
          '100%': {
            opacity: '1',
            transform: 'scale(1)',
          },
        },
      },
      boxShadow: {
        // Premium shadow system with colored glows
        'glow-sm': '0 0 10px rgba(59, 130, 246, 0.5)',
        'glow': '0 0 20px rgba(59, 130, 246, 0.5)',
        'glow-lg': '0 0 30px rgba(59, 130, 246, 0.5)',
        'glow-emerald': '0 0 20px rgba(16, 185, 129, 0.5)',
        'glow-emerald-lg': '0 0 30px rgba(16, 185, 129, 0.5)',
        'glow-purple': '0 0 20px rgba(168, 85, 247, 0.5)',
        'glow-purple-lg': '0 0 30px rgba(168, 85, 247, 0.5)',
        'glow-rose': '0 0 20px rgba(239, 68, 68, 0.5)',
        'glow-cyan': '0 0 20px rgba(6, 182, 212, 0.5)',

        // Premium card shadows
        'card': '0 0 0 1px rgba(255,255,255,0.05), 0 2px 4px rgba(0,0,0,0.5), 0 12px 24px rgba(0,0,0,0.3)',
        'card-hover': '0 0 0 1px rgba(255,255,255,0.1), 0 4px 8px rgba(0,0,0,0.6), 0 16px 32px rgba(0,0,0,0.4)',

        // Inner highlights
        'inner-glow': 'inset 0 1px 0 0 rgba(255,255,255,0.05)',
        'inner-glow-strong': 'inset 0 1px 0 0 rgba(255,255,255,0.1)',
      },
      backdropBlur: {
        xs: '2px',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      spacing: {
        '18': '4.5rem',
        '112': '28rem',
        '128': '32rem',
      },
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
      transitionDuration: {
        '400': '400ms',
        '600': '600ms',
        '800': '800ms',
        '900': '900ms',
      },
      blur: {
        '4xl': '100px',
        '5xl': '120px',
      },
    },
  },
  plugins: [
    // Optional: Add custom utilities
    function ({ addUtilities }) {
      const newUtilities = {
        '.text-shadow': {
          textShadow: '0 2px 4px rgba(0,0,0,0.5)',
        },
        '.text-shadow-lg': {
          textShadow: '0 4px 8px rgba(0,0,0,0.6)',
        },
        '.scrollbar-hide': {
          '-ms-overflow-style': 'none',
          'scrollbar-width': 'none',
          '&::-webkit-scrollbar': {
            display: 'none',
          },
        },
        '.font-smoothing': {
          '-webkit-font-smoothing': 'antialiased',
          '-moz-osx-font-smoothing': 'grayscale',
        },
        '.glass': {
          'background': 'rgba(18, 18, 23, 0.8)',
          'backdrop-filter': 'blur(10px)',
          'border': '1px solid rgba(255, 255, 255, 0.1)',
        },
        '.glass-strong': {
          'background': 'rgba(18, 18, 23, 0.95)',
          'backdrop-filter': 'blur(20px)',
          'border': '1px solid rgba(255, 255, 255, 0.15)',
        },
      }
      addUtilities(newUtilities)
    },
  ],
}