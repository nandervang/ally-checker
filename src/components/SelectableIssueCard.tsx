import type { AuditIssue } from '@/data/mockAuditResults';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { AlertCircle, ExternalLink, Check } from 'lucide-react';
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

      <CardContent className={cn("p-6", selectionMode && "pl-16")}>
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

        <div className="space-y-2 text-sm">
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

          {issue.element && (
            <div className="mt-3">
              <div className="text-sm font-medium mb-1">Code:</div>
              <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
                <code>{issue.element}</code>
              </pre>
            </div>
          )}

          <div className="mt-3">
            <div className="font-medium mb-1">Remediation:</div>
            <p className="text-muted-foreground">{issue.remediation}</p>
          </div>

          {issue.helpUrl && (
            <a
              href={issue.helpUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-primary hover:underline mt-2"
              onClick={(e) => { if (selectionMode) e.stopPropagation(); }}
            >
              Learn more
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
