/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Be Vietnam Pro"', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        border:     'hsl(var(--border))',
        input:      'hsl(var(--input))',
        ring:       'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT:    'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT:    'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT:    'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT:    'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT:    'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        card: {
          DEFAULT:    'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT:    'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': { from: { height: 0 }, to: { height: 'var(--accordion-content-height)' } },
        'accordion-up':   { from: { height: 'var(--accordion-content-height)' }, to: { height: 0 } },
        'fade-in': {
          from: { opacity: 0, transform: 'translateY(8px)' },
          to:   { opacity: 1, transform: 'translateY(0)' },
        },
        'slide-in-left': {
          from: { opacity: 0, transform: 'translateX(-12px)' },
          to:   { opacity: 1, transform: 'translateX(0)' },
        },
        'pulse-soft': {
          '0%, 100%': { opacity: 1 },
          '50%':       { opacity: 0.6 },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up':   'accordion-up 0.2s ease-out',
        'fade-in':        'fade-in 0.35s ease both',
        'slide-in-left':  'slide-in-left 0.3s ease both',
        'pulse-soft':     'pulse-soft 2s ease-in-out infinite',
      },
      backgroundImage: {
        'sidebar': 'linear-gradient(180deg, #0d1b2a 0%, #0f2336 60%, #112840 100%)',
        'header':  'linear-gradient(135deg, #1d4ed8 0%, #2563eb 40%, #0ea5e9 100%)',
        'hero-card': 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 50%, #0ea5e9 100%)',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}
