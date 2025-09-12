/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      screens: {
        'xs': '375px',
        'sm': '640px',
        'md': '897px',
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
        'landscape': { 'raw': '(orientation: landscape)' },
        'portrait': { 'raw': '(orientation: portrait)' },
        'mobile-landscape': { 'raw': '(max-width: 896px) and (orientation: landscape)' },
      },
      animation: {
        fadeIn: "fadeIn 0.3s ease-in-out",
        'fade-in': "fadeIn 0.6s ease-in-out",
        slideUp: "slideUp 0.3s ease-in-out",
        slideIn: "slideIn 0.3s ease-out",
        slideRight: "slideRight 3s linear",
        // Buton animasyonları
        'pulse-scale-left': 'pulseScaleLeft 2.5s ease-in-out infinite',
        'pulse-scale-right': 'pulseScaleRight 2.5s ease-in-out infinite',
        'ping-slow': 'pingSlow 2s ease-out infinite',
        'ping-slow-delayed': 'pingSlow 2s ease-out infinite 1s',
        'subtle-move-left': 'subtleMoveLeft 3s ease-in-out infinite',
        'subtle-move-right': 'subtleMoveRight 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideRight: {
          '0%': { width: '0%' },
          '100%': { width: '100%' }
        },
        slideUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideIn: {
          "0%": { 
            transform: "translateX(100%)", 
            opacity: "0" 
          },
          "100%": { 
            transform: "translateX(0)", 
            opacity: "1" 
          },
        },
        // Buton keyframe'leri
        pulseScaleLeft: {
          '0%, 100%': { 
            transform: 'scale(1)',
            opacity: '1'
          },
          '50%': { 
            transform: 'scale(1.08)',
            opacity: '0.9'
          }
        },
        pulseScaleRight: {
          '0%, 100%': { 
            transform: 'scale(1)',
            opacity: '1'
          },
          '50%': { 
            transform: 'scale(1.08)',
            opacity: '0.9'
          }
        },
        pingSlow: {
          '0%': { 
            transform: 'scale(1)', 
            opacity: '0.4' 
          },
          '100%': { 
            transform: 'scale(1.3)', 
            opacity: '0' 
          }
        },
        subtleMoveLeft: {
          '0%, 100%': { transform: 'translateX(0)' },
          '50%': { transform: 'translateX(-2px)' }
        },
        subtleMoveRight: {
          '0%, 100%': { transform: 'translateX(0)' },
          '50%': { transform: 'translateX(2px)' }
        }
      },
    },
  },
  plugins: [],
};