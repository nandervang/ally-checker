import type { AgentTrace } from '@/types/audit';
import { Badge } from './ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';
import { Clock, Wrench, BookOpen, CheckCircle2 } from 'lucide-react';

interface AgentTraceViewerProps {
  trace: AgentTrace;
}

export function AgentTraceViewer({ trace }: AgentTraceViewerProps) {
  const formatDuration = (ms: number | undefined) => {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit',
      fractionalSecondDigits: 3
    });
  };

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          Agent Audit Trail
        </CardTitle>
        <CardDescription>
          Detailed trace of how the AI agent analyzed your content
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
            <Clock className="h-5 w-5 text-blue-600" />
            <div>
              <div className="text-sm font-medium text-blue-900 dark:text-blue-100">Duration</div>
              <div className="text-lg font-semibold text-blue-700 dark:text-blue-300">
                {formatDuration(trace.duration_ms)}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
            <Wrench className="h-5 w-5 text-purple-600" />
            <div>
              <div className="text-sm font-medium text-purple-900 dark:text-purple-100">Tools Used</div>
              <div className="text-lg font-semibold text-purple-700 dark:text-purple-300">
                {trace.tools_used.length}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
            <BookOpen className="h-5 w-5 text-green-600" />
            <div>
              <div className="text-sm font-medium text-green-900 dark:text-green-100">Sources</div>
              <div className="text-lg font-semibold text-green-700 dark:text-green-300">
                {trace.sources_consulted.length}
              </div>
            </div>
          </div>
        </div>

        {/* Tools Used */}
        {trace.tools_used.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              Tools Used
            </h3>
            <div className="flex flex-wrap gap-2">
              {trace.tools_used.map((tool, idx) => (
                <Badge key={idx} variant="secondary" className="font-mono text-xs">
                  {tool}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Sources Consulted */}
        {trace.sources_consulted.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Standards & Documentation Consulted
            </h3>
            <div className="flex flex-wrap gap-2">
              {trace.sources_consulted.map((source, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {source}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Execution Steps */}
        <div>
          <h3 className="text-sm font-semibold mb-3">Execution Timeline</h3>
          <Accordion type="multiple" className="space-y-2">
            {trace.steps.map((step, idx) => (
              <AccordionItem key={idx} value={`step-${idx}`} className="border rounded-lg">
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <div className="flex items-center gap-3 text-left w-full">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-semibold text-primary">
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{step.action}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {formatTimestamp(step.timestamp)}
                        {step.tool && (
                          <span className="ml-2">
                            • <span className="font-mono">{step.tool}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">
                  <div className="space-y-3 text-sm">
                    {step.reasoning && (
                      <div>
                        <div className="font-medium text-muted-foreground mb-1">Reasoning:</div>
                        <div className="text-foreground pl-3 border-l-2 border-primary/30">
                          {step.reasoning}
                        </div>
                      </div>
                    )}
                    {step.input && (
                      <div>
                        <div className="font-medium text-muted-foreground mb-1">Input:</div>
                        <pre className="text-xs bg-muted p-2 rounded overflow-x-auto">
                          {JSON.stringify(step.input, null, 2)}
                        </pre>
                      </div>
                    )}
                    {step.output && (
                      <div>
                        <div className="font-medium text-muted-foreground mb-1">Output:</div>
                        <div className="text-foreground pl-3 border-l-2 border-green-500/30 bg-green-50 dark:bg-green-950 p-2 rounded">
                          {step.output}
                        </div>
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </CardContent>
    </Card>
  );
}
