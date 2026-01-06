import { Button } from './ui/button';
import { Download, X, CheckSquare, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

interface IssueSelectionToolbarProps {
  count: number;
  totalIssues: number;
  onSelectAll: () => void;
  onClear: () => void;
  onGenerateReport: () => void | Promise<void>;
  onSaveCollection?: () => void;
  className?: string;
}

export function IssueSelectionToolbar({
  count,
  totalIssues,
  onSelectAll,
  onClear,
  onGenerateReport,
  onSaveCollection,
  className,
}: IssueSelectionToolbarProps) {
  if (count === 0) return null;

  return (
    <div
      role="toolbar"
      aria-label="Bulk issue actions"
      className={cn(
        "fixed bottom-6 left-1/2 -translate-x-1/2 z-50",
        "bg-primary text-primary-foreground",
        "px-6 py-4 rounded-lg shadow-2xl",
        "flex items-center gap-4 flex-wrap",
        "min-w-[min(90vw,600px)]",
        "animate-in slide-in-from-bottom-5 duration-300",
        className
      )}
    >
      <div 
        className="flex items-center gap-2 font-semibold text-lg"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <CheckSquare className="h-5 w-5" />
        <span>
          {count} issue{count !== 1 ? 's' : ''} selected
        </span>
      </div>

      <div className="flex-1" />

      <Button
        onClick={onSelectAll}
        variant="secondary"
        size="lg"
        className="gap-2 text-base font-medium"
      >
        Select All ({totalIssues})
      </Button>

      {onSaveCollection && (
        <Button
          onClick={onSaveCollection}
          variant="ghost"
          size="lg"
          className="gap-2 text-base font-medium hover:bg-primary-foreground/10"
        >
          <Save className="h-5 w-5" />
          Save Collection
        </Button>
      )}

      <Button
        onClick={onClear}
        variant="ghost"
        size="lg"
        className="gap-2 text-base font-medium hover:bg-primary-foreground/10"
      >
        <X className="h-5 w-5" />
        Clear
      </Button>

      <Button
        onClick={onGenerateReport}
        variant="default"
        size="lg"
        className="gap-2 bg-primary-foreground text-primary hover:bg-primary-foreground/90 text-base font-semibold shadow-lg"
      >
        <Download className="h-5 w-5" />
        Generate Report ({count})
      </Button>
    </div>
  );
}
