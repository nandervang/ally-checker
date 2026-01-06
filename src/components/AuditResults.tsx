import { useTranslation } from "react-i18next";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { AlertCircle, CheckCircle, Download, ExternalLink, RotateCcw, CheckSquare } from "lucide-react";
import type { AuditResult, AuditIssue } from "@/data/mockAuditResults";
import { AgentTraceViewer } from "./AgentTraceViewer";
import { useIssueSelection } from "@/hooks/useIssueSelection";
import { IssueSelectionToolbar } from "./IssueSelectionToolbar";
import { SelectableIssueCard } from "./SelectableIssueCard";
import { SaveCollectionDialog } from "./SaveCollectionDialog";
import { CollectionLoader } from "./CollectionLoader";
import { StatementGeneratorDialog } from "./StatementGeneratorDialog";
import { generateCustomReport } from "@/services/customReportService";
import { saveCollection } from "@/lib/collectionService";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface AuditResultsProps {
  result: AuditResult;
  onNewAudit: () => void;
  onDownloadReport?: () => void;
}

const principleIcons: Record<string, string> = {
  perceivable: "👁️",
  operable: "⌨️",
  understandable: "🧠",
  robust: "🔧",
};

const principleColors: Record<string, string> = {
  perceivable: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-300",
  operable: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-300",
  understandable: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-purple-300",
  robust: "bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border-indigo-300",
};

const severityConfig = {
  critical: {
    color: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-300",
    label: "Critical",
  },
  serious: {
    color: "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-300",
    label: "Serious",
  },
  moderate: {
    color: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 border-yellow-300",
    label: "Moderate",
  },
  minor: {
    color: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 border-blue-300",
    label: "Minor",
  },
};

export function AuditResults({ result, onNewAudit, onDownloadReport }: AuditResultsProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [selectionMode, setSelectionMode] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [statementDialogOpen, setStatementDialogOpen] = useState(false);
  
  const {
    count: selectedCount,
    toggle,
    selectAll,
    clear,
    loadCollection,
    announcement,
    clearAnnouncement,
    isSelected,
    selectedIssues,
  } = useIssueSelection(result.issues);

  const handleSaveCollection = async (name: string, description?: string) => {
    if (selectedCount === 0) {
      toast.error("Please select at least one issue to save.");
      return;
    }

    if (!user) {
      toast.error("You must be logged in to save collections.");
      return;
    }

    try {
      await saveCollection(
        result.auditId || `audit-${String(Date.now())}`, // auditId
        name,
        selectedIssues.map(i => i.id),
        description
      );

      toast.success(`Collection "${name}" saved successfully!`);
      setSaveDialogOpen(false);
      setSaveDialogOpen(false);
    } catch (error) {
      console.error('Save collection error:', error);
      toast.error(error instanceof Error ? error.message : "Failed to save collection.");
    }
  };

  const handleGenerateCustomReport = async () => {
    if (selectedCount === 0) {
      toast.error("Please select at least one issue to generate a report.");
      return;
    }

    setGenerating(true);
    try {
      // Generate custom report
      const blob = await generateCustomReport(
        {
          auditId: `custom-${String(Date.now())}`,
          selectedIssueIds: selectedIssues.map(i => i.id),
          format: 'word', // Default to Word format
          locale: 'sv-SE',
        },
        result.issues
      );

      // Download the report
      const today = new Date().toISOString().split('T')[0];
      const filename = `custom-report-${today ?? 'unknown'}.docx`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);

      toast.success(`Custom report with ${String(selectedCount)} issue${selectedCount !== 1 ? 's' : ''} has been downloaded.`);

      // Clear selection after successful generation
      clear();
      setSelectionMode(false);
    } catch (error) {
      console.error('Report generation error:', error);
      toast.error(error instanceof Error ? error.message : "An error occurred while generating the report.");
    } finally {
      setGenerating(false);
    }
  };

  const toggleSelectionMode = () => {
    if (selectionMode) {
      clear();
    }
    setSelectionMode(!selectionMode);
  };

  // Group issues by principle
  const issuesByPrinciple = result.issues.reduce<Record<string, AuditIssue[]>>((acc, issue) => {
    if (!acc[issue.principle]) {
      acc[issue.principle] = [];
    }
    acc[issue.principle]?.push(issue);
    return acc;
  }, {});

  // Group issues by severity
  const issuesBySeverity = result.issues.reduce<Record<string, AuditIssue[]>>((acc, issue) => {
    if (!acc[issue.severity]) {
      acc[issue.severity] = [];
    }
    acc[issue.severity]?.push(issue);
    return acc;
  }, {});

  const principleNames: Record<string, string> = {
    perceivable: t("results.principles.perceivable"),
    operable: t("results.principles.operable"),
    understandable: t("results.principles.understandable"),
    robust: t("results.principles.robust"),
  };

  return (
    <Card className="shadow-elevation-3 border-2 border-primary">
      <CardHeader>
        <CardTitle className="text-2xl md:text-3xl flex items-center gap-3">
          {result.summary.failed === 0 ? (
            <CheckCircle className="h-8 w-8 text-green-500" />
          ) : (
            <AlertCircle className="h-8 w-8 text-orange-500" />
          )}
          {t("results.title")}
        </CardTitle>
        <CardDescription className="text-lg space-y-1">
          {result.url && (
            <div className="flex items-center gap-2">
              <span className="font-semibold">{t("results.url")}:</span>
              <a href={result.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                {result.url}
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          )}
          {result.fileName && (
            <div>
              <span className="font-semibold">{t("results.file")}:</span> {result.fileName}
            </div>
          )}
          <div>
            <span className="font-semibold">{t("results.type")}:</span> {result.documentType?.toUpperCase()}
            {" • "}
            <span className="font-semibold">{t("results.tested")}:</span> {new Date(result.timestamp).toLocaleString()}
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className={`p-4 rounded-lg border-2 ${severityConfig.critical.color}`}>
            <div className="text-3xl font-bold">
              {result.summary.critical}
            </div>
            <div className="text-sm font-medium">{t("results.severity.critical")}</div>
          </div>
          <div className={`p-4 rounded-lg border-2 ${severityConfig.serious.color}`}>
            <div className="text-3xl font-bold">
              {result.summary.serious}
            </div>
            <div className="text-sm font-medium">{t("results.severity.serious")}</div>
          </div>
          <div className={`p-4 rounded-lg border-2 ${severityConfig.moderate.color}`}>
            <div className="text-3xl font-bold">
              {result.summary.moderate}
            </div>
            <div className="text-sm font-medium">{t("results.severity.moderate")}</div>
          </div>
          <div className={`p-4 rounded-lg border-2 ${severityConfig.minor.color}`}>
            <div className="text-3xl font-bold">
              {result.summary.minor}
            </div>
            <div className="text-sm font-medium">{t("results.severity.minor")}</div>
          </div>
        </div>

        {/* Pass/Fail Overview */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-green-100 dark:bg-green-900/30 rounded-lg border-2 border-green-300">
            <div className="text-2xl font-bold text-green-700 dark:text-green-400">
              {result.summary.passed}
            </div>
            <div className="text-sm font-medium text-green-600 dark:text-green-300">{t("results.passed")}</div>
          </div>
          <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-lg border-2 border-red-300">
            <div className="text-2xl font-bold text-red-700 dark:text-red-400">
              {result.summary.failed}
            </div>
            <div className="text-sm font-medium text-red-600 dark:text-red-300">{t("results.failed")}</div>
          </div>
        </div>

        {/* Action Buttons - Moved to top for visibility */}
        <div className="flex flex-wrap gap-3 p-4 bg-muted/50 rounded-lg border-2 border-dashed">
          <CollectionLoader
            auditId={result.auditId || `audit-${String(Date.now())}`}
            onLoadCollection={(issueIds, collectionName) => {
              loadCollection(issueIds, collectionName);
              setSelectionMode(true);
            }}
          />
          
          <Button 
            onClick={toggleSelectionMode}
            variant={selectionMode ? "default" : "outline"}
            size="lg"
            className="gap-2"
            aria-pressed={selectionMode}
            disabled={generating}
          >
            <CheckSquare className="h-5 w-5" />
            {selectionMode ? "✓ Selection Mode Active" : "📋 Create Custom Report"}
          </Button>
          
          <Button onClick={onNewAudit} variant="outline" size="lg" className="gap-2">
            <RotateCcw className="h-5 w-5" />
            {t("results.actions.newAudit")}
          </Button>
          
          <Button 
            onClick={onDownloadReport || (() => { console.log("Download report", result); })} 
            size="lg" 
            className="gap-2"
            disabled={generating}
          >
            <Download className="h-5 w-5" />
            {t("results.actions.downloadReport")}
          </Button>
        </div>

        {/* Tabbed View: By Principle vs By Severity */}
        <Tabs defaultValue="principle" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="principle">{t("results.tabs.byPrinciple")}</TabsTrigger>
            <TabsTrigger value="severity">{t("results.tabs.bySeverity")}</TabsTrigger>
          </TabsList>

          {/* By WCAG Principle */}
          <TabsContent value="principle" className="space-y-4">
            {Object.entries(issuesByPrinciple).map(([principle, issues]) => (
              <Card key={principle} className={`${principleColors[principle] || ""} border-2`}>
                <CardHeader className="pb-3">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <span className="text-2xl">{principleIcons[principle]}</span>
                    {principleNames[principle] || principle}
                    <Badge variant="secondary" className="ml-auto">
                      {issues.length} {t("results.issues")}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {selectionMode ? (
                    // Selection mode: Use selectable cards
                    issues.map((issue) => (
                      <SelectableIssueCard
                        key={issue.id}
                        issue={issue}
                        isSelected={isSelected(issue.id)}
                        selectionMode={selectionMode}
                        onToggle={() => { toggle(issue.id); }}
                        principleColor={principleColors[principle]}
                        severityConfig={severityConfig[issue.severity]}
                      />
                    ))
                  ) : (
                    // Normal mode: Use accordion
                    <Accordion type="single" collapsible className="w-full">
                      {issues.map((issue, idx) => (
                        <AccordionItem key={issue.id} value={`issue-${String(idx)}`}>
                          <AccordionTrigger className="hover:no-underline">
                            <div className="flex items-start gap-3 text-left w-full">
                              <Badge className={severityConfig[issue.severity].color}>
                                {severityConfig[issue.severity].label}
                              </Badge>
                              <div className="flex-1">
                                <div className="font-semibold">{issue.title}</div>
                                <div className="text-sm text-muted-foreground">
                                  {issue.guideline} ({issue.wcagLevel})
                                </div>
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="space-y-3 pt-3">
                            <div>
                              <h5 className="font-semibold mb-1">{t("results.details.description")}</h5>
                              <p className="text-sm">{issue.description}</p>
                            </div>
                            <div>
                              <h5 className="font-semibold mb-1">{t("results.details.element")}</h5>
                              <code className="text-xs bg-muted p-2 rounded block overflow-x-auto">
                                {issue.element}
                              </code>
                            </div>
                            <div>
                              <h5 className="font-semibold mb-1">{t("results.details.impact")}</h5>
                              <p className="text-sm">{issue.impact}</p>
                            </div>
                            <div>
                              <h5 className="font-semibold mb-1">{t("results.details.howToFix")}</h5>
                              <p className="text-sm">{issue.remediation}</p>
                            </div>
                            {issue.occurrences > 1 && (
                              <div className="text-sm font-medium">
                                {t("results.details.occurrences", { count: issue.occurrences })}
                              </div>
                            )}
                            <div>
                              <a
                                href={issue.helpUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:underline flex items-center gap-1"
                              >
                                {t("results.details.learnMore")}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  )}
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          {/* By Severity */}
          <TabsContent value="severity" className="space-y-4">
            {(["critical", "serious", "moderate", "minor"] as const).map((severity) => {
              const issues = issuesBySeverity[severity] || [];
              if (issues.length === 0) return null;

              return (
                <Card key={severity} className={`${severityConfig[severity].color} border-2`}>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-xl flex items-center gap-2">
                      {severityConfig[severity].label}
                      <Badge variant="secondary" className="ml-auto">
                        {issues.length} {t("results.issues")}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {selectionMode ? (
                      // Selection mode: Use selectable cards
                      issues.map((issue) => (
                        <SelectableIssueCard
                          key={issue.id}
                          issue={issue}
                          isSelected={isSelected(issue.id)}
                          selectionMode={selectionMode}
                          onToggle={() => { toggle(issue.id); }}
                          principleColor={principleColors[issue.principle]}
                          severityConfig={severityConfig[severity]}
                        />
                      ))
                    ) : (
                      // Normal mode: Use accordion
                      <Accordion type="single" collapsible className="w-full">
                        {issues.map((issue, idx) => (
                          <AccordionItem key={issue.id} value={`issue-${String(idx)}`}>
                            <AccordionTrigger className="hover:no-underline">
                              <div className="flex items-start gap-3 text-left w-full">
                                <Badge className={principleColors[issue.principle]}>
                                  {principleNames[issue.principle]}
                                </Badge>
                                <div className="flex-1">
                                  <div className="font-semibold">{issue.title}</div>
                                  <div className="text-sm text-muted-foreground">
                                    {issue.guideline} ({issue.wcagLevel})
                                  </div>
                                </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent className="space-y-3 pt-3">
                            <div>
                              <h5 className="font-semibold mb-1">{t("results.details.description")}</h5>
                              <p className="text-sm">{issue.description}</p>
                            </div>
                            <div>
                              <h5 className="font-semibold mb-1">{t("results.details.element")}</h5>
                              <code className="text-xs bg-muted p-2 rounded block overflow-x-auto">
                                {issue.element}
                              </code>
                            </div>
                            <div>
                              <h5 className="font-semibold mb-1">{t("results.details.impact")}</h5>
                              <p className="text-sm">{issue.impact}</p>
                            </div>
                            <div>
                              <h5 className="font-semibold mb-1">{t("results.details.howToFix")}</h5>
                              <p className="text-sm">{issue.remediation}</p>
                            </div>
                            {issue.occurrences > 1 && (
                              <div className="text-sm font-medium">
                                {t("results.details.occurrences", { count: issue.occurrences })}
                              </div>
                            )}
                            <div>
                              <a
                                href={issue.helpUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm text-primary hover:underline flex items-center gap-1"
                              >
                                {t("results.details.learnMore")}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>
        </Tabs>

        {/* Agent Trace Viewer */}
        {result.agent_trace && <AgentTraceViewer trace={result.agent_trace} />}

        {/* Screen Reader Announcements */}
        {announcement && (
          <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="sr-only"
            onAnimationEnd={clearAnnouncement}
          >
            {announcement}
          </div>
        )}

        {/* Selection Toolbar */}
        {selectionMode && (
          <IssueSelectionToolbar
            count={selectedCount}
            totalIssues={result.issues.length}
            onSelectAll={selectAll}
            onClear={clear}
            onGenerateReport={handleGenerateCustomReport}
            onSaveCollection={() => { setSaveDialogOpen(true); }}
            onGenerateStatement={() => { setStatementDialogOpen(true); }}
          />
        )}

        {/* Save Collection Dialog */}
        <SaveCollectionDialog
          open={saveDialogOpen}
          onOpenChange={setSaveDialogOpen}
          onSave={handleSaveCollection}
          selectedCount={selectedCount}
        />

        {/* Accessibility Statement Generator Dialog */}
        <StatementGeneratorDialog
          open={statementDialogOpen}
          onOpenChange={setStatementDialogOpen}
          selectedIssues={selectedIssues}
        />
      </CardContent>
    </Card>
  );
}
