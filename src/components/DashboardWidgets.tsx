import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Icon } from "@/lib/icons";
import { useIconLibrary } from "@/contexts/IconLibraryContext";
import { AuditResult } from "@/data/mockAuditResults";
import { ACCESSIBILITY_TIPS } from "@/data/accessibilityTips";

// --- Sub-components ---

function TipOfTheDay() {
  const { t } = useTranslation();
  const { iconLibrary } = useIconLibrary();

  // Initialize state directly to avoid useEffect setState
  const [tip, setTip] = useState(() => {
    const randomIndex = Math.floor(Math.random() * ACCESSIBILITY_TIPS.length);
    return ACCESSIBILITY_TIPS[randomIndex];
  });

  const handleNextTip = () => {
    let newTip;
    // Ensure we don't show the same tip twice in a row (unless there's only 1)
    do {
      const randomIndex = Math.floor(Math.random() * ACCESSIBILITY_TIPS.length);
      newTip = ACCESSIBILITY_TIPS[randomIndex];
    } while (newTip.id === tip.id && ACCESSIBILITY_TIPS.length > 1);
    
    setTip(newTip);
  };

  return (
    <Card className="bg-primary/5 border-primary/20 shadow-sm relative overflow-hidden">
      <CardContent className="p-6 flex flex-col md:flex-row items-start gap-4">
        <div className="p-3 bg-primary/10 rounded-full shrink-0">
           <Icon name="sparkles" library={iconLibrary} className="h-6 w-6 text-primary" />
        </div>
        <div className="space-y-2 flex-1">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                {t('dashboard.tipOfTheMoment', { title: t(`tips.${tip.id}.title`) })}
              </h3>
              <Badge variant="secondary" className="w-fit text-xs font-normal">
                {tip.category}
              </Badge>
            </div>
            
          </div>
          <p className="text-muted-foreground leading-relaxed">
            {t(`tips.${tip.id}.content`)}
          </p>
          <div className="pt-2 flex flex-wrap items-center gap-4">
            <Button 
              variant="link" 
              className="p-0 h-auto text-sm text-primary flex items-center gap-1 hover:no-underline hover:text-primary/80 group"
              asChild
            >
              <a href={tip.url} target="_blank" rel="noopener noreferrer">
                {t('dashboard.readMore', { source: tip.source })}
                <Icon name="external-link" library={iconLibrary} className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </a>
            </Button>

            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleNextTip}
              className="ml-auto md:ml-0 text-muted-foreground hover:text-foreground h-8 text-xs font-normal"
            >
              <Icon name="refresh" library={iconLibrary} className="mr-2 h-3 w-3" />
              {t('dashboard.anotherTip')}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface AccessibilityHealthProps {
  recentAudits: AuditResult[];
}

function AccessibilityHealth({ recentAudits }: AccessibilityHealthProps) {
  const { t } = useTranslation();
  const { iconLibrary } = useIconLibrary();
  
  // Calculate stats
  const totalAudits = recentAudits.length;
  const averageScore = totalAudits > 0 
    ? Math.round(recentAudits.reduce((acc, curr) => {
        // Calculate a score based on issues (Mock usage example: 100 - (issues * 5))
        // Since we don't have a direct 'score' field in the type often, we'll estimate or use a placeholder
        const issueCount = (curr.summary.totalIssues || 0);
        const score = Math.max(0, 100 - (issueCount * 5)); 
        return acc + score;
      }, 0) / totalAudits)
    : 0;

  const totalIssues = recentAudits.reduce((acc, curr) => acc + (curr.summary.totalIssues || 0), 0);

  if (totalAudits === 0) {
     return (
        <Card className="h-full">
           <CardHeader>
              <CardTitle className="flex items-center gap-2">
                 <Icon name="activity" library={iconLibrary} className="h-5 w-5 text-muted-foreground" />
                 {t('dashboard.health.title')}
              </CardTitle>
           </CardHeader>
           <CardContent className="flex flex-col items-center justify-center text-center p-6 pt-0 space-y-3">
              <div className="p-4 bg-muted rounded-full opacity-50">
                 <Icon name="bar-chart" library={iconLibrary} className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">{t('dashboard.health.empty')}</p>
           </CardContent>
        </Card>
     );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
           <Icon name="activity" library={iconLibrary} className="h-5 w-5" />
           {t('dashboard.health.title')}
        </CardTitle>
        <CardDescription>{t('dashboard.health.subtitle', { count: totalAudits })}</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-4">
         <div className="space-y-1">
            <span className="text-3xl font-bold">{averageScore}%</span>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{t('dashboard.health.avgScore')}</p>
         </div>
         <div className="space-y-1">
            <span className="text-3xl font-bold text-destructive">{totalIssues}</span>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{t('dashboard.health.totalIssues')}</p>
         </div>
      </CardContent>
    </Card>
  );
}

function QuickTools({ onAction }: { onAction: (action: string) => void }) {
  const { t } = useTranslation();
  const { iconLibrary } = useIconLibrary();

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
           <Icon name="tool" library={iconLibrary} className="h-5 w-5" />
           {t('dashboard.quickTools.title')}
        </CardTitle>
        <CardDescription>{t('dashboard.quickTools.subtitle')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
         <Button variant="outline" className="w-full justify-start gap-2 h-auto py-3" onClick={() => { onAction('contrast'); }}>
            <Icon name="contrast" library={iconLibrary} className="h-4 w-4" />
            <div className="flex flex-col items-start text-left">
               <span className="font-medium text-sm">{t('dashboard.quickTools.contrastChecker.title')}</span>
               <span className="text-[10px] text-muted-foreground">{t('dashboard.quickTools.contrastChecker.subtitle')}</span>
            </div>
         </Button>
         <Button variant="outline" className="w-full justify-start gap-2 h-auto py-3" onClick={() => { onAction('bookmarklets'); }}>
            <Icon name="bookmark" library={iconLibrary} className="h-4 w-4" />
             <div className="flex flex-col items-start text-left">
               <span className="font-medium text-sm">{t('dashboard.quickTools.bookmarklets.title')}</span>
               <span className="text-[10px] text-muted-foreground">{t('dashboard.quickTools.bookmarklets.subtitle')}</span>
            </div>
         </Button>
      </CardContent>
    </Card>
  );
}

// --- Main Container ---

interface DashboardWidgetsProps {
  recentAudits: AuditResult[];
  onQuickAction: (action: string) => void;
}

export function DashboardWidgets({ recentAudits, onQuickAction }: DashboardWidgetsProps) {
  return (
    <div className="w-full max-w-[1600px] mx-auto px-8 lg:px-12 pb-12 space-y-6">
      {/* 1. Full Width Row: Tip of the day */}
      <TipOfTheDay />

      {/* 2. 50/50 Split: Health & Tools */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AccessibilityHealth recentAudits={recentAudits} />
        <QuickTools onAction={onQuickAction} />
      </div>
    </div>
  );
}
