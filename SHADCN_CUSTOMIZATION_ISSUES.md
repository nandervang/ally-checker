# ShadCN Customization Issues

## Summary
The SettingsSheet has UI controls for style variants and icon libraries, but these features are **not implemented**. The settings are stored but don't affect the UI because the underlying CSS and icon system doesn't exist.

## Issues Found

### 1. Style Variants (NOT IMPLEMENTED)
**Problem**: The app adds CSS classes like `style-vega`, `style-nova`, `style-maia`, `style-lyra`, `style-mira` but there's **no CSS** to make them do anything.

**Current Code**:
```typescript
// src/lib/apply-design-settings.ts line 71
root.classList.remove('style-vega', 'style-nova', 'style-maia', 'style-lyra', 'style-mira');
root.classList.add(`style-${settings.style}`);
```

**Reality**: These are custom style names that don't exist in shadcn. The official shadcn docs don't mention "vega", "nova", etc. - those appear to be fictional presets.

**Options to Fix**:
1. **Remove the feature** - Delete style selector from UI since it does nothing
2. **Implement custom styles** - Create CSS for each variant defining:
   - Typography scales (heading sizes, body text)
   - Spacing values (padding, margin, gaps)
   - Component shapes (more rounded vs. sharp)
   - Density (compact vs. spacious layouts)

**Recommendation**: **Remove** the style variant feature unless you want to invest significant time defining what each style means.

---

### 2. Icon Library (WRONG IMPLEMENTATION)
**Problem**: The `iconLibrary` setting is stored but **never used**. It's a build-time shadcn CLI setting, not a runtime feature.

**Current Code**:
```tsx
// Settings UI allows selecting:
- lucide (default)
- hugeicons
- tabler
- phosphor
```

**Reality**: 
- Icon library selection is for the **shadcn CLI** when adding components
- You cannot dynamically switch icon libraries at runtime
- All current components use Lucide icons (hardcoded in imports)
- To use a different library, you'd need to:
  1. Install the new icon package
  2. Change every icon import across the codebase
  3. Rebuild components

**Example** - Current hardcoded imports:
```tsx
import { Save, RotateCcw, Download, Upload, Loader2 } from 'lucide-react';
```

**Options to Fix**:
1. **Remove the feature** - Delete icon library selector
2. **Make it informational only** - Show which library is used (Lucide) but don't allow changing
3. **Implement dynamic icons** - Create an abstraction layer (MASSIVE effort):
   ```tsx
   const Icon = createIconLoader(settings.iconLibrary);
   <Icon name="save" /> // Loads from correct library
   ```

**Recommendation**: **Remove** the icon library selector. It's misleading.

---

### 3. Quick Presets (NOT SAVING)
**Problem**: Clicking preset buttons updates settings temporarily but **doesn't save** them. On page reload, changes are lost.

**Current Code**:
```tsx
// src/components/SettingsSheet.tsx lines 467-509
<Button onClick={() => {
  updateSetting('style', 'vega');
  updateSetting('iconLibrary', 'lucide');
  updateSetting('font', 'inter');
  updateSetting('baseColor', 'neutral');
}}>
  Vega / Lucide / Inter
</Button>
```

**What `updateSetting` does**:
```typescript
function updateSetting<K extends keyof UserSettings>(key: K, value: UserSettings[K]) {
  const newSettings = { ...settings, [key]: value };
  setSettings(newSettings); // Updates local state only
  void applyDesignSettings(newSettings); // Applies CSS changes
  // ❌ DOES NOT SAVE TO DATABASE
}
```

**Fix**: Presets should call `handleSave()` after updating settings:
```tsx
<Button onClick={async () => {
  updateSetting('style', 'vega');
  updateSetting('iconLibrary', 'lucide');
  updateSetting('font', 'inter');
  updateSetting('baseColor', 'neutral');
  await handleSave(); // Save to database
}}>
```

**Recommendation**: Either **auto-save presets** or **remove the preset buttons** since they give false impression of saved changes.

---

## What DOES Work

These customization features **are implemented and working**:

✅ **Base Color** - Changes the gray/neutral palette (zinc, slate, stone, etc.)
✅ **Theme Color** - Accent colors (red, blue, green, etc.)
✅ **Border Radius** - Roundness of components
✅ **Font Family** - Typography (Inter, Figtree, Geist, Manrope)
✅ **High Contrast** - WCAG AAA color palettes
✅ **Reduce Motion** - Disables animations

These work because they:
- Have actual CSS implementations in `src/lib/theme-colors.ts`
- Apply CSS variables that shadcn components use
- Are applied via `applyDesignSettings()`

---

## Recommended Actions

### Immediate Fixes (Clean Up UI)
1. ✅ **Remove Style Variant selector** - It does nothing
2. ✅ **Remove Icon Library selector** - Can't be changed at runtime
3. ✅ **Remove Quick Presets section** - They don't save and reference non-existent features
4. ✅ **Update SettingsSheet to only show working features**

### If You Want These Features

#### To Implement Style Variants:
1. Define what each style means in CSS:
   ```css
   /* Vega - Classic shadcn look */
   .style-vega {
     --spacing-unit: 1rem;
     --heading-weight: 600;
     /* ... more custom properties ... */
   }
   
   /* Nova - Compact layouts */
   .style-nova {
     --spacing-unit: 0.75rem;
     --heading-weight: 500;
   }
   ```

2. Apply these variables to components
3. Test extensively

**Effort**: 20-40 hours to design and implement 5 cohesive style systems

#### To Implement Dynamic Icons:
1. Install all icon libraries: `bun add hugeicons tabler-icons @phosphor-icons/react`
2. Create icon abstraction:
   ```tsx
   // lib/icons.ts
   export const getIconComponent = (library: string, name: string) => {
     const iconMaps = {
       lucide: () => import('lucide-react'),
       hugeicons: () => import('hugeicons-react'),
       // etc.
     };
     // Dynamic import and return
   };
   ```
3. Replace all hardcoded icon imports across codebase
4. Handle icon name mapping (names differ across libraries)

**Effort**: 30-50 hours + ongoing maintenance

---

## Files Affected

To remove non-functional features:
- `/src/components/SettingsSheet.tsx` - Remove UI controls
- `/src/services/settingsService.ts` - Remove `style` and `iconLibrary` from UserSettings interface
- `/src/lib/apply-design-settings.ts` - Remove style class application
- `/supabase/migrations/` - Add migration to drop columns

To implement features:
- Create `/src/styles/style-variants.css` - Define style systems
- Create `/src/lib/icons.ts` - Icon abstraction layer
- Update all components using icons
