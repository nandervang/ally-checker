/**
 * StatementGeneratorDialog - Generate accessibility statements
 * 
 * Collects organization info and generates compliant accessibility statements
 * from selected issues in HTML, Markdown, and plain text formats.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Download, Loader2, Eye } from 'lucide-react';
import { generateAccessibilityStatement, downloadStatement } from '@/services/accessibilityStatementService';
import type { AuditIssue } from '@/data/mockAuditResults';
import { toast } from 'sonner';

interface StatementGeneratorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedIssues: AuditIssue[];
}

export function StatementGeneratorDialog({
  open,
  onOpenChange,
  selectedIssues,
}: StatementGeneratorDialogProps) {
  const [organizationName, setOrganizationName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [statement, setStatement] = useState({ html: '', plainText: '', markdown: '' });
  const [activeTab, setActiveTab] = useState<'html' | 'markdown' | 'text'>('html');

  const handleGenerate = () => {
    if (!organizationName.trim() || !websiteUrl.trim() || !contactEmail.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setGenerating(true);
    try {
      const result = generateAccessibilityStatement({
        organizationName: organizationName.trim(),
        websiteUrl: websiteUrl.trim(),
        contactEmail: contactEmail.trim(),
        statementDate: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        auditDate: new Date().toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        conformanceLevel: 'AA',
        knownIssues: selectedIssues,
        methodology: [
          'Automated testing with axe-core',
          'AI-powered heuristic analysis with Gemini',
          'Manual accessibility review',
        ],
        technicalSpecs: ['HTML5', 'CSS3', 'JavaScript (ES6+)', 'WAI-ARIA 1.2'],
      });

      setStatement(result);
      setGenerated(true);
      toast.success('Accessibility statement generated successfully');
    } catch (error) {
      console.error('Generation error:', error);
      toast.error('Failed to generate statement');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = (format: 'html' | 'txt' | 'md') => {
    const content = format === 'html' ? statement.html : format === 'md' ? statement.markdown : statement.plainText;
    const today = new Date().toISOString().split('T')[0];
    const filename = `accessibility-statement-${today ?? 'unknown'}`;
    downloadStatement(content, filename, format);
    toast.success(`Statement downloaded as ${format.toUpperCase()}`);
  };

  const handleReset = () => {
    setGenerated(false);
    setStatement({ html: '', plainText: '', markdown: '' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-200 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generate Accessibility Statement
          </DialogTitle>
          <DialogDescription>
            Create a compliant accessibility statement from {selectedIssues.length} selected issue{selectedIssues.length !== 1 ? 's' : ''}
          </DialogDescription>
        </DialogHeader>

        {!generated ? (
          <>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="org-name">
                  Organization Name <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="org-name"
                  value={organizationName}
                  onChange={(e) => { setOrganizationName(e.target.value); }}
                  placeholder="e.g., Acme Corporation"
                  disabled={generating}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="website-url">
                  Website URL <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="website-url"
                  type="url"
                  value={websiteUrl}
                  onChange={(e) => { setWebsiteUrl(e.target.value); }}
                  placeholder="https://example.com"
                  disabled={generating}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact-email">
                  Contact Email <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="contact-email"
                  type="email"
                  value={contactEmail}
                  onChange={(e) => { setContactEmail(e.target.value); }}
                  placeholder="accessibility@example.com"
                  disabled={generating}
                />
              </div>

              <div className="p-4 bg-muted/50 rounded-md space-y-2">
                <p className="text-sm font-medium">Statement will include:</p>
                <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                  <li>• WCAG 2.2 conformance assessment</li>
                  <li>• {selectedIssues.length} known accessibility issue{selectedIssues.length !== 1 ? 's' : ''}</li>
                  <li>• Detailed remediation plans</li>
                  <li>• Contact and feedback information</li>
                  <li>• Compliance with EU accessibility directive</li>
                </ul>
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => { onOpenChange(false); }}
                disabled={generating}
              >
                Cancel
              </Button>
              <Button
                onClick={() => { handleGenerate(); }}
                disabled={generating || !organizationName.trim() || !websiteUrl.trim() || !contactEmail.trim()}
              >
                {generating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                <Eye className="mr-2 h-4 w-4" />
                Generate Statement
              </Button>
            </DialogFooter>
          </>
        ) : (
          <>
            <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v as typeof activeTab); }} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="html">HTML</TabsTrigger>
                <TabsTrigger value="markdown">Markdown</TabsTrigger>
                <TabsTrigger value="text">Plain Text</TabsTrigger>
              </TabsList>

              <TabsContent value="html" className="mt-4">
                <div className="border rounded-lg p-4 bg-muted/30 max-h-96 overflow-y-auto">
                  <div dangerouslySetInnerHTML={{ __html: statement.html }} />
                </div>
              </TabsContent>

              <TabsContent value="markdown" className="mt-4">
                <pre className="border rounded-lg p-4 bg-muted/30 max-h-96 overflow-y-auto text-xs whitespace-pre-wrap">
                  {statement.markdown}
                </pre>
              </TabsContent>

              <TabsContent value="text" className="mt-4">
                <pre className="border rounded-lg p-4 bg-muted/30 max-h-96 overflow-y-auto text-xs whitespace-pre-wrap">
                  {statement.plainText}
                </pre>
              </TabsContent>
            </Tabs>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                variant="outline"
                onClick={() => { handleReset(); }}
                className="w-full sm:w-auto"
              >
                Generate New
              </Button>
              <div className="flex gap-2 flex-1 justify-end">
                <Button
                  variant="outline"
                  onClick={() => { handleDownload('html'); }}
                >
                  <Download className="mr-2 h-4 w-4" />
                  HTML
                </Button>
                <Button
                  variant="outline"
                  onClick={() => { handleDownload('md'); }}
                >
                  <Download className="mr-2 h-4 w-4" />
                  MD
                </Button>
                <Button
                  onClick={() => { handleDownload('txt'); }}
                >
                  <Download className="mr-2 h-4 w-4" />
                  TXT
                </Button>
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
