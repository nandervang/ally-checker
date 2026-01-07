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

  async function loadSettings() {
    setLoading(true);
    try {
      const data = await getUserSettings();
      setSettings(data);
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
    setSettings({ ...settings, [key]: value });
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
          <Tabs defaultValue="ai" className="space-y-4">
            <TabsList className="grid grid-cols-3 w-full">
              <TabsTrigger value="ai">AI</TabsTrigger>
              <TabsTrigger value="ui">UI</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
            </TabsList>

            {/* AI Model Settings */}
            <TabsContent value="ai" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>AI Model</CardTitle>
                  <CardDescription>
                    Choose which AI model to use for accessibility analysis
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="ai-model">Model</Label>
                    <select
                      id="ai-model"
                      value={settings.aiModel}
                      onChange={(e) => { updateSetting('aiModel', e.target.value as UserSettings['aiModel']); }}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="gemini-pro">Google Gemini Pro</option>
                      <option value="gpt-4">OpenAI GPT-4</option>
                      <option value="claude-3">Anthropic Claude 3</option>
                      <option value="groq-llama">Groq (Llama 3)</option>
                      <option value="ollama-local">Ollama (Local)</option>
                    </select>
                  </div>

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
            </TabsContent>

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
                    <Label htmlFor="report-template">Template</Label>
                    <select
                      id="report-template"
                      value={settings.defaultReportTemplate}
                      onChange={(e) => { updateSetting('defaultReportTemplate', e.target.value as UserSettings['defaultReportTemplate']); }}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="etu-standard">ETU Standard</option>
                      <option value="minimal">Minimal</option>
                      <option value="detailed">Detailed</option>
                      <option value="custom">Custom</option>
                    </select>
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
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
