/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        abyss: '#09090B',
        'surface-1': '#0F1115',
        'surface-2': '#11131A',
        'stroke-soft': '#22252D',
        'stroke-glow': '#2D313B',
        ink: '#E5E7EB',
        'ink-dim': '#9CA3AF',
        orange: '#FF6A00',
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(255,255,255,0.03), 0 0 24px rgba(255,106,0,0.06)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
}
