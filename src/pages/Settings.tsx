/**
 * Settings Page - User preferences and configuration
 * 
 * Provides comprehensive settings management including:
 * - AI model selection and configuration
 * - Report template preferences
 * - Accessibility statement defaults
 * - Default language selection
 * - UI preferences (theme, density, accessibility)
 * - MCP server management
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Save, RotateCcw, Download, Upload, Loader2 } from 'lucide-react';
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

export default function Settings() {
  const navigate = useNavigate();
  const { setTheme } = useTheme();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void loadSettings();
  }, []);

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
      <div className="container max-w-4xl mx-auto py-8 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="container max-w-4xl mx-auto py-8">
        <div className="text-center text-muted-foreground">
          Failed to load settings
        </div>
      </div>
    );
  }

  return (
    <div className="container max-w-[1600px] mx-auto py-12 px-8 lg:px-12 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { navigate(-1); }}
              className="mr-2"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-4xl font-bold">Settings</h1>
          </div>
          <p className="text-lg text-muted-foreground">
            Manage your preferences and application configuration
          </p>
        </div>

        <div className="flex gap-3">
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
          <Button onClick={() => { void handleSave(); }} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save
          </Button>
        </div>
      </div>

      <Separator />

      {/* Settings Tabs */}
      <Tabs defaultValue="ai" className="space-y-6">
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="ai">AI Model</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="statements">Statements</TabsTrigger>
          <TabsTrigger value="language">Language</TabsTrigger>
          <TabsTrigger value="ui">UI</TabsTrigger>
          <TabsTrigger value="mcp">MCP Servers</TabsTrigger>
        </TabsList>

        {/* AI Model Settings */}
        <TabsContent value="ai" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>AI Model Configuration</CardTitle>
              <CardDescription>
                Choose which AI model to use for accessibility analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="ai-model">AI Model</Label>
                <select
                  id="ai-model"
                  value={settings.aiModel}
                  onChange={(e) => { updateSetting('aiModel', e.target.value as UserSettings['aiModel']); }}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="AI model selection"
                >
                  <option value="gemini-pro">Google Gemini Pro (Recommended)</option>
                  <option value="gpt-4">OpenAI GPT-4</option>
                  <option value="claude-3">Anthropic Claude 3</option>
                  <option value="groq-llama">Groq (Llama 3)</option>
                  <option value="ollama-local">Ollama (Local)</option>
                </select>
                <p className="text-sm text-muted-foreground">
                  Different models have different strengths. Gemini Pro offers good balance of speed and quality.
                </p>
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
                  aria-label="AI temperature"
                />
                <p className="text-sm text-muted-foreground">
                  Lower values (0.0-0.3) are more focused and deterministic.
                  Higher values (0.7-1.0) are more creative but less consistent.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="max-tokens">Max Tokens</Label>
                <Input
                  id="max-tokens"
                  type="number"
                  min="1000"
                  max="8000"
                  step="1000"
                  value={settings.aiMaxTokens}
                  onChange={(e) => { updateSetting('aiMaxTokens', parseInt(e.target.value, 10)); }}
                  aria-label="Maximum tokens"
                />
                <p className="text-sm text-muted-foreground">
                  Maximum response length. Higher values allow more detailed analysis but cost more.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Report Settings */}
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Report Configuration</CardTitle>
              <CardDescription>
                Customize default report generation settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="report-template">Default Report Template</Label>
                <select
                  id="report-template"
                  value={settings.defaultReportTemplate}
                  onChange={(e) => { updateSetting('defaultReportTemplate', e.target.value as UserSettings['defaultReportTemplate']); }}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Report template"
                >
                  <option value="etu-standard">ETU Standard (Recommended)</option>
                  <option value="minimal">Minimal (Essential info only)</option>
                  <option value="detailed">Detailed (Comprehensive analysis)</option>
                  <option value="custom">Custom Template</option>
                </select>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="include-screenshots">Include Screenshots</Label>
                  <p className="text-sm text-muted-foreground">
                    Add visual examples of issues in reports
                  </p>
                </div>
                <Switch
                  id="include-screenshots"
                  checked={settings.includeScreenshots}
                  onCheckedChange={(checked) => { updateSetting('includeScreenshots', checked); }}
                  aria-label="Include screenshots"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="include-code">Include Code Snippets</Label>
                  <p className="text-sm text-muted-foreground">
                    Show HTML/CSS code examples in reports
                  </p>
                </div>
                <Switch
                  id="include-code"
                  checked={settings.includeCodeSnippets}
                  onCheckedChange={(checked) => { updateSetting('includeCodeSnippets', checked); }}
                  aria-label="Include code snippets"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Statement Settings */}
        <TabsContent value="statements" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Accessibility Statement Defaults</CardTitle>
              <CardDescription>
                Pre-fill organization information for faster statement generation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="org-name">Organization Name</Label>
                <Input
                  id="org-name"
                  value={settings.statementOrganizationName || ''}
                  onChange={(e) => { updateSetting('statementOrganizationName', e.target.value); }}
                  placeholder="Your Organization"
                  aria-label="Organization name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-email">Contact Email</Label>
                <Input
                  id="contact-email"
                  type="email"
                  value={settings.statementContactEmail || ''}
                  onChange={(e) => { updateSetting('statementContactEmail', e.target.value); }}
                  placeholder="accessibility@example.com"
                  aria-label="Contact email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-phone">Contact Phone</Label>
                <Input
                  id="contact-phone"
                  type="tel"
                  value={settings.statementContactPhone || ''}
                  onChange={(e) => { updateSetting('statementContactPhone', e.target.value); }}
                  placeholder="+46 8 123 456"
                  aria-label="Contact phone"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="default-conformance">Default Conformance Status</Label>
                <select
                  id="default-conformance"
                  value={settings.statementDefaultConformance}
                  onChange={(e) => { updateSetting('statementDefaultConformance', e.target.value as UserSettings['statementDefaultConformance']); }}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Default conformance status"
                >
                  <option value="Full">Full Conformance (WCAG 2.2 AA)</option>
                  <option value="Partial">Partial Conformance (Some issues found)</option>
                  <option value="Non-conformant">Non-conformant (Major issues)</option>
                </select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Language Settings */}
        <TabsContent value="language" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Language & Localization</CardTitle>
              <CardDescription>
                Choose your preferred language for the application interface
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="default-language">Default Language</Label>
                <select
                  id="default-language"
                  value={settings.defaultLanguage}
                  onChange={(e) => { updateSetting('defaultLanguage', e.target.value as UserSettings['defaultLanguage']); }}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Default language"
                >
                  <option value="en-US">English (US)</option>
                  <option value="sv-SE">Svenska (Swedish)</option>
                </select>
                <p className="text-sm text-muted-foreground">
                  Language will be applied on next page load. Some features may not be fully translated.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* UI Settings */}
        <TabsContent value="ui" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>User Interface Preferences</CardTitle>
              <CardDescription>
                Customize the look and feel of the application
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
                  aria-label="Theme"
                >
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                  <option value="system">System (Auto)</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="density">UI Density</Label>
                <select
                  id="density"
                  value={settings.uiDensity}
                  onChange={(e) => { updateSetting('uiDensity', e.target.value as UserSettings['uiDensity']); }}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="UI density"
                >
                  <option value="compact">Compact</option>
                  <option value="comfortable">Comfortable</option>
                  <option value="spacious">Spacious</option>
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="font-size">Font Size</Label>
                <select
                  id="font-size"
                  value={settings.fontSize}
                  onChange={(e) => { updateSetting('fontSize', e.target.value as UserSettings['fontSize']); }}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="Font size"
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
                    Minimize animations for accessibility
                  </p>
                </div>
                <Switch
                  id="reduce-motion"
                  checked={settings.reduceMotion}
                  onCheckedChange={(checked) => { updateSetting('reduceMotion', checked); }}
                  aria-label="Reduce motion"
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="high-contrast">High Contrast</Label>
                  <p className="text-sm text-muted-foreground">
                    Increase contrast for better visibility
                  </p>
                </div>
                <Switch
                  id="high-contrast"
                  checked={settings.highContrast}
                  onCheckedChange={(checked) => { updateSetting('highContrast', checked); }}
                  aria-label="High contrast"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* MCP Server Settings */}
        <TabsContent value="mcp" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>MCP Server Management</CardTitle>
              <CardDescription>
                Configure Model Context Protocol servers for enhanced AI capabilities
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                MCP servers extend AI capabilities with specialized tools. 
                The following servers are built-in:
              </p>
              
              <div className="space-y-2 rounded-md border p-3 text-sm">
                <div className="font-medium">Built-in MCP Servers:</div>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>axe-core-server - Automated accessibility testing with axe-core</li>
                  <li>wcag-docs-server - WCAG 2.2 documentation and guidelines</li>
                  <li>fetch-server - Fetch and analyze web pages</li>
                </ul>
              </div>

              <p className="text-sm text-muted-foreground">
              Custom MCP server configuration coming soon. You&apos;ll be able to add your own
                servers for specialized accessibility testing needs.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save reminder */}
      <div className="flex justify-end gap-2 pt-4">
        <Button variant="outline" onClick={() => { void navigate(-1); }}>
          Cancel
        </Button>
        <Button onClick={() => { void handleSave(); }} disabled={saving}>
          {saving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save Changes
        </Button>
      </div>
    </div>
  );
}
