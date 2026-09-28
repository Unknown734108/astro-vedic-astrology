/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      // --- ASTRO Cosmic Design System (Phase B, Increment 1) ---
      // Additive only: nothing below renames or removes an existing
      // Tailwind utility, so every one of the ~3,000 existing className
      // usages elsewhere in the app is unaffected. These tokens are for
      // new/enhanced surfaces (onboarding, dashboard hero, Kundli frame,
      // nav) to draw on a coherent cosmic palette rather than one-off
      // colors.
      colors: {
        cosmic: {
          void: '#05040d',      // deepest background layer
          abyss: '#0b0a1a',     // panel/base background
          nebula: '#241b3d',    // violet nebula mid-tone
          nebulaLight: '#4c3a80',
          gold: '#f5d082',      // refined celestial gold (matches existing star color)
          goldDeep: '#c9962f'
        }
      },
      boxShadow: {
        'cosmic-glow': '0 0 40px -8px rgba(245, 208, 130, 0.25)',
        'cosmic-glow-lg': '0 0 80px -12px rgba(245, 208, 130, 0.3)',
        'nebula-glow': '0 0 60px -10px rgba(140, 110, 220, 0.35)'
      },
      // The original ASTRO UI uses `animate-fadeIn` in several modals/panels.
      // This utility does not exist in Tailwind's default theme, so it is
      // defined here (behavior only: fade + slight rise, unchanged visuals
      // intent from the original source) to make the existing className
      // usages work without touching App.jsx or NorthIndianChart.jsx.
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        // New, reusable entrance/atmosphere primitives for Phase B surfaces.
        // All respect prefers-reduced-motion via the global override in
        // index.css (which forces near-zero animation duration), so no
        // per-usage reduced-motion guard is needed at the call site.
        risingGlow: {
          '0%': { opacity: '0', transform: 'scale(0.94) translateY(6px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' }
        },
        slowPulse: {
          '0%, 100%': { opacity: '0.55' },
          '50%': { opacity: '1' }
        },
        slowSpin: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' }
        }
      },
      animation: {
        fadeIn: 'fadeIn 0.25s ease-out',
        risingGlow: 'risingGlow 0.5s cubic-bezier(0.16,1,0.3,1) both',
        slowPulse: 'slowPulse 4s ease-in-out infinite',
        slowSpin: 'slowSpin 60s linear infinite'
      }
    }
  },
  plugins: []
};

