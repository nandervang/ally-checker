/**
 * Dynamic Icon Loader
 * 
 * Provides runtime icon switching between Lucide, Hugeicons, Tabler, and Phosphor
 * Based on user settings.iconLibrary preference
 */

import React, { ComponentType, SVGProps } from 'react';
import type { UserSettings } from '@/services/settingsService';

// Icon library types
export type IconLibrary = UserSettings['iconLibrary'];
export type IconProps = SVGProps<SVGSVGElement> & { size?: number | string };
export type IconComponent = ComponentType<IconProps>;

/**
 * Standard icon names used throughout the app
 * These map to equivalent icons across all libraries
 */
export type IconName =
  // UI Actions
  | 'save' | 'refresh' | 'download' | 'upload' | 'delete' | 'edit' | 'add' | 'close'
  | 'search' | 'filter' | 'settings' | 'menu' | 'more' | 'check' | 'x' | 'copy'
  // Navigation
  | 'home' | 'back' | 'forward' | 'external-link' | 'chevron-down' | 'chevron-up' 
  | 'chevron-right' | 'chevron-left'
  // Status & Feedback
  | 'loading' | 'loader' | 'success' | 'error' | 'warning' | 'info' | 'alert-circle'
  | 'check-circle' | 'check-circle-2' | 'circle'
  // Content & Files
  | 'file' | 'file-text' | 'calendar' | 'mail' | 'user' | 'clock' | 'eye'
  | 'file-code' | 'folder-open' | 'database'
  // Theme & UI
  | 'sun' | 'moon' | 'languages' | 'sparkles' | 'zap'
  // Code & Development
  | 'code' | 'code-2' | 'globe' | 'brain' | 'lightbulb' 
  // Accessibility
  | 'keyboard' | 'audio' | 'play-circle' | 'contrast'
  // Tools & Stats
  | 'activity' | 'bar-chart' | 'tool'
  // Auth
  | 'logout' | 'login';

/**
 * Icon name mappings between libraries
 * Format: { iconName: { lucide: 'LucideName', hugeicons: 'HugeiconsName', ... } }
 */
const ICON_MAP: Record<IconName, Record<IconLibrary, string>> = {
  // UI Actions
  'save': { lucide: 'Save', hugeicons: 'Save01', tabler: 'DeviceFloppy', phosphor: 'FloppyDisk' },
  'refresh': { lucide: 'RefreshCw', hugeicons: 'Loading03', tabler: 'Refresh', phosphor: 'ArrowsClockwise' },
  'download': { lucide: 'Download', hugeicons: 'Download01', tabler: 'Download', phosphor: 'Download' },
  'upload': { lucide: 'Upload', hugeicons: 'Upload01', tabler: 'Upload', phosphor: 'Upload' },
  'delete': { lucide: 'Trash2', hugeicons: 'Delete02', tabler: 'Trash', phosphor: 'Trash' },
  'edit': { lucide: 'Edit', hugeicons: 'Edit01', tabler: 'Edit', phosphor: 'Pencil' },
  'add': { lucide: 'Plus', hugeicons: 'Add01', tabler: 'Plus', phosphor: 'Plus' },
  'close': { lucide: 'X', hugeicons: 'Cancel01', tabler: 'X', phosphor: 'X' },
  'search': { lucide: 'Search', hugeicons: 'Search01', tabler: 'Search', phosphor: 'MagnifyingGlass' },
  'filter': { lucide: 'Filter', hugeicons: 'FilterHorizontal', tabler: 'Filter', phosphor: 'Funnel' },
  'settings': { lucide: 'Settings', hugeicons: 'Settings01', tabler: 'Settings', phosphor: 'Gear' },
  'menu': { lucide: 'Menu', hugeicons: 'Menu01', tabler: 'Menu2', phosphor: 'List' },
  'more': { lucide: 'MoreHorizontal', hugeicons: 'MoreHorizontal', tabler: 'Dots', phosphor: 'DotsThree' },
  'check': { lucide: 'Check', hugeicons: 'Checkmark01', tabler: 'Check', phosphor: 'Check' },
  'x': { lucide: 'X', hugeicons: 'Cancel01', tabler: 'X', phosphor: 'X' },
  'copy': { lucide: 'Copy', hugeicons: 'Copy01', tabler: 'Copy', phosphor: 'Copy' },
  
  // Navigation
  'home': { lucide: 'Home', hugeicons: 'Home01', tabler: 'Home', phosphor: 'House' },
  'back': { lucide: 'ArrowLeft', hugeicons: 'ArrowLeft01', tabler: 'ArrowLeft', phosphor: 'ArrowLeft' },
  'forward': { lucide: 'ArrowRight', hugeicons: 'ArrowRight01', tabler: 'ArrowRight', phosphor: 'ArrowRight' },
  'external-link': { lucide: 'ExternalLink', hugeicons: 'LinkSquare02', tabler: 'ExternalLink', phosphor: 'ArrowSquareOut' },
  'chevron-down': { lucide: 'ChevronDown', hugeicons: 'ArrowDown01', tabler: 'ChevronDown', phosphor: 'CaretDown' },
  'chevron-up': { lucide: 'ChevronUp', hugeicons: 'ArrowUp01', tabler: 'ChevronUp', phosphor: 'CaretUp' },
  'chevron-right': { lucide: 'ChevronRight', hugeicons: 'ArrowRight01', tabler: 'ChevronRight', phosphor: 'CaretRight' },
  'chevron-left': { lucide: 'ChevronLeft', hugeicons: 'ArrowLeft01', tabler: 'ChevronLeft', phosphor: 'CaretLeft' },
  
  // Status & Feedback
  'loading': { lucide: 'Loader2', hugeicons: 'Loading03', tabler: 'Loader2', phosphor: 'CircleNotch' },
  'loader': { lucide: 'Loader2', hugeicons: 'Loading03', tabler: 'Loader2', phosphor: 'CircleNotch' },
  'success': { lucide: 'CheckCircle', hugeicons: 'CheckmarkCircle01', tabler: 'CircleCheck', phosphor: 'CheckCircle' },
  'error': { lucide: 'XCircle', hugeicons: 'Cancel01', tabler: 'CircleX', phosphor: 'XCircle' },
  'warning': { lucide: 'AlertTriangle', hugeicons: 'Alert01', tabler: 'AlertTriangle', phosphor: 'Warning' },
  'info': { lucide: 'Info', hugeicons: 'InformationCircle', tabler: 'InfoCircle', phosphor: 'Info' },
  'alert-circle': { lucide: 'AlertCircle', hugeicons: 'Alert02', tabler: 'AlertCircle', phosphor: 'WarningCircle' },
  'check-circle': { lucide: 'CheckCircle', hugeicons: 'CheckmarkCircle01', tabler: 'CircleCheck', phosphor: 'CheckCircle' },
  'check-circle-2': { lucide: 'CheckCircle2', hugeicons: 'CheckmarkCircle01', tabler: 'CircleCheck', phosphor: 'CheckCircle' },
  'circle': { lucide: 'Circle', hugeicons: 'Circle', tabler: 'Circle', phosphor: 'Circle' },
  
  // Content & Files
  'file': { lucide: 'FileText', hugeicons: 'FileDocument', tabler: 'FileText', phosphor: 'FileText' },
  'file-text': { lucide: 'FileText', hugeicons: 'FileDocument', tabler: 'FileText', phosphor: 'FileText' },
  'calendar': { lucide: 'Calendar', hugeicons: 'Calendar01', tabler: 'Calendar', phosphor: 'Calendar' },
  'mail': { lucide: 'Mail', hugeicons: 'Mail01', tabler: 'Mail', phosphor: 'Envelope' },
  'user': { lucide: 'User', hugeicons: 'User', tabler: 'User', phosphor: 'User' },
  'clock': { lucide: 'Clock', hugeicons: 'Clock01', tabler: 'Clock', phosphor: 'Clock' },
  'eye': { lucide: 'Eye', hugeicons: 'View', tabler: 'Eye', phosphor: 'Eye' },
  'file-code': { lucide: 'FileCode', hugeicons: 'FileDocument', tabler: 'FileCode', phosphor: 'FileCode' },
  'folder-open': { lucide: 'FolderOpen', hugeicons: 'Folder01', tabler: 'FolderOpen', phosphor: 'FolderOpen' },
  'database': { lucide: 'Database', hugeicons: 'Database', tabler: 'Database', phosphor: 'Database' },
  
  // Theme & UI
  'sun': { lucide: 'Sun', hugeicons: 'Sun01', tabler: 'Sun', phosphor: 'Sun' },
  'moon': { lucide: 'Moon', hugeicons: 'Moon01', tabler: 'Moon', phosphor: 'Moon' },
  'languages': { lucide: 'Languages', hugeicons: 'LanguageCircle', tabler: 'Language', phosphor: 'Translate' },
  'sparkles': { lucide: 'Sparkles', hugeicons: 'Star', tabler: 'Sparkles', phosphor: 'Sparkle' },
  'zap': { lucide: 'Zap', hugeicons: 'Flash', tabler: 'Bolt', phosphor: 'Lightning' },
  
  // Code & Development
  'code': { lucide: 'Code', hugeicons: 'Code', tabler: 'Code', phosphor: 'Code' },
  'code-2': { lucide: 'Code2', hugeicons: 'Code', tabler: 'Code', phosphor: 'Code' },
  'globe': { lucide: 'Globe', hugeicons: 'Globe', tabler: 'World', phosphor: 'Globe' },
  'brain': { lucide: 'Brain', hugeicons: 'Brain', tabler: 'Brain', phosphor: 'Brain' },
  'lightbulb': { lucide: 'Lightbulb', hugeicons: 'Bulb', tabler: 'Bulb', phosphor: 'Lightbulb' },
  
  // Accessibility
  'keyboard': { lucide: 'Keyboard', hugeicons: 'Keyboard', tabler: 'Keyboard', phosphor: 'Keyboard' },
  'audio': { lucide: 'AudioLines', hugeicons: 'MusicNote01', tabler: 'Waveform', phosphor: 'Waveform' },
  'play-circle': { lucide: 'PlayCircle', hugeicons: 'Play', tabler: 'PlayerPlay', phosphor: 'PlayCircle' },
  'contrast': { lucide: 'Contrast', hugeicons: 'Colors', tabler: 'Contrast', phosphor: 'CircleHalf' },
  
  // Tools & Stats
  'activity': { lucide: 'Activity', hugeicons: 'Activity01', tabler: 'Activity', phosphor: 'Activity' },
  'bar-chart': { lucide: 'BarChart3', hugeicons: 'ChartHistogram', tabler: 'ChartBar', phosphor: 'ChartBar' },
  'tool': { lucide: 'Wrench', hugeicons: 'Wrench01', tabler: 'Tool', phosphor: 'Wrench' },
  
  // Auth
  'logout': { lucide: 'LogOut', hugeicons: 'Logout01', tabler: 'Logout', phosphor: 'SignOut' },
  'login': { lucide: 'LogIn', hugeicons: 'Login01', tabler: 'Login', phosphor: 'SignIn' },
};

/**
 * Lazy load icon component from the specified library
 */
async function loadIconComponent(library: IconLibrary, iconComponentName: string): Promise<IconComponent> {
  try {
    switch (library) {
      case 'lucide': {
        const module = await import('lucide-react');
        return (module as any)[iconComponentName] as IconComponent;
      }
      
      case 'hugeicons': {
        const module = await import('@hugeicons/react');
        return (module as any)[iconComponentName] as IconComponent;
      }
      
      case 'tabler': {
        const module = await import('@tabler/icons-react');
        // Tabler icons are named with Icon prefix
        const actualName = iconComponentName.startsWith('Icon') ? iconComponentName : `Icon${iconComponentName}`;
        return (module as any)[actualName] as IconComponent;
      }
      
      case 'phosphor': {
        const module = await import('@phosphor-icons/react');
        return (module as any)[iconComponentName] as IconComponent;
      }
      
      default:
        throw new Error(`Unknown icon library: ${library}`);
    }
  } catch (error) {
    console.error(`Failed to load icon ${iconComponentName} from ${library}:`, error);
    // Fallback to lucide
    if (library !== 'lucide') {
      const module = await import('lucide-react');
      return (module as any).HelpCircle as IconComponent; // Fallback icon
    }
    throw error;
  }
}

/**
 * Icon cache to avoid re-loading the same icons
 */
const iconCache = new Map<string, IconComponent>();

/**
 * Get icon component for the specified library and icon name
 */
export async function getIcon(
  iconName: IconName,
  library: IconLibrary = 'lucide'
): Promise<IconComponent> {
  const cacheKey = `${library}:${iconName}`;
  
  // Check cache first
  if (iconCache.has(cacheKey)) {
    return iconCache.get(cacheKey)!;
  }
  
  // Get the icon component name for this library
  const iconComponentName = ICON_MAP[iconName]?.[library];
  
  if (!iconComponentName) {
    console.warn(`Icon "${iconName}" not mapped for library "${library}", falling back to lucide`);
    const lucideIconName = ICON_MAP[iconName]?.lucide || 'HelpCircle';
    const component = await loadIconComponent('lucide', lucideIconName);
    iconCache.set(cacheKey, component);
    return component;
  }
  
  // Load and cache the icon component
  const component = await loadIconComponent(library, iconComponentName);
  iconCache.set(cacheKey, component);
  
  return component;
}

/**
 * React component wrapper for dynamic icons
 * 
 * Usage:
 * <Icon name="save" library={settings.iconLibrary} className="h-4 w-4" />
 */
interface DynamicIconProps extends IconProps {
  name: IconName;
  library?: IconLibrary;
}

export function Icon({ name, library = 'lucide', ...props }: DynamicIconProps) {
  const [IconComponent, setIconComponent] = React.useState<IconComponent | null>(null);
  
  React.useEffect(() => {
    void getIcon(name, library).then(setIconComponent);
  }, [name, library]);
  
  if (!IconComponent) {
    // Return a placeholder while loading
    return <span className="inline-block" style={{ width: props.size || 24, height: props.size || 24 }} />;
  }
  
  return <IconComponent {...props} />;
}

/**
 * Create a pre-loaded icon component for better performance
 * Use this when you know which icons you need at build time
 * 
 * Usage:
 * const SaveIcon = createIcon('save');
 * <SaveIcon library={settings.iconLibrary} className="h-4 w-4" />
 */
export function createIcon(iconName: IconName) {
  return function PreloadedIcon({ library = 'lucide', ...props }: Omit<DynamicIconProps, 'name'>) {
    return <Icon name={iconName} library={library} {...props} />;
  };
}
