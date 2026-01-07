import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Header } from "@/components/Header";
import { Main } from "@/components/Main";
import { Footer } from "@/components/Footer";
import { AuditInputForm } from "@/components/AuditInputForm";
import { AuditResults } from "@/components/AuditResults";
import { AuthForm } from "@/components/AuthForm";
import { ActionBanner } from "@/components/ActionBanner";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/hooks/useTheme";
import { Settings, FileText, Database, ChevronRight, Menu, Sparkles, Zap } from "lucide-react";
import type { AuditResult } from "@/data/mockAuditResults";
import { getUserSettings, type UserSettings } from "@/services/settingsService";
import "./index.css";

export function App() {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { user, loading } = useAuth();
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Load user settings and apply them
  useEffect(() => {
    void getUserSettings().then((userSettings) => {
      setSettings(userSettings);
      
      // Apply font size class to document
      document.documentElement.classList.remove('font-size-small', 'font-size-medium', 'font-size-large');
      document.documentElement.classList.add(`font-size-${userSettings.fontSize}`);
      
      // Apply reduce motion preference
      if (userSettings.reduceMotion) {
        document.documentElement.classList.add('reduce-motion');
      } else {
        document.documentElement.classList.remove('reduce-motion');
      }
      
      // Apply high contrast
      if (userSettings.highContrast) {
        document.documentElement.classList.add('high-contrast');
      } else {
        document.documentElement.classList.remove('high-contrast');
      }
    });
  }, []);

  // Show loading state while checking auth
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">{t("auth.loading")}</p>
        </div>
      </div>
    );
  }

  // Show auth form if not logged in
  if (!user) {
    return <AuthForm />;
  }

  const menuItems = [
    { id: "overview", label: t("nav.overview"), icon: FileText },
    { id: "components", label: t("nav.components"), icon: Database },
    { id: "settings", label: t("nav.settings"), icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header onOpenSettings={() => setSettingsOpen(true)} />

      <Main>
        <div className="max-w-[1600px] mx-auto w-full px-8 lg:px-12 py-12">
          {/* Mobile Menu Sheet */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" className="focus-ring md:hidden mb-8">
                <Menu className="h-5 w-5 mr-2" />
                {t("nav.menu")}
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80">
              <SheetHeader>
                <SheetTitle className="text-2xl">{t("nav.menu")}</SheetTitle>
                <SheetDescription className="text-base">{t("app.subtitle")}</SheetDescription>
              </SheetHeader>
              <nav className="flex flex-col gap-2 mt-6" aria-label="Mobile navigation">
                {menuItems.map((item) => (
                  <Button
                    key={item.id}
                    variant="ghost"
                    className="justify-start gap-3 focus-ring text-lg h-auto py-3"
                    onClick={() => {
                      setActivePanel(item.id);
                    }}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Button>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
          {/* Quick Actions Bar */}
          <div className="flex gap-4 mb-12 overflow-x-auto pb-2">
            {menuItems.map((item) => (
              <Button
                key={item.id}
                variant="outline"
                className="gap-2 whitespace-nowrap focus-ring shadow-elevation-1 hover:shadow-elevation-2 transition-all text-base md:text-lg lg:text-xl h-auto py-4 px-8"
                onClick={() => setActivePanel(item.id)}
              >
                <item.icon className="h-5 w-5 md:h-6 md:w-6" />
                {item.label}
                <ChevronRight className="h-4 w-4 md:h-5 md:w-5 ml-1" />
              </Button>
            ))}
          </div>

          {/* Audit Input Form - Main Feature */}
          <div className="mt-16 mb-12">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-3 text-center">
              {t("app.title")}
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground text-center mb-10">
              {t("app.subtitle")}
            </p>
            <AuditInputForm onAuditComplete={setAuditResult} />
          </div>

          {/* Display Audit Results */}
          {auditResult && (
            <div className="mb-12">
              <AuditResults 
                result={auditResult} 
                onNewAudit={() => setAuditResult(null)}
                onDownloadReport={() => console.log("Download report", auditResult)}
              />
            </div>
          )}
        </div>
      </Main>

      {/* Action Banner - Swedbank-style full-width section */}
      <ActionBanner variant="primary">
        <h2 className="text-3xl md:text-4xl font-bold">
          {t("banners.aiPowered.title") ?? "AI-Powered Accessibility Insights"}
        </h2>
        <p className="text-lg md:text-xl opacity-90">
          {t("banners.aiPowered.description") ?? "Get expert-level accessibility analysis powered by advanced AI. Combining automated testing with intelligent pattern recognition."}
        </p>
        <div className="flex gap-4 justify-center flex-wrap mt-8">
          <Button size="lg" variant="secondary" className="gap-2 h-auto py-4 px-8 text-lg">
            <Sparkles className="h-5 w-5" />
            {t("banners.aiPowered.tryNow") ?? "Try AI Analysis"}
          </Button>
          <Button size="lg" variant="outline" className="gap-2 h-auto py-4 px-8 text-lg bg-background/10 border-primary-foreground/20 hover:bg-background/20">
            <Zap className="h-5 w-5" />
            {t("banners.aiPowered.learnMore") ?? "Learn More"}
          </Button>
        </div>
      </ActionBanner>

      <Main>
        <div className="max-w-[1600px] mx-auto w-full px-8 lg:px-12 py-12">
          {/* Content Grid - Responsive */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 w-full">
            <Card className="shadow-elevation-2 hover:shadow-elevation-3 transition-all cursor-pointer" onClick={() => setActivePanel("overview")}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl md:text-2xl lg:text-3xl">
                  <FileText className="h-6 w-6 md:h-7 md:w-7 lg:h-8 lg:w-8" />
                  {t("cards.m3Demo.title")}
                </CardTitle>
                <CardDescription className="text-base md:text-lg">
                  {t("cards.m3Demo.description")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3 flex-wrap">
                  <Button size="sm" className="text-base">{t("components.buttons.default")}</Button>
                  <Button size="sm" variant="secondary" className="text-base">{t("components.buttons.secondary")}</Button>
                  <Button size="sm" variant="outline" className="text-base">{t("components.buttons.outline")}</Button>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg text-base md:text-lg">
                  <p>✅ {t("cards.m3Demo.features.baseFont")}</p>
                  <p>✅ {t("cards.m3Demo.features.touchTargets")}</p>
                  <p>✅ {t("cards.m3Demo.features.focusRings")}</p>
                  <p>✅ {t("cards.m3Demo.features.contrast")}</p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-elevation-2 hover:shadow-elevation-3 transition-all cursor-pointer" onClick={() => setActivePanel("components")}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl md:text-2xl lg:text-3xl">
                  <Database className="h-6 w-6 md:h-7 md:w-7 lg:h-8 lg:w-8" />
                  {t("cards.uiComponents.title")}
                </CardTitle>
                <CardDescription className="text-base md:text-lg">{t("cards.uiComponents.description")}</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-base md:text-lg">
                  <li>✅ {t("cards.uiComponents.items.react")}</li>
                  <li>✅ {t("cards.uiComponents.items.shadcn")}</li>
                  <li>✅ {t("cards.uiComponents.items.tailwind")}</li>
                  <li>✅ {t("cards.uiComponents.items.linting")}</li>
                  <li>✅ {t("cards.uiComponents.items.darkMode")}</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="shadow-elevation-2 hover:shadow-elevation-3 transition-all cursor-pointer lg:col-span-2 xl:col-span-1" onClick={() => setActivePanel("settings")}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl md:text-2xl lg:text-3xl">
                  <Settings className="h-6 w-6 md:h-7 md:w-7 lg:h-8 lg:w-8" />
                  {t("cards.configuration.title")}
                </CardTitle>
                <CardDescription className="text-base md:text-lg">{t("cards.configuration.description")}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-base md:text-lg font-medium">{t("settings.themeSection")}</span>
                    <span className="text-base md:text-lg text-muted-foreground capitalize">{theme}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-base md:text-lg font-medium">{t("settings.features.focusIndicators.title")}</span>
                    <span className="text-base md:text-lg text-muted-foreground">{t("settings.features.status.active")}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-base md:text-lg font-medium">{t("settings.features.highContrast.title")}</span>
                    <span className="text-base md:text-lg text-muted-foreground">{t("settings.features.status.active")}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </Main>

      <Footer />

      <Sheet open={activePanel === "overview"} onOpenChange={(open) => !open && setActivePanel(null)}>
        <SheetContent side="right" className="w-full sm:w-[540px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 text-2xl md:text-3xl">
              <FileText className="h-6 w-6 md:h-7 md:w-7" />
              {t("overview.title")}
            </SheetTitle>
            <SheetDescription className="text-base md:text-lg">
              {t("overview.description")}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-6">
            <div>
              <h3 className="font-semibold mb-3 text-xl md:text-2xl">{t("overview.colorSystem")}</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-primary text-primary-foreground rounded-lg text-base md:text-lg">{t("overview.colors.primary")}</div>
                <div className="p-4 bg-secondary text-secondary-foreground rounded-lg text-base md:text-lg">{t("overview.colors.secondary")}</div>
                <div className="p-4 bg-accent text-accent-foreground rounded-lg text-base md:text-lg">{t("overview.colors.accent")}</div>
                <div className="p-4 bg-muted text-muted-foreground rounded-lg text-base md:text-lg">{t("overview.colors.muted")}</div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-3 text-xl md:text-2xl">{t("overview.typographyScale")}</h3>
              <div className="space-y-2">
                <p className="text-4xl md:text-5xl lg:text-6xl font-bold">{t("overview.headings.h1")}</p>
                <p className="text-3xl md:text-4xl lg:text-5xl font-bold">{t("overview.headings.h2")}</p>
                <p className="text-2xl md:text-3xl lg:text-4xl font-semibold">{t("overview.headings.h3")}</p>
                <p className="text-xl md:text-2xl lg:text-3xl">{t("overview.headings.h4")}</p>
                <p className="text-lg md:text-xl">{t("overview.headings.large")}</p>
                <p className="text-base">{t("overview.headings.body")}</p>
                <p className="text-sm md:text-base">{t("overview.headings.small")}</p>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-3 text-xl md:text-2xl">{t("overview.elevationShadows")}</h3>
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((level) => (
                  <div key={level} className={`p-4 bg-card rounded-lg shadow-elevation-${level} text-base md:text-lg`}>
                    {t("overview.elevation.level", { level })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={activePanel === "components"} onOpenChange={(open) => !open && setActivePanel(null)}>
        <SheetContent side="right" className="w-full sm:w-[540px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 text-2xl md:text-3xl">
              <Database className="h-6 w-6 md:h-7 md:w-7" />
              {t("components.title")}
            </SheetTitle>
            <SheetDescription className="text-base md:text-lg">
              {t("components.description")}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-6">
            <div>
              <h3 className="font-semibold mb-3 text-xl md:text-2xl">{t("components.interactive")}</h3>
              <div className="space-y-3">
                <div className="flex gap-2 flex-wrap">
                  <Button className="text-base">{t("components.buttons.default")}</Button>
                  <Button variant="secondary" className="text-base">{t("components.buttons.secondary")}</Button>
                  <Button variant="outline" className="text-base">{t("components.buttons.outline")}</Button>
                  <Button variant="ghost" className="text-base">{t("components.buttons.ghost")}</Button>
                  <Button variant="destructive" className="text-base">{t("components.buttons.destructive")}</Button>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-3 text-xl md:text-2xl">{t("components.installed")}</h3>
              <ul className="space-y-2 text-base md:text-lg">
                <li>✓ {t("components.list.accordion")}</li>
                <li>✓ {t("components.list.alert")}</li>
                <li>✓ {t("components.list.button")}</li>
                <li>✓ {t("components.list.card")}</li>
                <li>✓ {t("components.list.dialog")}</li>
                <li>✓ {t("components.list.dropdownMenu")}</li>
                <li>✓ {t("components.list.form")}</li>
                <li>✓ {t("components.list.progress")}</li>
                <li>✓ {t("components.list.separator")}</li>
                <li>✓ {t("components.list.sheet")}</li>
                <li>✓ {t("components.list.skeleton")}</li>
                <li>✓ {t("components.list.tabs")}</li>
                <li>✓ {t("components.list.toast")}</li>
              </ul>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={activePanel === "settings"} onOpenChange={(open) => !open && setActivePanel(null)}>
        <SheetContent side="right" className="w-full sm:w-[540px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 text-2xl md:text-3xl">
              <Settings className="h-6 w-6 md:h-7 md:w-7" />
              {t("settings.title")}
            </SheetTitle>
            <SheetDescription className="text-base md:text-lg">
              {t("settings.description")}
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-6">
            <div>
              <h3 className="font-semibold mb-3 text-xl md:text-2xl">{t("settings.themeSection")}</h3>
              <div className="flex gap-2">
                <Button
                  variant={theme === "light" ? "default" : "outline"}
                  onClick={() => {
                    setTheme("light");
                  }}
                  className="flex-1 text-base md:text-lg h-auto py-3"
                >
                  {t("theme.light")}
                </Button>
                <Button
                  variant={theme === "dark" ? "default" : "outline"}
                  onClick={() => {
                    setTheme("dark");
                  }}
                  className="flex-1 text-base md:text-lg h-auto py-3"
                >
                  {t("theme.dark")}
                </Button>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-3 text-xl md:text-2xl">{t("settings.a11yFeatures")}</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium text-base md:text-lg">{t("settings.features.focusIndicators.title")}</p>
                    <p className="text-sm md:text-base text-muted-foreground">{t("settings.features.focusIndicators.description")}</p>
                  </div>
                  <span className="text-sm md:text-base text-green-600 dark:text-green-400">{t("settings.features.status.active")}</span>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium text-base md:text-lg">{t("settings.features.touchTargets.title")}</p>
                    <p className="text-sm md:text-base text-muted-foreground">{t("settings.features.touchTargets.description")}</p>
                  </div>
                  <span className="text-sm md:text-base text-green-600 dark:text-green-400">{t("settings.features.status.active")}</span>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium text-base md:text-lg">{t("settings.features.highContrast.title")}</p>
                    <p className="text-sm md:text-base text-muted-foreground">{t("settings.features.highContrast.description")}</p>
                  </div>
                  <span className="text-sm md:text-base text-green-600 dark:text-green-400">{t("settings.features.status.active")}</span>
                </div>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Settings Sheet */}
      <SettingsSheet open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}

export default App;
