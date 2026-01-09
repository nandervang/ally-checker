/**
 * SettingsSheet - Slideout panel for user settings
 * Allows users to configure preferences without leaving the current page
 */

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Save, RotateCcw, Download, Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from '@/hooks/useTheme';
import {
  getUserSettings,
  updateUserSettings,
  resetUserSettings,
  exportSettings,
  importSettings,
  type UserSettings,
} from '@/services/settingsService';
import { applyDesignSettings } from '@/lib/apply-design-settings';

interface SettingsSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SettingsSheet({ open, onOpenChange }: SettingsSheetProps) {
  const { setTheme } = useTheme();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      void loadSettings();
    }
  }, [open]);

  // Watch for dark mode changes and re-apply colors
  useEffect(() => {
    if (!settings) return;

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          const root = document.documentElement;
          if (root.classList.contains('dark') !== (mutation.oldValue?.includes('dark') ?? false)) {
            console.log('Dark mode toggled, re-applying theme colors');
            void applyDesignSettings(settings);
          }
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeOldValue: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, [settings]);

  async function loadSettings() {
    setLoading(true);
    try {
      const data = await getUserSettings();
      setSettings(data);
      // Apply settings immediately on load
      applyDesignSettings(data);
    } catch (error) {
      console.error('Failed to load settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!settings) return;
    
    setSaving(true);
    try {
      const updated = await updateUserSettings(settings);
      setSettings(updated);
      
      // Apply settings immediately
      document.documentElement.classList.remove('font-size-small', 'font-size-medium', 'font-size-large');
      document.documentElement.classList.add(`font-size-${updated.fontSize}`);
      
      if (updated.reduceMotion) {
        document.documentElement.classList.add('reduce-motion');
      } else {
        document.documentElement.classList.remove('reduce-motion');
      }
      
      if (updated.highContrast) {
        document.documentElement.classList.add('high-contrast');
      } else {
        document.documentElement.classList.remove('high-contrast');
      }
      
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  }

  async function handleReset() {
    if (!confirm('Reset all settings to defaults? This cannot be undone.')) return;
    
    setLoading(true);
    try {
      const defaults = await resetUserSettings();
      setSettings(defaults);
      toast.success('Settings reset to defaults');
    } catch (error) {
      console.error('Failed to reset settings:', error);
      toast.error('Failed to reset settings');
    } finally {
      setLoading(false);
    }
  }

  function handleExport() {
    if (!settings) return;
    
    const json = exportSettings(settings);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ally-checker-settings.json';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Settings exported');
  }

  function handleImport() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      void file.text().then((text) => {
        return importSettings(text);
      }).then((imported) => {
        setSettings(imported);
        toast.success('Settings imported successfully');
      }).catch((error: unknown) => {
        console.error('Failed to import settings:', error);
        toast.error('Failed to import settings');
      });
    };
    input.click();
  }

  function updateSetting<K extends keyof UserSettings>(key: K, value: UserSettings[K]) {
    if (!settings) return;
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    
    // Apply design changes immediately for preview
    void applyDesignSettings(newSettings);
  }

  async function applyPreset(updates: Partial<UserSettings>) {
    if (!settings) return;
    
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    
    // Apply design changes immediately
    await applyDesignSettings(newSettings);
    
    // Save to database
    setSaving(true);
    try {
      await updateUserSettings(newSettings);
      toast.success('Preset applied and saved');
    } catch (error) {
      console.error('Failed to save preset:', error);
      toast.error('Preset applied but failed to save');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  if (!settings) {
    return (
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
          <div className="text-center text-muted-foreground">
            Failed to load settings
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-3xl">Settings</SheetTitle>
          <SheetDescription className="text-base">
            Manage your preferences and application configuration
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={handleImport}>
              <Upload className="h-4 w-4 mr-2" />
              Import
            </Button>
            <Button variant="outline" size="sm" onClick={() => { void handleReset(); }}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button onClick={() => { void handleSave(); }} disabled={saving} className="ml-auto">
              {saving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save
            </Button>
          </div>

          <Separator />

          {/* Settings Tabs */}
          <Tabs defaultValue="audit" className="space-y-4">
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="audit">Audit</TabsTrigger>
              <TabsTrigger value="design">Design</TabsTrigger>
              <TabsTrigger value="ui">UI</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
            </TabsList>

            {/* Audit Settings */}
            <TabsContent value="audit" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Analysis Mode</CardTitle>
                  <CardDescription>
                    Choose between AI-powered comprehensive analysis or quick automated testing
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="agent-mode">AI Agent Mode</Label>
                      <p className="text-sm text-muted-foreground">
                        {settings.agentMode 
                          ? "AI-powered comprehensive analysis with heuristics" 
                          : "Quick automated testing with axe-core only"}
                      </p>
                    </div>
                    <Switch
                      id="agent-mode"
                      checked={settings.agentMode}
                      onCheckedChange={(checked) => { updateSetting('agentMode', checked); }}
                    />
                  </div>

                  {settings.agentMode && (
                    <>
                      <Separator />
                      <div className="space-y-2">
                        <Label htmlFor="preferred-model">Preferred AI Model</Label>
                        <p className="text-sm text-muted-foreground mb-2">
                          Choose the AI model for accessibility audits. Gemini 2.5 Flash is recommended for speed and cost-effectiveness.
                        </p>
                        <select
                          id="preferred-model"
                          value={settings.preferredModel}
                          onChange={(e) => { updateSetting('preferredModel', e.target.value as UserSettings['preferredModel']); }}
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                          <optgroup label="Gemini (Google) - Recommended">
                            <option value="gemini-2.5-flash">Gemini 2.5 Flash - Fast, cost-effective (Default)</option>
                            <option value="gemini-2.5-pro">Gemini 2.5 Pro - Advanced reasoning, slower</option>
                          </optgroup>
                          <optgroup label="Other Models">
                            <option value="claude">Claude (Anthropic) - Best for complex analysis</option>
                            <option value="gpt4">GPT-4 (OpenAI) - Coming soon</option>
                          </optgroup>
                        </select>
                        <div className="mt-2 p-3 rounded-md bg-muted/50 text-sm">
                          <strong className="block mb-1">Selected: {
                            settings.preferredModel === 'gemini-2.5-flash' ? 'Gemini 2.5 Flash' :
                            settings.preferredModel === 'gemini-2.5-pro' ? 'Gemini 2.5 Pro' :
                            settings.preferredModel === 'claude' ? 'Claude 3.5 Sonnet' :
                            'GPT-4'
                          }</strong>
                          <span className="text-muted-foreground">
                            {settings.preferredModel === 'gemini-2.5-flash' && 
                              'Best for agentic use cases with MCP tools. 1M token context, thinking capability, FREE tier available.'}
                            {settings.preferredModel === 'gemini-2.5-pro' && 
                              'Advanced thinking model for complex reasoning. Higher cost but better quality. Use for difficult audits.'}
                            {settings.preferredModel === 'claude' && 
                              'Anthropic Claude 3.5 Sonnet - excellent for comprehensive analysis but MCP support limited.'}
                            {settings.preferredModel === 'gpt4' && 
                              'OpenAI GPT-4 integration coming soon.'}
                          </span>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>AI Model Configuration</CardTitle>
                  <CardDescription>
                    Advanced settings for AI analysis behavior
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="temperature">
                      Temperature ({settings.aiTemperature})
                    </Label>
                    <input
                      id="temperature"
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={settings.aiTemperature}
                      onChange={(e) => { updateSetting('aiTemperature', parseFloat(e.target.value)); }}
                      className="w-full"
                    />
                    <p className="text-sm text-muted-foreground">
                      Lower = focused, Higher = creative
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="max-tokens">
                      Max Tokens ({settings.aiMaxTokens})
                    </Label>
                    <input
                      id="max-tokens"
                      type="range"
                      min="1000"
                      max="8000"
                      step="100"
                      value={settings.aiMaxTokens}
                      onChange={(e) => { updateSetting('aiMaxTokens', parseInt(e.target.value)); }}
                      className="w-full"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>System Prompt</CardTitle>
                  <CardDescription>
                    Customize the AI agent's instructions and behavior
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="use-custom-prompt">Use Custom System Prompt</Label>
                      <p className="text-sm text-muted-foreground">
                        Override the default WCAG expert prompt with your own instructions
                      </p>
                    </div>
                    <Switch
                      id="use-custom-prompt"
                      checked={settings.useCustomPrompt}
                      onCheckedChange={(checked) => { updateSetting('useCustomPrompt', checked); }}
                    />
                  </div>

                  {settings.useCustomPrompt && (
                    <div className="space-y-2">
                      <Label htmlFor="custom-prompt">Custom Prompt</Label>
                      <textarea
                        id="custom-prompt"
                        className="w-full min-h-[200px] p-3 rounded-md border border-input bg-background text-sm resize-y"
                        placeholder="Enter your custom system prompt here..."
                        value={settings.customSystemPrompt || ''}
                        onChange={(e) => { updateSetting('customSystemPrompt', e.target.value); }}
                      />
                      <div className="flex justify-between items-center text-xs text-muted-foreground">
                        <span>
                          {settings.customSystemPrompt?.length || 0} characters
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            updateSetting('customSystemPrompt', undefined);
                            updateSetting('useCustomPrompt', false);
                            toast.success('Reset to default system prompt');
                          }}
                        >
                          Reset to Default
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        💡 Tip: Include instructions about WCAG criteria, user analysis expectations, 
                        and response format. The default prompt is comprehensive - only customize if 
                        you need specialized behavior.
                      </p>
                    </div>
                  )}

                  {!settings.useCustomPrompt && (
                    <div className="rounded-md bg-muted p-3 text-sm">
                      <p className="font-medium mb-1">Using Default WCAG Expert Prompt</p>
                      <p className="text-muted-foreground">
                        The default system prompt configures the AI as a WCAG 2.2 Level AA accessibility 
                        consultant with expertise in assistive technologies, systematic WCAG coverage, 
                        and detailed user impact analysis.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Action Buttons for Audit Tab */}
              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => { void handleReset(); }} className="flex-1">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset to Defaults
                </Button>
                <Button onClick={() => { void handleSave(); }} disabled={saving} className="flex-1">
                  {saving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Settings
                </Button>
              </div>
            </TabsContent>

            {/* Design Settings */}
            <TabsContent value="design" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Style & Appearance</CardTitle>
                  <CardDescription>
                    Customize the visual design system (changes apply immediately)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Presets Section */}
                  <div className="space-y-2">
                    <Label>Quick Presets</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => { void applyPreset({ style: 'vega', iconLibrary: 'lucide', font: 'inter', baseColor: 'neutral' }); }}
                        disabled={saving}
                      >
                        Vega / Lucide / Inter
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => { void applyPreset({ style: 'nova', iconLibrary: 'hugeicons', font: 'inter', baseColor: 'neutral' }); }}
                        disabled={saving}
                      >
                        Nova / Hugeicons / Inter
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => { void applyPreset({ style: 'maia', iconLibrary: 'hugeicons', font: 'figtree', baseColor: 'neutral' }); }}
                        disabled={saving}
                      >
                        Maia / Hugeicons / Figtree
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => { void applyPreset({ style: 'mira', iconLibrary: 'hugeicons', font: 'inter', baseColor: 'neutral' }); }}
                        disabled={saving}
                      >
                        Mira / Hugeicons / Inter
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Apply popular combinations from shadcn/ui
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="component-library">Component Library</Label>
                    <select
                      id="component-library"
                      value={settings.componentLibrary}
                      onChange={(e) => { updateSetting('componentLibrary', e.target.value as UserSettings['componentLibrary']); }}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="radix-ui">Radix UI (Default)</option>
                      <option value="ark-ui">Ark UI</option>
                    </select>
                    <p className="text-sm text-muted-foreground">
                      Underlying component library
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="style">Style</Label>
                    <select
                      id="style"
                      value={settings.style}
                      onChange={(e) => { updateSetting('style', e.target.value as UserSettings['style']); }}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="vega">Vega - Classic shadcn/ui look</option>
                      <option value="nova">Nova - Compact layouts</option>
                      <option value="maia">Maia - Soft and rounded</option>
                      <option value="lyra">Lyra - Boxy and sharp</option>
                      <option value="mira">Mira - Dense interfaces</option>
                    </select>
                    <p className="text-sm text-muted-foreground">
                      Visual style affects component shapes, spacing, and typography
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="base-color">Base Color</Label>
                    <select
                      id="base-color"
                      value={settings.baseColor}
                      onChange={(e) => { updateSetting('baseColor', e.target.value as UserSettings['baseColor']); }}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="gray">Gray</option>
                      <option value="zinc">Zinc</option>
                      <option value="slate">Slate</option>
                      <option value="stone">Stone</option>
                      <option value="neutral">Neutral</option>
                    </select>
                    <p className="text-sm text-muted-foreground">
                      Base color affects ALL UI elements - backgrounds, cards, borders, text
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="theme-color">Theme Color</Label>
                    <select
                      id="theme-color"
                      value={settings.themeColor}
                      onChange={(e) => { updateSetting('themeColor', e.target.value as UserSettings['themeColor']); }}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="zinc">Zinc (Neutral)</option>
                      <option value="slate">Slate</option>
                      <option value="stone">Stone</option>
                      <option value="gray">Gray</option>
                      <option value="neutral">Neutral</option>
                      <option value="red">Red</option>
                      <option value="rose">Rose</option>
                      <option value="orange">Orange</option>
                      <option value="green">Green</option>
                      <option value="blue">Blue</option>
                      <option value="yellow">Yellow</option>
                      <option value="violet">Violet</option>
                    </select>
                    <p className="text-sm text-muted-foreground">
                      Accent color for buttons, links, and highlights
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <Label htmlFor="radius">Border Radius</Label>
                    <select
                      id="radius"
                      value={settings.radius}
                      onChange={(e) => { updateSetting('radius', e.target.value as UserSettings['radius']); }}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="none">None (Sharp corners)</option>
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="large">Large</option>
                      <option value="full">Full (Pill shape)</option>
                    </select>
                    <p className="text-sm text-muted-foreground">
                      Roundness of buttons, cards, and inputs
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Typography & Icons</CardTitle>
                  <CardDescription>
                    Choose fonts and icon library
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="font">Font Family</Label>
                    <select
                      id="font"
                      value={settings.font}
                      onChange={(e) => { updateSetting('font', e.target.value as UserSettings['font']); }}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="inter">Inter (Default)</option>
                      <option value="figtree">Figtree</option>
                      <option value="geist">Geist</option>
                      <option value="manrope">Manrope</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="icon-library">Icon Library</Label>
                    <select
                      id="icon-library"
                      value={settings.iconLibrary}
                      onChange={(e) => { updateSetting('iconLibrary', e.target.value as UserSettings['iconLibrary']); }}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="lucide">Lucide - Default React icons</option>
                      <option value="hugeicons">Hugeicons - Modern stroke icons</option>
                      <option value="tabler">Tabler Icons - Customizable icons</option>
                      <option value="phosphor">Phosphor - Versatile icon family</option>
                    </select>
                  </div>
                </CardContent>
              </Card>

              {/* Preview Card */}
              <Card className="bg-accent/50">
                <CardHeader>
                  <CardTitle className="text-sm">Live Preview</CardTitle>
                  <CardDescription className="text-xs">
                    See your design changes in real-time
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="space-y-2">
                    <Button className="w-full" size="sm">
                      Sample Button
                    </Button>
                    <Button variant="outline" className="w-full" size="sm">
                      Outline Button
                    </Button>
                  </div>
                  <Card className="p-3">
                    <p className="text-sm">
                      This is a sample card showing the current border radius and font settings.
                    </p>
                  </Card>
                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>Radius: {settings.radius}</div>
                    <div>Font: {settings.font}</div>
                    <div>Style: {settings.style}</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Menu Customization</CardTitle>
                  <CardDescription>
                    Sidebar and navigation styling
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="menu-color">Menu Color</Label>
                    <select
                      id="menu-color"
                      value={settings.menuColor}
                      onChange={(e) => { updateSetting('menuColor', e.target.value as UserSettings['menuColor']); }}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="default">Default</option>
                      <option value="inverted">Inverted</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="menu-accent">Menu Accent</Label>
                    <select
                      id="menu-accent"
                      value={settings.menuAccent}
                      onChange={(e) => { updateSetting('menuAccent', e.target.value as UserSettings['menuAccent']); }}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="subtle">Subtle</option>
                      <option value="bold">Bold</option>
                    </select>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons for Design Tab */}
              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => { void handleReset(); }} className="flex-1">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset to Defaults
                </Button>
                <Button onClick={() => { void handleSave(); }} disabled={saving} className="flex-1">
                  {saving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Settings
                </Button>
              </div>
            </TabsContent>

            {/* AI Model Settings - REMOVED, moved to Audit tab */}

            {/* UI Settings */}
            <TabsContent value="ui" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Appearance</CardTitle>
                  <CardDescription>
                    Customize the look and feel
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="theme">Theme</Label>
                    <select
                      id="theme"
                      value={settings.theme}
                      onChange={(e) => { 
                        const newTheme = e.target.value as UserSettings['theme'];
                        updateSetting('theme', newTheme);
                        setTheme(newTheme);
                      }}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                      <option value="system">System (Auto)</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="font-size">Font Size</Label>
                    <select
                      id="font-size"
                      value={settings.fontSize}
                      onChange={(e) => { updateSetting('fontSize', e.target.value as UserSettings['fontSize']); }}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="small">Small</option>
                      <option value="medium">Medium</option>
                      <option value="large">Large</option>
                    </select>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="reduce-motion">Reduce Motion</Label>
                      <p className="text-sm text-muted-foreground">
                        Minimize animations
                      </p>
                    </div>
                    <Switch
                      id="reduce-motion"
                      checked={settings.reduceMotion}
                      onCheckedChange={(checked) => { updateSetting('reduceMotion', checked); }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="high-contrast">High Contrast</Label>
                      <p className="text-sm text-muted-foreground">
                        Increase contrast
                      </p>
                    </div>
                    <Switch
                      id="high-contrast"
                      checked={settings.highContrast}
                      onCheckedChange={(checked) => { updateSetting('highContrast', checked); }}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons for UI Tab */}
              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => { void handleReset(); }} className="flex-1">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset to Defaults
                </Button>
                <Button onClick={() => { void handleSave(); }} disabled={saving} className="flex-1">
                  {saving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Settings
                </Button>
              </div>
            </TabsContent>

            {/* Reports Settings */}
            <TabsContent value="reports" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Report Options</CardTitle>
                  <CardDescription>
                    Configure default report settings
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="report-template">Report Template</Label>
                    <select
                      id="report-template"
                      value={settings.defaultReportTemplate}
                      onChange={(e) => { updateSetting('defaultReportTemplate', e.target.value as UserSettings['defaultReportTemplate']); }}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="etu-swedish">ETU Swedish - Professional Swedish accessibility reports</option>
                      <option value="wcag-international">WCAG International - Standard English reports</option>
                      <option value="vpat-us">VPAT US - Section 508 compliance format</option>
                      <option value="simple">Simple - Concise developer-focused format</option>
                      <option value="technical">Technical - Detailed technical documentation</option>
                    </select>
                    <p className="text-xs text-muted-foreground">
                      Choose the format for accessibility issue reports. ETU Swedish follows Swedish standards, WCAG International uses English with WCAG guidelines.
                    </p>
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="include-screenshots">Include Screenshots</Label>
                      <p className="text-sm text-muted-foreground">
                        Add visual examples
                      </p>
                    </div>
                    <Switch
                      id="include-screenshots"
                      checked={settings.includeScreenshots}
                      onCheckedChange={(checked) => { updateSetting('includeScreenshots', checked); }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="include-code">Include Code Snippets</Label>
                      <p className="text-sm text-muted-foreground">
                        Show code examples
                      </p>
                    </div>
                    <Switch
                      id="include-code"
                      checked={settings.includeCodeSnippets}
                      onCheckedChange={(checked) => { updateSetting('includeCodeSnippets', checked); }}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons for Reports Tab */}
              <div className="flex gap-2 pt-4">
                <Button variant="outline" onClick={() => { void handleReset(); }} className="flex-1">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset to Defaults
                </Button>
                <Button onClick={() => { void handleSave(); }} disabled={saving} className="flex-1">
                  {saving ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save Settings
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
