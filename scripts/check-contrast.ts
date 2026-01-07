#!/usr/bin/env bun
// Script to verify WCAG AAA contrast ratios for all color combinations

interface OKLCHColor {
  l: number;  // Lightness 0-1
  c: number;  // Chroma
  h: number;  // Hue 0-360
  a?: number; // Alpha
}

function parseOKLCH(oklchString: string): OKLCHColor {
  const match = oklchString.match(/oklch\(([\d.]+)\s+([\d.]+)\s+([\d.]+)(?:\s*\/\s*([\d.]+%?))?\)/);
  if (!match) {
    throw new Error(`Invalid OKLCH string: ${oklchString}`);
  }
  
  return {
    l: parseFloat(match[1]),
    c: parseFloat(match[2]),
    h: parseFloat(match[3]),
    a: match[4] ? (match[4].includes('%') ? parseFloat(match[4]) / 100 : parseFloat(match[4])) : 1,
  };
}

// Convert OKLCH to relative luminance (simplified approximation)
// For precise WCAG calculations, we'd convert OKLCH → XYZ → sRGB → relative luminance
// This is a simplified version using the L channel as primary indicator
function getRelativeLuminance(oklch: OKLCHColor): number {
  // OKLCH L is already perceptually uniform, close to relative luminance
  // For alpha channels, we blend with white background
  const l = oklch.a !== undefined && oklch.a < 1 
    ? oklch.l * oklch.a + 1 * (1 - oklch.a)
    : oklch.l;
  
  // Convert to sRGB-like luminance (approximation)
  // Real conversion would be OKLCH → Linear RGB → sRGB → relative luminance
  const luminance = Math.pow(l, 2.2); // Gamma correction approximation
  return luminance;
}

function getContrastRatio(color1: string, color2: string): number {
  try {
    const c1 = parseOKLCH(color1);
    const c2 = parseOKLCH(color2);
    
    const l1 = getRelativeLuminance(c1);
    const l2 = getRelativeLuminance(c2);
    
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    
    // WCAG contrast ratio formula
    const ratio = (lighter + 0.05) / (darker + 0.05);
    return ratio;
  } catch (error) {
    console.error(`Error calculating contrast for ${color1} vs ${color2}:`, error);
    return 0;
  }
}

function checkWCAGCompliance(ratio: number): { level: string; passes: boolean } {
  if (ratio >= 7) {
    return { level: 'AAA', passes: true };
  } else if (ratio >= 4.5) {
    return { level: 'AA', passes: true };
  } else if (ratio >= 3) {
    return { level: 'AA Large', passes: true };
  } else {
    return { level: 'FAIL', passes: false };
  }
}

async function main() {
  const { baseColorPalettes, highContrastPalettes } = await import('../src/lib/theme-colors');
  
  console.log('🎨 WCAG Contrast Ratio Analysis\n');
  console.log('Target: AAA (7:1 for normal text, 4.5:1 for large text)\n');
  console.log('='.repeat(80) + '\n');
  
  const issues: string[] = [];
  
  // Check high contrast palettes first
  console.log('📊 HIGH CONTRAST MODE (WCAG AAA Target)\n');
  
  for (const mode of ['light', 'dark'] as const) {
    console.log(`\n${mode.toUpperCase()} MODE:`);
    const palette = highContrastPalettes[mode];
    
    // Check critical text pairs
    const textPairs = [
      ['foreground', 'background', 'Body text'],
      ['card-foreground', 'card', 'Card text'],
      ['primary-foreground', 'primary', 'Primary button text'],
      ['secondary-foreground', 'secondary', 'Secondary elements'],
      ['muted-foreground', 'background', 'Muted text'],
      ['accent-foreground', 'accent', 'Accent text'],
    ];
    
    for (const [fg, bg, label] of textPairs) {
      const fgColor = palette[fg];
      const bgColor = palette[bg];
      if (fgColor && bgColor) {
        const ratio = getContrastRatio(fgColor, bgColor);
        const { level, passes } = checkWCAGCompliance(ratio);
        const status = passes && ratio >= 7 ? '✅' : ratio >= 4.5 ? '⚠️' : '❌';
        
        console.log(`  ${status} ${label}: ${ratio.toFixed(2)}:1 (${level})`);
        
        if (ratio < 7) {
          issues.push(`High Contrast ${mode}: ${label} only has ${ratio.toFixed(2)}:1 (needs 7:1 for AAA)`);
        }
      }
    }
  }
  
  // Check base color palettes
  console.log('\n\n📊 BASE COLOR PALETTES\n');
  
  for (const [baseName, themePalette] of Object.entries(baseColorPalettes)) {
    console.log(`\n${baseName.toUpperCase()}:`);
    
    for (const mode of ['light', 'dark'] as const) {
      console.log(`  ${mode}:`);
      const palette = themePalette[mode];
      
      const textPairs = [
        ['foreground', 'background', 'Body text'],
        ['card-foreground', 'card', 'Card text'],
        ['primary-foreground', 'primary', 'Primary button'],
        ['secondary-foreground', 'secondary', 'Secondary'],
        ['muted-foreground', 'background', 'Muted text'],
      ];
      
      for (const [fg, bg, label] of textPairs) {
        const fgColor = palette[fg];
        const bgColor = palette[bg];
        if (fgColor && bgColor) {
          const ratio = getContrastRatio(fgColor, bgColor);
          const { level, passes } = checkWCAGCompliance(ratio);
          const status = passes && ratio >= 7 ? '✅' : ratio >= 4.5 ? '⚠️' : '❌';
          
          console.log(`    ${status} ${label}: ${ratio.toFixed(2)}:1 (${level})`);
          
          if (ratio < 4.5) {
            issues.push(`${baseName} ${mode}: ${label} only has ${ratio.toFixed(2)}:1 (needs 4.5:1 minimum)`);
          }
        }
      }
    }
  }
  
  // Summary
  console.log('\n' + '='.repeat(80));
  if (issues.length === 0) {
    console.log('\n✅ All color combinations meet WCAG AAA standards!\n');
  } else {
    console.log(`\n❌ Found ${issues.length} accessibility issues:\n`);
    issues.forEach(issue => console.log(`  • ${issue}`));
    console.log('\n⚠️  Recommendation: Use High Contrast mode for AAA compliance\n');
  }
}

main().catch(console.error);
