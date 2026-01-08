/**
 * Apply design settings to the document
 * Used for initial app load and settings changes
 */

import type { UserSettings } from '@/services/settingsService';

export async function applyDesignSettings(settings: UserSettings): Promise<void> {
  const root = document.documentElement;
  
  console.log('Applying design settings:', settings);
  
  // Apply font size
  root.classList.remove('font-size-small', 'font-size-medium', 'font-size-large');
  root.classList.add(`font-size-${settings.fontSize}`);
  
  // Apply reduce motion
  if (settings.reduceMotion) {
    root.classList.add('reduce-motion');
  } else {
    root.classList.remove('reduce-motion');
  }
  
  // Apply high contrast
  if (settings.highContrast) {
    root.classList.add('high-contrast');
  } else {
    root.classList.remove('high-contrast');
  }
  
  // Apply radius, fonts, and complete color palettes
  const { getRadiusValue, getFontFamily, baseColorPalettes, themeColorOverrides, highContrastPalettes } = 
    await import('./theme-colors');
  
  root.style.setProperty('--radius', getRadiusValue(settings.radius));
  
  // Apply font family
  document.body.style.fontFamily = getFontFamily(settings.font);
  
  // Apply complete color palette using shadcn approach
  const isDark = root.classList.contains('dark');
  const mode = isDark ? 'dark' : 'light';
  
  // Get base color palette
  let basePalette = baseColorPalettes[settings.baseColor];
  if (!basePalette) {
    console.error('Base color palette not found:', settings.baseColor);
    return;
  }
  
  // Use high contrast palette if enabled (WCAG AAA compliant)
  if (settings.highContrast) {
    basePalette = highContrastPalettes[mode];
  }
  
  // Get theme color overrides
  const themeOverride = themeColorOverrides[settings.themeColor] || {};
  
  // Merge base palette with theme overrides
  const finalPalette = {
    ...basePalette[mode],
    ...(themeOverride[mode] || {})
  };
  
  // Apply all CSS variables
  Object.entries(finalPalette).forEach(([key, value]) => {
    root.style.setProperty(`--${key}`, value);
  });
  
  // Apply style variant as class
  root.classList.remove('style-vega', 'style-nova', 'style-maia', 'style-lyra', 'style-mira');
  root.classList.add(`style-${settings.style}`);
  
  console.log('Design settings applied - radius:', settings.radius, 'font:', settings.font, 'theme:', settings.themeColor);
}
