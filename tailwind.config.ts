import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontSize: {
        // Fluid typography with clamp() - scales from mobile to ultra-wide
        'xs': ['clamp(0.75rem, 0.7rem + 0.25vw, 0.875rem)', { lineHeight: '1.5' }],
        'sm': ['clamp(0.875rem, 0.8rem + 0.35vw, 1rem)', { lineHeight: '1.5' }],
        'base': ['clamp(1.125rem, 1rem + 0.5vw, 1.5rem)', { lineHeight: '1.6' }], // 18px min
        'lg': ['clamp(1.25rem, 1.1rem + 0.75vw, 1.875rem)', { lineHeight: '1.6' }],
        'xl': ['clamp(1.5rem, 1.25rem + 1vw, 2.25rem)', { lineHeight: '1.4' }],
        '2xl': ['clamp(1.875rem, 1.5rem + 1.5vw, 3rem)', { lineHeight: '1.3' }],
        '3xl': ['clamp(2.25rem, 1.75rem + 2vw, 3.75rem)', { lineHeight: '1.2' }],
        '4xl': ['clamp(3rem, 2rem + 3vw, 5rem)', { lineHeight: '1.1' }],
        '5xl': ['clamp(3.75rem, 2.5rem + 4vw, 6rem)', { lineHeight: '1' }],
        '6xl': ['clamp(4.5rem, 3rem + 5vw, 7.5rem)', { lineHeight: '1' }],
        '7xl': ['clamp(6rem, 4rem + 7vw, 10rem)', { lineHeight: '1' }],
      },
      spacing: {
        "touch-target": "44px", // WCAG 2.2 AA requirement: 44x44px minimum
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      boxShadow: {
        // M3 Elevation tokens
        'elevation-1': '0px 1px 2px 0px rgba(0, 0, 0, 0.3), 0px 1px 3px 1px rgba(0, 0, 0, 0.15)',
        'elevation-2': '0px 1px 2px 0px rgba(0, 0, 0, 0.3), 0px 2px 6px 2px rgba(0, 0, 0, 0.15)',
        'elevation-3': '0px 4px 8px 3px rgba(0, 0, 0, 0.15), 0px 1px 3px 0px rgba(0, 0, 0, 0.3)',
        'elevation-4': '0px 6px 10px 4px rgba(0, 0, 0, 0.15), 0px 2px 3px 0px rgba(0, 0, 0, 0.3)',
        'elevation-5': '0px 8px 12px 6px rgba(0, 0, 0, 0.15), 0px 4px 4px 0px rgba(0, 0, 0, 0.3)',
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    // Custom accessibility utilities
    function({ addUtilities }) {
      addUtilities({
        '.focus-ring': {
          'outline': '3px solid',
          'outline-color': 'hsl(var(--ring))',
          'outline-offset': '2px',
        },
        '.focus-ring-inset': {
          'outline': '3px solid',
          'outline-color': 'hsl(var(--ring))',
          'outline-offset': '-3px',
        },
        '.high-contrast-text': {
          'color': 'hsl(var(--foreground))',
          'font-weight': '500',
        },
      });
    },
  ],
} satisfies Config;
