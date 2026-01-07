// Complete color palettes for shadcn design system
// Based on shadcn's official theming implementation

export interface ThemePalette {
  light: Record<string, string>;
  dark: Record<string, string>;
}

// Base colors (neutral palette variants)
export const baseColorPalettes: Record<string, ThemePalette> = {
  neutral: {
    light: {
      background: "oklch(1 0 0)",
      foreground: "oklch(0.145 0 0)",
      card: "oklch(1 0 0)",
      "card-foreground": "oklch(0.145 0 0)",
      popover: "oklch(1 0 0)",
      "popover-foreground": "oklch(0.145 0 0)",
      primary: "oklch(0.205 0 0)",
      "primary-foreground": "oklch(0.985 0 0)",
      secondary: "oklch(0.97 0 0)",
      "secondary-foreground": "oklch(0.205 0 0)",
      muted: "oklch(0.97 0 0)",
      "muted-foreground": "oklch(0.556 0 0)",
      accent: "oklch(0.97 0 0)",
      "accent-foreground": "oklch(0.205 0 0)",
      destructive: "oklch(0.577 0.245 27.325)",
      border: "oklch(0.922 0 0)",
      input: "oklch(0.922 0 0)",
      ring: "oklch(0.708 0 0)",
    },
    dark: {
      background: "oklch(0.145 0 0)",
      foreground: "oklch(0.985 0 0)",
      card: "oklch(0.205 0 0)",
      "card-foreground": "oklch(0.985 0 0)",
      popover: "oklch(0.205 0 0)",
      "popover-foreground": "oklch(0.985 0 0)",
      primary: "oklch(0.922 0 0)",
      "primary-foreground": "oklch(0.205 0 0)",
      secondary: "oklch(0.269 0 0)",
      "secondary-foreground": "oklch(0.985 0 0)",
      muted: "oklch(0.269 0 0)",
      "muted-foreground": "oklch(0.708 0 0)",
      accent: "oklch(0.269 0 0)",
      "accent-foreground": "oklch(0.985 0 0)",
      destructive: "oklch(0.704 0.191 22.216)",
      border: "oklch(1 0 0 / 10%)",
      input: "oklch(1 0 0 / 15%)",
      ring: "oklch(0.556 0 0)",
    },
  },
  
  zinc: {
    light: {
      background: "oklch(1 0 0)",
      foreground: "oklch(0.141 0.005 285.823)",
      card: "oklch(1 0 0)",
      "card-foreground": "oklch(0.141 0.005 285.823)",
      popover: "oklch(1 0 0)",
      "popover-foreground": "oklch(0.141 0.005 285.823)",
      primary: "oklch(0.21 0.006 285.885)",
      "primary-foreground": "oklch(0.985 0 0)",
      secondary: "oklch(0.967 0.001 286.375)",
      "secondary-foreground": "oklch(0.21 0.006 285.885)",
      muted: "oklch(0.967 0.001 286.375)",
      "muted-foreground": "oklch(0.552 0.016 285.938)",
      accent: "oklch(0.967 0.001 286.375)",
      "accent-foreground": "oklch(0.21 0.006 285.885)",
      destructive: "oklch(0.577 0.245 27.325)",
      border: "oklch(0.92 0.004 286.32)",
      input: "oklch(0.92 0.004 286.32)",
      ring: "oklch(0.705 0.015 286.067)",
    },
    dark: {
      background: "oklch(0.141 0.005 285.823)",
      foreground: "oklch(0.985 0 0)",
      card: "oklch(0.21 0.006 285.885)",
      "card-foreground": "oklch(0.985 0 0)",
      popover: "oklch(0.21 0.006 285.885)",
      "popover-foreground": "oklch(0.985 0 0)",
      primary: "oklch(0.92 0.004 286.32)",
      "primary-foreground": "oklch(0.21 0.006 285.885)",
      secondary: "oklch(0.274 0.006 286.033)",
      "secondary-foreground": "oklch(0.985 0 0)",
      muted: "oklch(0.274 0.006 286.033)",
      "muted-foreground": "oklch(0.705 0.015 286.067)",
      accent: "oklch(0.274 0.006 286.033)",
      "accent-foreground": "oklch(0.985 0 0)",
      destructive: "oklch(0.704 0.191 22.216)",
      border: "oklch(1 0 0 / 10%)",
      input: "oklch(1 0 0 / 15%)",
      ring: "oklch(0.552 0.016 285.938)",
    },
  },
  
  slate: {
    light: {
      background: "oklch(1 0 0)",
      foreground: "oklch(0.129 0.042 264.695)",
      card: "oklch(1 0 0)",
      "card-foreground": "oklch(0.129 0.042 264.695)",
      popover: "oklch(1 0 0)",
      "popover-foreground": "oklch(0.129 0.042 264.695)",
      primary: "oklch(0.208 0.042 265.755)",
      "primary-foreground": "oklch(0.984 0.003 247.858)",
      secondary: "oklch(0.968 0.007 247.896)",
      "secondary-foreground": "oklch(0.208 0.042 265.755)",
      muted: "oklch(0.968 0.007 247.896)",
      "muted-foreground": "oklch(0.554 0.046 257.417)",
      accent: "oklch(0.968 0.007 247.896)",
      "accent-foreground": "oklch(0.208 0.042 265.755)",
      destructive: "oklch(0.577 0.245 27.325)",
      border: "oklch(0.929 0.013 255.508)",
      input: "oklch(0.929 0.013 255.508)",
      ring: "oklch(0.704 0.04 256.788)",
    },
    dark: {
      background: "oklch(0.129 0.042 264.695)",
      foreground: "oklch(0.984 0.003 247.858)",
      card: "oklch(0.208 0.042 265.755)",
      "card-foreground": "oklch(0.984 0.003 247.858)",
      popover: "oklch(0.208 0.042 265.755)",
      "popover-foreground": "oklch(0.984 0.003 247.858)",
      primary: "oklch(0.929 0.013 255.508)",
      "primary-foreground": "oklch(0.208 0.042 265.755)",
      secondary: "oklch(0.279 0.041 260.031)",
      "secondary-foreground": "oklch(0.984 0.003 247.858)",
      muted: "oklch(0.279 0.041 260.031)",
      "muted-foreground": "oklch(0.704 0.04 256.788)",
      accent: "oklch(0.279 0.041 260.031)",
      "accent-foreground": "oklch(0.984 0.003 247.858)",
      destructive: "oklch(0.704 0.191 22.216)",
      border: "oklch(1 0 0 / 10%)",
      input: "oklch(1 0 0 / 15%)",
      ring: "oklch(0.551 0.027 264.364)",
    },
  },
  
  stone: {
    light: {
      background: "oklch(1 0 0)",
      foreground: "oklch(0.147 0.004 49.25)",
      card: "oklch(1 0 0)",
      "card-foreground": "oklch(0.147 0.004 49.25)",
      popover: "oklch(1 0 0)",
      "popover-foreground": "oklch(0.147 0.004 49.25)",
      primary: "oklch(0.216 0.006 56.043)",
      "primary-foreground": "oklch(0.985 0.001 106.423)",
      secondary: "oklch(0.97 0.001 106.424)",
      "secondary-foreground": "oklch(0.216 0.006 56.043)",
      muted: "oklch(0.97 0.001 106.424)",
      "muted-foreground": "oklch(0.553 0.013 58.071)",
      accent: "oklch(0.97 0.001 106.424)",
      "accent-foreground": "oklch(0.216 0.006 56.043)",
      destructive: "oklch(0.577 0.245 27.325)",
      border: "oklch(0.923 0.003 48.717)",
      input: "oklch(0.923 0.003 48.717)",
      ring: "oklch(0.709 0.01 56.259)",
    },
    dark: {
      background: "oklch(0.147 0.004 49.25)",
      foreground: "oklch(0.985 0.001 106.423)",
      card: "oklch(0.216 0.006 56.043)",
      "card-foreground": "oklch(0.985 0.001 106.423)",
      popover: "oklch(0.216 0.006 56.043)",
      "popover-foreground": "oklch(0.985 0.001 106.423)",
      primary: "oklch(0.923 0.003 48.717)",
      "primary-foreground": "oklch(0.216 0.006 56.043)",
      secondary: "oklch(0.268 0.007 34.298)",
      "secondary-foreground": "oklch(0.985 0.001 106.423)",
      muted: "oklch(0.268 0.007 34.298)",
      "muted-foreground": "oklch(0.709 0.01 56.259)",
      accent: "oklch(0.268 0.007 34.298)",
      "accent-foreground": "oklch(0.985 0.001 106.423)",
      destructive: "oklch(0.704 0.191 22.216)",
      border: "oklch(1 0 0 / 10%)",
      input: "oklch(1 0 0 / 15%)",
      ring: "oklch(0.553 0.013 58.071)",
    },
  },
  
  gray: {
    light: {
      background: "oklch(1 0 0)",
      foreground: "oklch(0.13 0.028 261.692)",
      card: "oklch(1 0 0)",
      "card-foreground": "oklch(0.13 0.028 261.692)",
      popover: "oklch(1 0 0)",
      "popover-foreground": "oklch(0.13 0.028 261.692)",
      primary: "oklch(0.21 0.034 264.665)",
      "primary-foreground": "oklch(0.985 0.002 247.839)",
      secondary: "oklch(0.967 0.003 264.542)",
      "secondary-foreground": "oklch(0.21 0.034 264.665)",
      muted: "oklch(0.967 0.003 264.542)",
      "muted-foreground": "oklch(0.551 0.027 264.364)",
      accent: "oklch(0.967 0.003 264.542)",
      "accent-foreground": "oklch(0.21 0.034 264.665)",
      destructive: "oklch(0.577 0.245 27.325)",
      border: "oklch(0.928 0.006 264.531)",
      input: "oklch(0.928 0.006 264.531)",
      ring: "oklch(0.707 0.022 261.325)",
    },
    dark: {
      background: "oklch(0.13 0.028 261.692)",
      foreground: "oklch(0.985 0.002 247.839)",
      card: "oklch(0.21 0.034 264.665)",
      "card-foreground": "oklch(0.985 0.002 247.839)",
      popover: "oklch(0.21 0.034 264.665)",
      "popover-foreground": "oklch(0.985 0.002 247.839)",
      primary: "oklch(0.928 0.006 264.531)",
      "primary-foreground": "oklch(0.21 0.034 264.665)",
      secondary: "oklch(0.278 0.033 256.848)",
      "secondary-foreground": "oklch(0.985 0.002 247.839)",
      muted: "oklch(0.278 0.033 256.848)",
      "muted-foreground": "oklch(0.707 0.022 261.325)",
      accent: "oklch(0.278 0.033 256.848)",
      "accent-foreground": "oklch(0.985 0.002 247.839)",
      destructive: "oklch(0.704 0.191 22.216)",
      border: "oklch(1 0 0 / 10%)",
      input: "oklch(1 0 0 / 15%)",
      ring: "oklch(0.551 0.027 264.364)",
    },
  },
};

// Theme color accents (these override primary colors)
export const themeColorOverrides: Record<string, { light: Partial<Record<string, string>>; dark: Partial<Record<string, string>> }> = {
  zinc: {}, // No override, uses base
  slate: {}, // No override, uses base
  stone: {}, // No override, uses base
  gray: {}, // No override, uses base
  neutral: {}, // No override, uses base
  
  red: {
    light: {
      primary: "oklch(0.577 0.245 27.325)",
      "primary-foreground": "oklch(0.985 0 0)",
      ring: "oklch(0.577 0.245 27.325)",
    },
    dark: {
      primary: "oklch(0.704 0.191 22.216)",
      "primary-foreground": "oklch(0.985 0 0)",
      ring: "oklch(0.704 0.191 22.216)",
    },
  },
  
  rose: {
    light: {
      primary: "oklch(0.636 0.229 12.422)",
      "primary-foreground": "oklch(0.985 0 0)",
      ring: "oklch(0.636 0.229 12.422)",
    },
    dark: {
      primary: "oklch(0.724 0.204 12.569)",
      "primary-foreground": "oklch(0.985 0 0)",
      ring: "oklch(0.724 0.204 12.569)",
    },
  },
  
  orange: {
    light: {
      primary: "oklch(0.68 0.17 50)",
      "primary-foreground": "oklch(0.985 0 0)",
      ring: "oklch(0.68 0.17 50)",
    },
    dark: {
      primary: "oklch(0.75 0.15 55)",
      "primary-foreground": "oklch(0.2 0 0)",
      ring: "oklch(0.75 0.15 55)",
    },
  },
  
  green: {
    light: {
      primary: "oklch(0.55 0.18 145)",
      "primary-foreground": "oklch(0.985 0 0)",
      ring: "oklch(0.55 0.18 145)",
    },
    dark: {
      primary: "oklch(0.62 0.20 150)",
      "primary-foreground": "oklch(0.985 0 0)",
      ring: "oklch(0.62 0.20 150)",
    },
  },
  
  blue: {
    light: {
      primary: "oklch(0.55 0.22 250)",
      "primary-foreground": "oklch(0.985 0 0)",
      ring: "oklch(0.55 0.22 250)",
    },
    dark: {
      primary: "oklch(0.65 0.25 255)",
      "primary-foreground": "oklch(0.985 0 0)",
      ring: "oklch(0.65 0.25 255)",
    },
  },
  
  yellow: {
    light: {
      primary: "oklch(0.75 0.15 90)",
      "primary-foreground": "oklch(0.2 0 0)",
      ring: "oklch(0.75 0.15 90)",
    },
    dark: {
      primary: "oklch(0.80 0.18 95)",
      "primary-foreground": "oklch(0.2 0 0)",
      ring: "oklch(0.80 0.18 95)",
    },
  },
  
  violet: {
    light: {
      primary: "oklch(0.55 0.25 285)",
      "primary-foreground": "oklch(0.985 0 0)",
      ring: "oklch(0.55 0.25 285)",
    },
    dark: {
      primary: "oklch(0.65 0.27 290)",
      "primary-foreground": "oklch(0.985 0 0)",
      ring: "oklch(0.65 0.27 290)",
    },
  },
};

export function getFontFamily(font: string): string {
  switch (font) {
    case 'inter':
      return '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    case 'figtree':
      return '"Figtree", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    case 'geist':
      return '"Geist Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    case 'manrope':
      return '"Manrope", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
    default:
      return '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';
  }
}

export function getRadiusValue(radius: string): string {
  switch (radius) {
    case 'none':
      return '0rem';
    case 'small':
      return '0.3rem';
    case 'medium':
      return '0.5rem';
    case 'large':
      return '0.75rem';
    case 'full':
      return '1rem';
    default:
      return '0.5rem';
  }
}
