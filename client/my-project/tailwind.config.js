/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "#e5e7eb",    
        background: "#ffffff",   
        foreground: "#111827",   
        primary: {
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
        },
        success: {
          600: "#16a34a",
          700: "#15803d",
        },
        danger: {
          600: "#dc2626",
          700: "#b91c1c",
        },
      },
    },
  },
  plugins: [],
}