/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    "./client/index.html",
    "./client/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        // Containers get a softer corner than the elements nested inside them.
        panel: "calc(var(--radius) * 2.5)",
      },
      // The whole shadow scale is re-tinted with the surface hue, so nothing in
      // the app casts a neutral-black shadow onto warm paper.
      boxShadow: {
        sm: "0 1px 2px hsl(var(--shadow-tint) / 0.05)",
        DEFAULT:
          "0 1px 2px hsl(var(--shadow-tint) / 0.06), 0 2px 6px -2px hsl(var(--shadow-tint) / 0.08)",
        md: "0 1px 2px hsl(var(--shadow-tint) / 0.06), 0 6px 16px -6px hsl(var(--shadow-tint) / 0.12)",
        lg: "0 2px 4px hsl(var(--shadow-tint) / 0.07), 0 12px 28px -10px hsl(var(--shadow-tint) / 0.16)",
        xl: "0 3px 6px hsl(var(--shadow-tint) / 0.08), 0 24px 48px -16px hsl(var(--shadow-tint) / 0.22)",
        // The output sheet: a single low, consistent light source from above.
        sheet:
          "0 1px 1px hsl(var(--shadow-tint) / 0.04), 0 10px 30px -14px hsl(var(--shadow-tint) / 0.18)",
        // Recessed surfaces: light from above means the top edge is shaded.
        inner: "inset 0 1px 3px hsl(var(--shadow-tint) / 0.07)",
        none: "none",
      },
      fontFamily: {
        sans: [
          'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont',
          'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif',
        ],
        serif: ['Libre Baskerville', 'serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
      keyframes: {
        'chip-in': {
          '0%': { opacity: '0', transform: 'translateY(4px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'chip-out': {
          '0%': { opacity: '1', transform: 'translateY(0) scale(1)' },
          '100%': { opacity: '0', transform: 'translateY(4px) scale(0.98)' },
        },
      },
      animation: {
        'chip-in': 'chip-in 200ms ease-out both',
        'chip-out': 'chip-out 150ms ease-in both',
      },
    },
  },
  plugins: [],
}
