import type { AuditIssue } from '@/data/mockAuditResults';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { Separator } from './ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { AlertCircle, ExternalLink, Check, Code2, User, Lightbulb, FileCode, Keyboard, AudioLines, Eye, CheckCircle2, PlayCircle, FileText, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SelectableIssueCardProps {
  issue: AuditIssue;
  isSelected: boolean;
  selectionMode: boolean;
  onToggle: () => void;
  principleColor?: string;
  severityConfig?: {
    color: string;
    label: string;
  };
}

export function SelectableIssueCard({
  issue,
  isSelected,
  selectionMode,
  onToggle,
  principleColor,
  severityConfig,
}: SelectableIssueCardProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault();
      onToggle();
    }
  };

  return (
    <Card
      role={selectionMode ? "checkbox" : undefined}
      aria-checked={selectionMode ? isSelected : undefined}
      aria-labelledby={`issue-${issue.id}-title`}
      tabIndex={selectionMode ? 0 : undefined}
      onClick={selectionMode ? onToggle : undefined}
      onKeyDown={selectionMode ? handleKeyDown : undefined}
      className={cn(
        "relative transition-all duration-200",
        selectionMode && "cursor-pointer",
        isSelected && selectionMode && [
          "ring-3 ring-primary ring-offset-2",
          "bg-primary/5",
          "shadow-lg",
        ]
      )}
    >
      {selectionMode && (
        <div className="absolute top-4 left-4 z-10">
          <div 
            className={cn(
              "h-6 w-6 rounded border-2 flex items-center justify-center transition-colors",
              isSelected 
                ? "bg-primary border-primary text-primary-foreground" 
                : "border-input bg-background"
            )}
            aria-hidden="true"
          >
            {isSelected && <Check className="h-4 w-4" />}
          </div>
        </div>
      )}

      {isSelected && selectionMode && (
        <div className="absolute top-4 right-4 text-primary text-2xl font-bold" aria-hidden="true">
          ✓
        </div>
      )}

      <CardContent className={cn("p-6 space-y-6", selectionMode && "pl-16")}>
        {/* Title and Severity */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <h3 id={`issue-${issue.id}-title`} className="text-lg font-semibold flex items-center gap-2">
            <AlertCircle className="h-5 w-5 shrink-0" />
            {issue.description}
          </h3>
          {severityConfig && (
            <Badge className={cn("text-sm font-semibold", severityConfig.color)}>
              {severityConfig.label}
            </Badge>
          )}
        </div>

        {/* WCAG Info and Metadata */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className={principleColor}>
            {issue.principle}
          </Badge>
          <Badge variant="outline">
            {issue.guideline}
          </Badge>
          {issue.occurrences > 1 && (
            <Badge variant="secondary">
              {issue.occurrences} occurrences
            </Badge>
          )}
        </div>

        <Separator />

        {/* User Impact Section - Påverkan */}
        {issue.impact && (
          <div className="space-y-2 bg-amber-50 dark:bg-amber-950/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
            <div className="flex items-start gap-2">
              <User className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-sm text-amber-900 dark:text-amber-200 mb-1">
                  Påverkan
                </h4>
                <p className="text-sm text-amber-800 dark:text-amber-300 whitespace-pre-wrap">
                  {issue.impact}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Element Selector */}
        {issue.selector && (
          <div className="space-y-1">
            <div className="text-sm font-medium">Element:</div>
            <code className="block bg-muted/50 px-3 py-2 rounded text-sm">{issue.selector}</code>
          </div>
        )}

        {/* Problematic Code Section - ENHANCED */}
        {issue.element && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Code2 className="h-4 w-4" />
              <span>Problematic Code:</span>
            </div>
            <pre className="bg-destructive/10 dark:bg-destructive/20 p-3 rounded-lg text-xs overflow-x-auto border-2 border-destructive/30">
              <code className="text-destructive">{issue.element}</code>
            </pre>
          </div>
        )}

        <Separator />

        {/* How to Fix Section - Så här fixar du */}
        {issue.how_to_fix && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Lightbulb className="h-4 w-4 text-accent-foreground" />
              <span>Så här fixar du (How to Fix):</span>
            </div>
            <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
              {issue.how_to_fix}
            </p>
          </div>
        )}

        {/* Corrected Code Example - NEW */}
        {issue.codeExample && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-accent-foreground">
              <FileCode className="h-4 w-4" />
              <span>Corrected Code:</span>
            </div>
            <pre className="bg-accent/50 dark:bg-accent/30 p-3 rounded-lg text-xs overflow-x-auto border-2 border-accent">
              <code className="text-accent-foreground">{issue.codeExample}</code>
            </pre>
          </div>
        )}

        <Separator />

        {/* Magenta A11y-Style Testing Section */}
        {(issue.how_to_reproduce || issue.keyboard_testing || issue.screen_reader_testing || issue.visual_testing || issue.expected_behavior) && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <PlayCircle className="h-5 w-5" />
              <span>How to Test & Reproduce</span>
            </div>
            
            <Accordion type="single" collapsible className="w-full">
              {/* How to Reproduce */}
              {issue.how_to_reproduce && (
                <AccordionItem value="reproduce" className="border border-border rounded-lg px-3 mb-2">
                  <AccordionTrigger className="text-sm hover:no-underline py-3">
                    <div className="flex items-center gap-2">
                      <PlayCircle className="h-4 w-4 text-primary" />
                      <span className="font-medium">How to Reproduce</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground pb-3">
                    <div className="bg-muted/30 p-3 rounded-md whitespace-pre-wrap">
                      {issue.how_to_reproduce}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* Keyboard Testing */}
              {issue.keyboard_testing && (
                <AccordionItem value="keyboard" className="border border-border rounded-lg px-3 mb-2">
                  <AccordionTrigger className="text-sm hover:no-underline py-3">
                    <div className="flex items-center gap-2">
                      <Keyboard className="h-4 w-4 text-primary" />
                      <span className="font-medium">Keyboard Testing</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground pb-3">
                    <div className="bg-muted/30 p-3 rounded-md whitespace-pre-wrap">
                      {issue.keyboard_testing}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* Screen Reader Testing */}
              {issue.screen_reader_testing && (
                <AccordionItem value="screenreader" className="border border-border rounded-lg px-3 mb-2">
                  <AccordionTrigger className="text-sm hover:no-underline py-3">
                    <div className="flex items-center gap-2">
                      <AudioLines className="h-4 w-4 text-primary" />
                      <span className="font-medium">Screen Reader Testing</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground pb-3">
                    <div className="bg-muted/30 p-3 rounded-md whitespace-pre-wrap">
                      {issue.screen_reader_testing}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* Visual Testing */}
              {issue.visual_testing && (
                <AccordionItem value="visual" className="border border-border rounded-lg px-3 mb-2">
                  <AccordionTrigger className="text-sm hover:no-underline py-3">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-primary" />
                      <span className="font-medium">Visual Testing</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground pb-3">
                    <div className="bg-muted/30 p-3 rounded-md whitespace-pre-wrap">
                      {issue.visual_testing}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}

              {/* Expected Behavior (WCAG Success Criteria) */}
              {issue.expected_behavior && (
                <AccordionItem value="expected" className="border border-accent rounded-lg px-3 mb-2 bg-accent/5">
                  <AccordionTrigger className="text-sm hover:no-underline py-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-accent-foreground" />
                      <span className="font-medium text-accent-foreground">Expected Behavior (WCAG)</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="text-sm pb-3">
                    <div className="bg-accent/10 p-3 rounded-md whitespace-pre-wrap text-accent-foreground">
                      {issue.expected_behavior}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )}
            </Accordion>
          </div>
        )}

        {/* Swedish ETU Report Text */}
        {issue.report_text && (
          <div className="space-y-3">
            <Separator />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <FileText className="h-5 w-5" />
                <span>Rapport (Swedish Report)</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  void navigator.clipboard.writeText(issue.report_text || '');
                  // Could add toast notification here
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-primary/10 hover:bg-primary/20 text-primary transition-colors"
                aria-label="Kopiera rapport till urklipp"
              >
                <Copy className="h-3.5 w-3.5" />
                Kopiera
              </button>
            </div>
            <div className="bg-muted/30 border-2 border-border rounded-lg p-4 font-mono text-xs">
              <pre className="whitespace-pre-wrap text-foreground overflow-x-auto">{issue.report_text}</pre>
            </div>
          </div>
        )}

        {/* Learn More Link - Läs mer */}
        {issue.wcag_url && typeof issue.wcag_url === 'string' && (
          <a
            href={issue.wcag_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:underline text-sm font-medium"
            onClick={(e) => { if (selectionMode) e.stopPropagation(); }}
          >
            Läs mer om WCAG {issue.wcag_criterion} (Read more)
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </CardContent>
    </Card>
  );
}
