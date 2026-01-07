/**
 * Settings Service
 * 
 * Manages user preferences and application settings.
 * Provides CRUD operations with localStorage fallback for unauthenticated users.
 */

import { supabase } from '@/lib/supabase';

export interface MCPServer {
  name: string;
  command: string;
  args: string[];
  description?: string;
}

export interface UserSettings {
  id?: string;
  userId?: string;
  
  // AI Configuration
  aiModel: 'gemini-pro' | 'gpt-4' | 'claude-3' | 'groq-llama' | 'ollama-local';
  aiTemperature: number;
  aiMaxTokens: number;
  
  // Report Configuration
  defaultReportTemplate: 'etu-standard' | 'minimal' | 'detailed' | 'custom';
  includeScreenshots: boolean;
  includeCodeSnippets: boolean;
  
  // Statement Configuration
  statementOrganizationName?: string;
  statementContactEmail?: string;
  statementContactPhone?: string;
  statementDefaultConformance: 'Full' | 'Partial' | 'Non-conformant';
  
  // Localization
  defaultLanguage: 'en-US' | 'sv-SE';
  
  // UI Preferences
  theme: 'light' | 'dark' | 'system';
  uiDensity: 'compact' | 'comfortable' | 'spacious';
  fontSize: 'small' | 'medium' | 'large';
  reduceMotion: boolean;
  highContrast: boolean;
  
  // MCP Server Configuration
  customMcpServers: MCPServer[];
  
  // Metadata
  createdAt?: string;
  updatedAt?: string;
}

const DEFAULT_SETTINGS: UserSettings = {
  aiModel: 'gemini-pro',
  aiTemperature: 0.7,
  aiMaxTokens: 4000,
  defaultReportTemplate: 'etu-standard',
  includeScreenshots: true,
  includeCodeSnippets: true,
  statementDefaultConformance: 'Partial',
  defaultLanguage: 'en-US',
  theme: 'system',
  uiDensity: 'comfortable',
  fontSize: 'medium',
  reduceMotion: false,
  highContrast: false,
  customMcpServers: [],
};

const STORAGE_KEY = 'ally-checker-settings';

/**
 * Convert database column names to camelCase
 */
function dbToSettings(dbData: Record<string, unknown>): UserSettings {
  return {
    id: dbData.id as string,
    userId: dbData.user_id as string,
    aiModel: (dbData.ai_model as UserSettings['aiModel']) ?? DEFAULT_SETTINGS.aiModel,
    aiTemperature: (dbData.ai_temperature as number) ?? DEFAULT_SETTINGS.aiTemperature,
    aiMaxTokens: (dbData.ai_max_tokens as number) ?? DEFAULT_SETTINGS.aiMaxTokens,
    defaultReportTemplate: (dbData.default_report_template as UserSettings['defaultReportTemplate']) ?? DEFAULT_SETTINGS.defaultReportTemplate,
    includeScreenshots: dbData.include_screenshots !== undefined ? (dbData.include_screenshots as boolean) : DEFAULT_SETTINGS.includeScreenshots,
    includeCodeSnippets: dbData.include_code_snippets !== undefined ? (dbData.include_code_snippets as boolean) : DEFAULT_SETTINGS.includeCodeSnippets,
    statementOrganizationName: dbData.statement_organization_name as string | undefined,
    statementContactEmail: dbData.statement_contact_email as string | undefined,
    statementContactPhone: dbData.statement_contact_phone as string | undefined,
    statementDefaultConformance: (dbData.statement_default_conformance as UserSettings['statementDefaultConformance']) ?? DEFAULT_SETTINGS.statementDefaultConformance,
    defaultLanguage: (dbData.default_language as UserSettings['defaultLanguage']) ?? DEFAULT_SETTINGS.defaultLanguage,
    theme: (dbData.theme as UserSettings['theme']) ?? DEFAULT_SETTINGS.theme,
    uiDensity: (dbData.ui_density as UserSettings['uiDensity']) ?? DEFAULT_SETTINGS.uiDensity,
    fontSize: (dbData.font_size as UserSettings['fontSize']) ?? DEFAULT_SETTINGS.fontSize,
    reduceMotion: dbData.reduce_motion !== undefined ? (dbData.reduce_motion as boolean) : DEFAULT_SETTINGS.reduceMotion,
    highContrast: dbData.high_contrast !== undefined ? (dbData.high_contrast as boolean) : DEFAULT_SETTINGS.highContrast,
    customMcpServers: (dbData.custom_mcp_servers as MCPServer[]) ?? DEFAULT_SETTINGS.customMcpServers,
    createdAt: dbData.created_at as string | undefined,
    updatedAt: dbData.updated_at as string | undefined,
  };
}

/**
 * Convert camelCase settings to database column names
 */
function settingsToDb(settings: UserSettings): Record<string, unknown> {
  return {
    ai_model: settings.aiModel,
    ai_temperature: settings.aiTemperature,
    ai_max_tokens: settings.aiMaxTokens,
    default_report_template: settings.defaultReportTemplate,
    include_screenshots: settings.includeScreenshots,
    include_code_snippets: settings.includeCodeSnippets,
    statement_organization_name: settings.statementOrganizationName,
    statement_contact_email: settings.statementContactEmail,
    statement_contact_phone: settings.statementContactPhone,
    statement_default_conformance: settings.statementDefaultConformance,
    default_language: settings.defaultLanguage,
    theme: settings.theme,
    ui_density: settings.uiDensity,
    font_size: settings.fontSize,
    reduce_motion: settings.reduceMotion,
    high_contrast: settings.highContrast,
    custom_mcp_servers: settings.customMcpServers,
  };
}

/**
 * Get settings from localStorage
 */
function getLocalSettings(): UserSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) as Partial<UserSettings> };
    }
  } catch (error) {
    console.error('Failed to load settings from localStorage:', error);
  }
  return DEFAULT_SETTINGS;
}

/**
 * Save settings to localStorage
 */
function saveLocalSettings(settings: UserSettings): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save settings to localStorage:', error);
  }
}

/**
 * Get user settings from database or localStorage
 */
export async function getUserSettings(): Promise<UserSettings> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      // Not authenticated - use localStorage
      return getLocalSettings();
    }
    
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') {
        // No settings found - create default
        return await createUserSettings(DEFAULT_SETTINGS);
      }
      throw error;
    }
    
    return dbToSettings(data as Record<string, unknown>);
  } catch (error) {
    console.error('Failed to load user settings:', error);
    return getLocalSettings();
  }
}

/**
 * Create user settings (first time)
 */
export async function createUserSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      // Not authenticated - use localStorage
      const newSettings = { ...DEFAULT_SETTINGS, ...settings };
      saveLocalSettings(newSettings);
      return newSettings;
    }
    
    const settingsData = settingsToDb({ ...DEFAULT_SETTINGS, ...settings });
    
    const { data, error } = await supabase
      .from('user_settings')
      .insert({ ...settingsData as Record<string, never>, user_id: user.id })
      .select()
      .single();
    
    if (error) throw error;
    
    return dbToSettings(data as Record<string, unknown>);
  } catch (error) {
    console.error('Failed to create user settings:', error);
    const newSettings = { ...DEFAULT_SETTINGS, ...settings };
    saveLocalSettings(newSettings);
    return newSettings;
  }
}

/**
 * Update user settings
 */
export async function updateUserSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      // Not authenticated - use localStorage
      const current = getLocalSettings();
      const updated = { ...current, ...settings };
      saveLocalSettings(updated);
      return updated;
    }
    
    const settingsData = settingsToDb({ ...DEFAULT_SETTINGS, ...settings });
    
    const { data, error } = await supabase
      .from('user_settings')
      .update(settingsData as Record<string, never>)
      .eq('user_id', user.id)
      .select()
      .single();
    
    if (error) throw error;
    
    return dbToSettings(data as Record<string, unknown>);
  } catch (error) {
    console.error('Failed to update user settings:', error);
    const current = getLocalSettings();
    const updated = { ...current, ...settings };
    saveLocalSettings(updated);
    return updated;
  }
}

/**
 * Reset settings to defaults
 */
export async function resetUserSettings(): Promise<UserSettings> {
  return await updateUserSettings(DEFAULT_SETTINGS);
}

/**
 * Export settings as JSON
 */
export function exportSettings(settings: UserSettings): string {
  return JSON.stringify(settings, null, 2);
}

/**
 * Import settings from JSON
 */
export async function importSettings(json: string): Promise<UserSettings> {
  try {
    const imported = JSON.parse(json) as Partial<UserSettings>;
    return await updateUserSettings(imported);
  } catch (error) {
    console.error('Failed to import settings:', error);
    throw new Error('Invalid settings JSON format');
  }
}
