import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, Copy, Eye, Check } from 'lucide-react';
import type { StatementData } from '@/lib/statement/types';
import { getRecommendedTemplate, generateFilename, htmlToPlainText, sanitizeHtml } from '@/lib/statement';

interface StatementExportProps {
  statementData: StatementData;
  onExport?: (format: 'html' | 'snippet' | 'text', filename: string) => void;
}

export function StatementExport({ statementData, onExport }: StatementExportProps) {
  const { t, i18n } = useTranslation();
  const [filename, setFilename] = useState(
    generateFilename(statementData.metadata.organizationName, statementData.metadata.statementDate)
  );
  const [previewOpen, setPreviewOpen] = useState(false);
  const [copied, setCopied] = useState<'snippet' | 'text' | null>(null);
  const [activeTab, setActiveTab] = useState<'html' | 'snippet' | 'text'>('html');
  
  // Generate statement HTML based on locale
  const isSwedish = i18n.language.startsWith('sv') || statementData.metadata.locale === 'sv-SE';
  const isPublicSector = true; // Could be determined from organization type
  const template = getRecommendedTemplate(isSwedish ? 'sv-SE' : 'en-US', isPublicSector);
  const statementHtml = template.generate(statementData);
  
  // Generate standalone HTML with full document structure
  const generateStandaloneHtml = (): string => {
    const lang = statementData.metadata.locale;
    const title = isSwedish 
      ? `Tillgänglighetsredogörelse - ${statementData.metadata.organizationName}`
      : `Accessibility Statement - ${statementData.metadata.organizationName}`;
    
    return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <meta name="description" content="${isSwedish ? 'Tillgänglighetsredogörelse för' : 'Accessibility statement for'} ${statementData.metadata.websiteUrl}">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem 1rem;
      background: #fff;
    }
    
    h1 {
      font-size: 2.5rem;
      margin-bottom: 1rem;
      color: #1a1a1a;
      border-bottom: 3px solid #0066cc;
      padding-bottom: 0.5rem;
    }
    
    h2 {
      font-size: 1.75rem;
      margin-top: 2rem;
      margin-bottom: 1rem;
      color: #2c2c2c;
    }
    
    h3 {
      font-size: 1.25rem;
      margin-top: 1.5rem;
      margin-bottom: 0.75rem;
      color: #4a4a4a;
    }
    
    p {
      margin-bottom: 1rem;
    }
    
    a {
      color: #0066cc;
      text-decoration: underline;
    }
    
    a:hover {
      color: #0052a3;
    }
    
    a:focus {
      outline: 2px solid #0066cc;
      outline-offset: 2px;
    }
    
    ul, ol {
      margin-left: 2rem;
      margin-bottom: 1rem;
    }
    
    li {
      margin-bottom: 0.5rem;
    }
    
    strong {
      font-weight: 600;
    }
    
    em {
      font-style: italic;
      color: #666;
    }
    
    time {
      font-weight: 500;
    }
    
    @media (max-width: 640px) {
      body {
        padding: 1rem 0.5rem;
      }
      
      h1 {
        font-size: 2rem;
      }
      
      h2 {
        font-size: 1.5rem;
      }
    }
    
    @media print {
      body {
        max-width: none;
        padding: 0;
      }
      
      a {
        text-decoration: none;
      }
      
      a[href]:after {
        content: " (" attr(href) ")";
        font-size: 0.875rem;
        color: #666;
      }
    }
  </style>
</head>
<body>
  ${statementHtml}
</body>
</html>`;
  };
  
  // Generate embeddable snippet (just the article content)
  const generateSnippet = (): string => {
    return sanitizeHtml(statementHtml);
  };
  
  // Generate plain text version
  const generatePlainText = (): string => {
    const fullHtml = generateStandaloneHtml();
    const text = htmlToPlainText(fullHtml, 50000); // Large limit for full content
    
    // Add some formatting improvements
    return text
      .replace(/\n\s*\n\s*\n/g, '\n\n') // Normalize multiple line breaks
      .replace(/([.!?])\s+/g, '$1\n') // Add line break after sentences for readability
      .trim();
  };
  
  // Download functionality
  const handleDownload = (format: 'html' | 'snippet' | 'text') => {
    let content: string;
    let mimeType: string;
    let extension: string;
    let downloadFilename: string;
    
    switch (format) {
      case 'html':
        content = generateStandaloneHtml();
        mimeType = 'text/html';
        extension = '.html';
        downloadFilename = filename.endsWith('.html') ? filename : `${filename}.html`;
        break;
      case 'snippet':
        content = generateSnippet();
        mimeType = 'text/html';
        extension = '-snippet.html';
        downloadFilename = filename.replace(/\.html$/, '') + extension;
        break;
      case 'text':
        content = generatePlainText();
        mimeType = 'text/plain';
        extension = '.txt';
        downloadFilename = filename.replace(/\.html$/, '.txt');
        break;
    }
    
    // Create blob and download
    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = downloadFilename;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    // Call optional callback
    onExport?.(format, downloadFilename);
  };
  
  // Copy to clipboard functionality
  const handleCopy = async (format: 'snippet' | 'text') => {
    const content = format === 'snippet' ? generateSnippet() : generatePlainText();
    
    try {
      await navigator.clipboard.writeText(content);
      setCopied(format);
      setTimeout(() => setCopied(null), 3000);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      // Fallback: create temporary textarea
      const textarea = document.createElement('textarea');
      textarea.value = content;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(format);
      setTimeout(() => setCopied(null), 3000);
    }
  };
  
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{t('statement.export.title')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="filename">{t('statement.export.filename')}</Label>
            <Input
              id="filename"
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="accessibility-statement.html"
            />
          </div>
          
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="html">{t('statement.export.formats.html')}</TabsTrigger>
              <TabsTrigger value="snippet">{t('statement.export.formats.snippet')}</TabsTrigger>
              <TabsTrigger value="text">{t('statement.export.formats.text')}</TabsTrigger>
            </TabsList>
            
            <TabsContent value="html" className="space-y-4">
              <Alert>
                <AlertDescription>
                  {t('statement.export.descriptions.html')}
                </AlertDescription>
              </Alert>
              
              <div className="flex gap-2">
                <Button onClick={() => handleDownload('html')} className="flex-1">
                  <Download className="mr-2 h-4 w-4" aria-hidden="true" />
                  {t('statement.export.download')}
                </Button>
                <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Eye className="mr-2 h-4 w-4" aria-hidden="true" />
                      {t('statement.export.preview')}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{t('statement.export.previewTitle')}</DialogTitle>
                      <DialogDescription>
                        {t('statement.export.previewDescription')}
                      </DialogDescription>
                    </DialogHeader>
                    <div 
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ __html: sanitizeHtml(statementHtml) }}
                    />
                  </DialogContent>
                </Dialog>
              </div>
            </TabsContent>
            
            <TabsContent value="snippet" className="space-y-4">
              <Alert>
                <AlertDescription>
                  {t('statement.export.descriptions.snippet')}
                </AlertDescription>
              </Alert>
              
              <div className="flex gap-2">
                <Button onClick={() => handleDownload('snippet')} variant="outline" className="flex-1">
                  <Download className="mr-2 h-4 w-4" aria-hidden="true" />
                  {t('statement.export.download')}
                </Button>
                <Button 
                  onClick={() => handleCopy('snippet')}
                  variant={copied === 'snippet' ? 'default' : 'outline'}
                  className="flex-1"
                >
                  {copied === 'snippet' ? (
                    <>
                      <Check className="mr-2 h-4 w-4" aria-hidden="true" />
                      {t('statement.export.copied')}
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" aria-hidden="true" />
                      {t('statement.export.copy')}
                    </>
                  )}
                </Button>
              </div>
              
              <div className="space-y-2">
                <Label>{t('statement.export.snippetPreview')}</Label>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">
                  <code>{generateSnippet().substring(0, 500)}...</code>
                </pre>
              </div>
            </TabsContent>
            
            <TabsContent value="text" className="space-y-4">
              <Alert>
                <AlertDescription>
                  {t('statement.export.descriptions.text')}
                </AlertDescription>
              </Alert>
              
              <div className="flex gap-2">
                <Button onClick={() => handleDownload('text')} variant="outline" className="flex-1">
                  <Download className="mr-2 h-4 w-4" aria-hidden="true" />
                  {t('statement.export.download')}
                </Button>
                <Button 
                  onClick={() => handleCopy('text')}
                  variant={copied === 'text' ? 'default' : 'outline'}
                  className="flex-1"
                >
                  {copied === 'text' ? (
                    <>
                      <Check className="mr-2 h-4 w-4" aria-hidden="true" />
                      {t('statement.export.copied')}
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" aria-hidden="true" />
                      {t('statement.export.copy')}
                    </>
                  )}
                </Button>
              </div>
              
              <div className="space-y-2">
                <Label>{t('statement.export.textPreview')}</Label>
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm whitespace-pre-wrap">
                  {generatePlainText().substring(0, 800)}...
                </pre>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
