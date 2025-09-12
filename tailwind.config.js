/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      screens: {
        'xs': '375px',
        'sm': '640px',
        'md': '897px', // 768'den 897'ye çıkar
        'lg': '1024px',
        'xl': '1280px',
        '2xl': '1536px',
        // Landscape özel breakpoint'ler
        'landscape': { 'raw': '(orientation: landscape)' },
        'portrait': { 'raw': '(orientation: portrait)' },
        'mobile-landscape': { 'raw': '(max-width: 896px) and (orientation: landscape)' },
      },
      animation: {
        fadeIn: "fadeIn 0.3s ease-in-out",
        'fade-in': "fadeIn 0.6s ease-in-out", // HomePage için eklendi
        slideUp: "slideUp 0.3s ease-in-out",
        slideIn: "slideIn 0.3s ease-out",
        slideRight: "slideRight 3s linear",
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
      },
    },
  },
  plugins: [],
};