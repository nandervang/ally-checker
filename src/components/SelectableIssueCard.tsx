import type { AuditIssue } from '@/data/mockAuditResults';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader } from './ui/card';
import { Separator } from './ui/separator';
import { AlertCircle, ExternalLink, Check, Code2, User, Lightbulb, FileCode } from 'lucide-react';
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
            <pre className="bg-red-50 dark:bg-red-950/20 p-3 rounded-lg text-xs overflow-x-auto border-2 border-red-200 dark:border-red-800">
              <code className="text-red-900 dark:text-red-200">{issue.element}</code>
            </pre>
          </div>
        )}

        <Separator />

        {/* How to Fix Section - Så här fixar du */}
        {issue.how_to_fix && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Lightbulb className="h-4 w-4 text-green-600 dark:text-green-400" />
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
            <div className="flex items-center gap-2 text-sm font-medium text-green-700 dark:text-green-400">
              <FileCode className="h-4 w-4" />
              <span>Corrected Code:</span>
            </div>
            <pre className="bg-green-50 dark:bg-green-950/20 p-3 rounded-lg text-xs overflow-x-auto border-2 border-green-200 dark:border-green-800">
              <code className="text-green-900 dark:text-green-200">{issue.codeExample}</code>
            </pre>
          </div>
        )}

        {/* Learn More Link - Läs mer */}
        {issue.wcag_url && (
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
