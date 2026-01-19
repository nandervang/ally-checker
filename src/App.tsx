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
import { DashboardWidgets } from "@/components/DashboardWidgets";
import { SettingsSheet } from "@/components/SettingsSheet";
import { useAuth } from "@/contexts/AuthContext";
import { IconLibraryProvider, useIconLibrary } from "@/contexts/IconLibraryContext";
import { Icon } from "@/lib/icons";
import { useTheme } from "@/hooks/useTheme";
import type { AuditResult } from "@/data/mockAuditResults";
import { getUserAudits, getAudit, getAuditIssues } from "@/lib/audit";
import { getUserSettings, type UserSettings } from "@/services/settingsService";
import { ContrastChecker } from "@/components/ContrastChecker";
import { BookmarkletsTool } from "@/components/BookmarkletsTool";
import { applyDesignSettings } from "@/lib/apply-design-settings";
import "./index.css";

export function App() {
  const { t } = useTranslation();
  const { user, loading } = useAuth();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  // Load user settings
  useEffect(() => {
    if (user) {
      setIsLoadingSettings(true);
      getUserSettings()
        .then(async userSettings => {
          setSettings(userSettings);
          
          // Sync theme to localStorage so useTheme hook picks it up later
          if (userSettings.theme) {
             localStorage.setItem('theme', userSettings.theme);
             
             // Apply theme class immediately for applyDesignSettings to work correctly
             const root = window.document.documentElement;
             root.classList.remove("light", "dark");
             let effectiveTheme = userSettings.theme;
             if (effectiveTheme === 'system') {
                effectiveTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
             }
             root.classList.add(effectiveTheme);
          }

          await applyDesignSettings(userSettings);
          setIsLoadingSettings(false);
        })
        .catch(error => {
          console.error('Failed to load user settings:', error);
          setIsLoadingSettings(false);
        });
    } else {
      // If not logged in, try to load from localStorage
      const localSettings = getUserSettings().then(async s => {
         setSettings(s);
         await applyDesignSettings(s);
         setIsLoadingSettings(false);
      });
    }
  }, [user]);

  if (loading || isLoadingSettings) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-lg text-muted-foreground">{loading ? t("auth.loading") : "Loading settings..."}</p>
        </div>
      </div>
    );
  }

  // Show auth form if not logged in
  if (!user) {
    return <AuthForm />;
  }

  return (
    <IconLibraryProvider iconLibrary={settings?.iconLibrary || 'lucide'}>
      <AppContent settings={settings} onSettingsChange={setSettings} />
    </IconLibraryProvider>
  );
}

function AppContent({ settings, onSettingsChange }: { settings: UserSettings | null; onSettingsChange: (settings: UserSettings) => void }) {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const { iconLibrary } = useIconLibrary();
  const [activePanel, setActivePanel] = useState<string | null>(null);
  const [recentAudits, setRecentAudits] = useState<AuditResult[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const { user } = useAuth();
  
  useEffect(() => {
    if (user) {
      setLoadingHistory(true);
      getUserAudits(user.id)
        .then(audits => {
           setRecentAudits(audits as any);
           setLoadingHistory(false);
        })
        .catch(err => {
           console.error(err);
           setLoadingHistory(false);
        });
    }
  }, [user]);
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [contrastCheckOpen, setContrastCheckOpen] = useState(false);
  const [bookmarkletsOpen, setBookmarkletsOpen] = useState(false);

  const menuItems = [
    { id: "recent-runs", label: "Recent Runs", icon: "clock" as const },
    { id: "reports", label: "Reports", icon: "file-text" as const },
    { id: "settings", label: t("nav.settings"), icon: "settings" as const },
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
                <Icon name="menu" library={iconLibrary} className="h-5 w-5 mr-2" />
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
                      if (item.id === 'settings') {
                        setSettingsOpen(true);
                      } else {
                        setActivePanel(item.id);
                      }
                    }}
                  >
                    <Icon name={item.icon} library={iconLibrary} className="h-5 w-5" />
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
                onClick={() => {
                  if (item.id === 'settings') {
                    setSettingsOpen(true);
                  } else {
                     setActivePanel(item.id);
                  }
                }}
              >
                <Icon name={item.icon} library={iconLibrary} className="h-5 w-5 md:h-6 md:w-6" />
                {item.label}
                <Icon name="chevron-right" library={iconLibrary} className="h-4 w-4 md:h-5 md:w-5 ml-1" />
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

      {/* Audit Complete Banner */}
      {auditResult && (
        <ActionBanner variant="primary" className="mb-12">
           <div className="flex flex-col items-center text-center space-y-4">
             <div className="p-3 bg-primary-foreground/10 rounded-full mb-2">
                <Icon name="check-circle" library={iconLibrary} className="h-8 w-8 text-primary-foreground" />
             </div>
             <h2 className="text-3xl md:text-4xl font-bold">{t('banners.auditComplete.title')}</h2>
             <p className="text-xl md:text-2xl opacity-90 max-w-2xl mx-auto leading-relaxed">
               {t('banners.auditComplete.description')}
             </p>
             
             {auditResult.summary && (
               <div className="mt-6 inline-flex items-center gap-3 bg-primary-foreground/10 px-6 py-3 rounded-full border border-primary-foreground/20 backdrop-blur-sm">
                  {auditResult.summary.totalIssues > 0 ? (
                    <>
                      <Icon name="alert-triangle" library={iconLibrary} className="h-5 w-5 text-yellow-300" />
                      <span className="font-bold text-lg">
                        {t('banners.auditComplete.issuesFound', { count: auditResult.summary.totalIssues })}
                      </span>
                    </>
                  ) : (
                    <>
                      <Icon name="sparkles" library={iconLibrary} className="h-5 w-5 text-green-300" />
                      <span className="font-bold text-lg">
                        {t('banners.auditComplete.noIssues')}
                      </span>
                    </>
                  )}
               </div>
             )}
           </div>
        </ActionBanner>
      )}

      {/* Dashboard Widgets Section */}
      <DashboardWidgets 
        recentAudits={recentAudits} 
        onQuickAction={(action) => {
           if (action === 'settings') {
             setSettingsOpen(true);
           } else if (action === 'contrast') {
             setContrastCheckOpen(true);
           } else if (action === 'bookmarklets') {
             setBookmarkletsOpen(true);
           }
        }} 
      />

      <ContrastChecker open={contrastCheckOpen} onOpenChange={setContrastCheckOpen} />
      <BookmarkletsTool open={bookmarkletsOpen} onOpenChange={setBookmarkletsOpen} />

      <Footer />

      {/* Recent Runs Sheet */}
      <Sheet open={activePanel === "recent-runs"} onOpenChange={(open) => !open && setActivePanel(null)}>
        <SheetContent side="right" className="w-full sm:w-[540px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 text-2xl md:text-3xl">
              <Icon name="clock" library={iconLibrary} className="h-6 w-6 md:h-7 md:w-7" />
              Recent Runs
            </SheetTitle>
            <SheetDescription className="text-base md:text-lg">
              Your recent accessibility audits.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-4">
             {loadingHistory ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                </div>
             ) : recentAudits.length > 0 ? (
                recentAudits.map((audit: any) => (
                   <Card key={audit.id} className="cursor-pointer hover:bg-muted/50 transition-colors" onClick={async () => {
                      try {
                        let issues: any[] = [];
                        try {
                           issues = await getAuditIssues(audit.id);
                        } catch (e) {
                           console.error("Failed to fetch issues", e);
                        }

                        const mappedIssues = issues.map((i: any) => ({
                             id: i.id,
                             principle: i.wcag_principle?.toLowerCase() || 'perceivable',
                             guideline: i.wcag_criterion || 'Unknown',
                             wcagLevel: i.wcag_level || 'A',
                             severity: i.severity || 'minor',
                             title: i.title || 'Untitled Issue',
                             description: i.description || '',
                             element: i.element_html || i.element_selector || 'Unknown element',
                             selector: i.element_selector || '',
                             impact: i.user_impact || 'Moderate impact',
                             remediation: i.how_to_fix || 'No remediation provided',
                             helpUrl: i.wcag_url || '#',
                             occurrences: 1,
                             codeExample: i.code_example
                        }));

                        setAuditResult({
                          ...audit,
                          issues: mappedIssues,
                          // Ensure summary defaults to avoid crashes if legacy data
                          summary: audit.summary || {
                            totalIssues: 0,
                            critical: 0,
                            serious: 0,
                            moderate: 0,
                            minor: 0,
                            passed: 0,
                            failed: 0
                          }
                        });
                        setActivePanel(null);
                        // Scroll to results
                        setTimeout(() => {
                           const resultsElement = document.getElementById('audit-results');
                           if (resultsElement) resultsElement.scrollIntoView({ behavior: 'smooth' });
                        }, 100);
                      } catch (e) {
                         console.error(e);
                      }
                   }}>
                      <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-lg font-medium flex justify-between items-center">
                           <span className="truncate max-w-[300px]">
                            {audit.url || (audit.input_value?.length > 50 ? audit.input_value.slice(0, 50) + '...' : audit.input_value) || 'Audit'}
                           </span>
                           <span className="text-xs text-muted-foreground font-normal">
                             {new Date(audit.created_at).toLocaleDateString()}
                           </span>
                        </CardTitle>
                        <CardDescription className="flex justify-between items-center">
                           <span>{audit.document_type || 'HTML'} • {audit.ai_model || 'AI'}</span>
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                         <div className="flex gap-2 text-xs mt-2">
                           {audit.summary ? (
                             <>
                               {audit.summary.critical > 0 && (
                                <span className="bg-red-100 text-red-800 px-2 py-0.5 rounded dark:bg-red-900 dark:text-red-200 font-medium">
                                    {audit.summary.critical} Critical
                                </span>
                               )}
                               {audit.summary.serious > 0 && (
                                <span className="bg-orange-100 text-orange-800 px-2 py-0.5 rounded dark:bg-orange-900 dark:text-orange-200 font-medium">
                                    {audit.summary.serious} Serious
                                </span>
                               )}
                               {audit.summary.totalIssues === 0 && (
                                 <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded dark:bg-green-900 dark:text-green-200 font-medium">
                                   Passed
                                 </span>
                               )}
                             </>
                           ) : (
                             <span className="text-muted-foreground">In progress...</span>
                           )}
                         </div>
                      </CardContent>
                   </Card>
                ))
             ) : (
                <div className="text-center py-12 text-muted-foreground">
                   <Icon name="clock" library={iconLibrary} className="h-12 w-12 mx-auto mb-4 opacity-20" />
                   <p className="text-lg">No recent audits found</p>
                   <p className="text-sm">Run your first accessibility audit to see it here.</p>
                </div>
             )}
          </div>
        </SheetContent>
      </Sheet>

      {/* Reports Sheet */}
      <Sheet open={activePanel === "reports"} onOpenChange={(open) => !open && setActivePanel(null)}>
        <SheetContent side="right" className="w-full sm:w-[540px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 text-2xl md:text-3xl">
              <Icon name="file-text" library={iconLibrary} className="h-6 w-6 md:h-7 md:w-7" />
              Reports
            </SheetTitle>
            <SheetDescription className="text-base md:text-lg">
              Generated accessibility reports and statements.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
             <div className="flex flex-col items-center justify-center py-12 text-center space-y-4">
                <div className="p-6 bg-muted rounded-full">
                   <Icon name="file-text" library={iconLibrary} className="h-10 w-10 text-muted-foreground" />
                </div>
                <div>
                   <h3 className="text-xl font-medium mb-2">Coming Soon</h3>
                   <p className="text-muted-foreground max-w-xs mx-auto text-base">
                      Access your generated PDF reports and Accessibility Statements here.
                   </p>
                </div>
                <Button variant="outline" onClick={() => setActivePanel(null)}>
                  Close
                </Button>
             </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Settings Sheet */}
      <SettingsSheet 
        open={settingsOpen} 
        onOpenChange={setSettingsOpen}
        onSettingsChange={onSettingsChange}
      />
    </div>
  );
}

export default App;
