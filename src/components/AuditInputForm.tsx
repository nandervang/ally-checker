import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Icon } from "@/lib/icons";
import { useIconLibrary } from "@/contexts/IconLibraryContext";
import { LoadingSpinner } from "./LoadingSpinner";
import { ErrorDisplay } from "./ErrorDisplay";
import { ProgressIndicator } from "./ProgressIndicator";
import { runAxeAnalysisOnUrl, runAxeAnalysisOnSnippet, runAxeAnalysis } from "@/services/axeService";
import { 
  mockPdfAuditResult, 
  mockDocxAuditResult,
  type AuditResult 
} from "@/data/mockAuditResults";
import { 
  runAudit, 
  getAudit, 
  getAuditIssues, 
  uploadDocumentForAudit,
  type AuditInput, 
  type AuditProgress, 
  type Issue 
} from "@/lib/audit";
import { useAuth } from "@/contexts/AuthContext";
import { getUserSettings, type UserSettings } from "@/services/settingsService";

type InputMode = "url" | "html" | "snippet" | "document";

interface ValidationError {
  field: string;
  message: string;
}

type AuditStep = "idle" | "fetching" | "analyzing" | "generating" | "complete";

interface AuditInputFormProps {
  onAuditComplete?: (result: AuditResult) => void;
}

export function AuditInputForm({ onAuditComplete }: AuditInputFormProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { iconLibrary } = useIconLibrary();
  const [mode, setMode] = useState<InputMode>("url");
  const [url, setUrl] = useState("");
  const [snippet, setSnippet] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [auditStep, setAuditStep] = useState<AuditStep>("idle");
  const [auditError, setAuditError] = useState<string | null>(null);
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [progressMessage, setProgressMessage] = useState<string>("");
  const [progressPercent, setProgressPercent] = useState<number>(0);

  // Load settings on mount
  useEffect(() => {
    void getUserSettings().then(setSettings);
  }, []);

  const validateUrl = (value: string): boolean => {
    try {
      const urlObj = new URL(value);
      return urlObj.protocol === "http:" || urlObj.protocol === "https:";
    } catch {
      return false;
    }
  };

  const validateFile = (uploadedFile: File): boolean => {
    const validTypes = ["text/html", "application/xhtml+xml"];
    const maxSize = 10 * 1024 * 1024; // 10MB

    if (!validTypes.includes(uploadedFile.type) && !uploadedFile.name.endsWith(".html")) {
      setErrors([{ field: "file", message: t("audit.validation.fileInvalidType") }]);
      return false;
    }

    if (uploadedFile.size > maxSize) {
      setErrors([{ field: "file", message: t("audit.validation.fileTooLarge") }]);
      return false;
    }

    return true;
  };
  const validateDocument = (uploadedFile: File): boolean => {
    const validTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    const maxSize = 25 * 1024 * 1024; // 25MB for documents

    if (!validTypes.includes(uploadedFile.type) && 
        !uploadedFile.name.endsWith(".pdf") && 
        !uploadedFile.name.endsWith(".docx")) {
      setErrors([{ field: "document", message: t("audit.validation.documentInvalidType") }]);
      return false;
    }

    if (uploadedFile.size > maxSize) {
      setErrors([{ field: "document", message: t("audit.validation.documentTooLarge") }]);
      return false;
    }

    return true;
  };
  const handleUrlBlur = () => {
    setErrors([]);
    if (url && !validateUrl(url)) {
      setErrors([{ field: "url", message: t("audit.validation.urlInvalid") }]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const isValid = mode === "document" 
        ? validateDocument(selectedFile) 
        : validateFile(selectedFile);
      
      if (isValid) {
        setFile(selectedFile);
        setErrors([]);
      } else {
        setFile(null);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);
    setAuditError(null);

    // Validation logic based on mode
    if (mode === "url") {
      if (!url) {
        setErrors([{ field: "url", message: t("audit.validation.urlRequired") }]);
        return;
      }
      if (!validateUrl(url)) {
        setErrors([{ field: "url", message: t("audit.validation.urlInvalid") }]);
        return;
      }
    } else if (mode === "html") {
      if (!file) {
        setErrors([{ field: "file", message: t("audit.validation.fileRequired") }]);
        return;
      }
    } else if (mode === "snippet") {
      if (!snippet.trim()) {
        setErrors([{ field: "snippet", message: t("audit.validation.snippetRequired") }]);
        return;
      }
    } else {
      // mode === "document"
      if (!file) {
        setErrors([{ field: "document", message: t("audit.validation.documentRequired") }]);
        return;
      }
    }

    // Execute audit with retry logic
    await performAudit();
  };

  const performAudit = async () => {
    if (!user) {
      setAuditError("You must be logged in to run audits");
      return;
    }

    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        // Use new audit service
        if (settings?.agentMode) {
          // Set initial loading state
          setAuditStep("fetching");
          setProgressMessage("🔧 Initializing AI accessibility audit...");
          
          // Prepare input for audit service
          let inputType: "url" | "html" | "snippet" | "document" = "html";
          let inputValue = "";
          let documentPath: string | undefined = undefined;
          let documentType: "pdf" | "docx" | undefined = undefined;
          
          if (mode === "url") {
            inputType = "url";
            inputValue = url;
            setProgressMessage("🌐 Fetching web page content and resources...");
          } else if (mode === "html" && file) {
            inputType = "html";
            setProgressMessage("📄 Reading HTML file content...");
            inputValue = await file.text();
            setProgressMessage("✅ HTML loaded, preparing for AI analysis...");
          } else if (mode === "snippet") {
            inputType = "snippet";
            inputValue = snippet;
            setProgressMessage("🔍 Preparing code snippet for analysis...");
          } else if (mode === "document" && file) {
            inputType = "document";
            
            // Upload document to Supabase Storage
            setProgressMessage(`📤 Uploading ${file.name} (${(file.size / 1024 / 1024).toFixed(1)}MB) to secure storage...`);
            const uploadResult = await uploadDocumentForAudit(file, user.id);
            
            documentPath = uploadResult.documentPath;
            documentType = uploadResult.documentType;
            inputValue = file.name;
            
            setProgressMessage("✅ Document uploaded, initializing accessibility checker...");
            setAuditStep("analyzing");
            setProgressMessage(`🔬 AI agent inspecting ${documentType?.toUpperCase()} structure and metadata...`);
          } else {
            throw new Error("Invalid audit mode or missing input");
          }

          const auditInput: AuditInput = {
            input_type: inputType,
            input_value: inputValue,
            user_id: user.id,
            document_path: documentPath,
            document_type: documentType,
            reportTemplate: settings?.defaultReportTemplate,
          };

          // Progress callback
          const onProgress = (progress: AuditProgress) => {
            if (progress.message) setProgressMessage(progress.message);
            if (progress.progress !== undefined) setProgressPercent(progress.progress);
            
            switch (progress.status) {
              case "queued":
              case "pending": // Handle both legacy and new status
                if (!progress.message) setProgressMessage("⏳ Audit queued, waiting for worker...");
                setAuditStep("analyzing");
                break;
              case "analyzing":
                // If message isn't provided by backend, provide default
                if (!progress.message) {
                    if (inputType === "url") {
                    setProgressMessage("🤖 AI agent analyzing page structure, semantics, and ARIA patterns...");
                    } else {
                    setProgressMessage("🤖 AI agent checking WCAG 2.2 compliance...");
                    }
                }
                setAuditStep("analyzing");
                break;
              case "complete":
              case "completed": // Handle both variations
                setProgressMessage("✨ Analysis complete, compiling report...");
                setAuditStep("generating");
                // Force 100%
                setProgressPercent(100);
                break;
              case "failed":
                setAuditStep("idle");
                break;
            }
          };

          // Run audit and get ID, passing preferred model from settings
          let auditId: string;
          let auditResponseData: any = null;
          
          try {
            auditId = await runAudit(auditInput, onProgress, settings?.preferredModel);
          } catch (error: any) {
            // Check if this is an AUDIT_NOT_SAVED error with response data
            if (error.message === 'AUDIT_NOT_SAVED' && error.responseData) {
              console.warn('[Audit] Results not saved to database, using direct response');
              auditResponseData = error.responseData;
              
              // Convert API response to AuditResult format
              const apiResult = auditResponseData;
              const result: AuditResult = {
                auditId: null as any, // No audit ID since it wasn't saved
                url: inputType === 'url' ? inputValue : undefined,
                fileName: inputType === 'snippet' ? 'HTML Snippet' : inputType === 'html' ? 'HTML Document' : inputType === 'document' ? inputValue : undefined,
                documentType: inputType === 'document' ? (documentType || 'pdf') : 'html',
                timestamp: apiResult.summary?.timestamp || new Date().toISOString(),
                summary: {
                  totalIssues: apiResult.summary?.totalIssues || 0,
                  critical: apiResult.summary?.criticalCount || 0,
                  serious: apiResult.summary?.seriousCount || 0,
                  moderate: apiResult.summary?.moderateCount || 0,
                  minor: apiResult.summary?.minorCount || 0,
                  passed: apiResult.summary?.passCount || 0,
                  failed: apiResult.summary?.totalIssues || 0,
                },
                issues: (apiResult.issues || []).map((issue: any, idx: number) => ({
                  id: `issue-${idx}-${issue.wcag_criterion}`,
                  principle: issue.wcag_principle,
                  guideline: `${issue.wcag_criterion} ${issue.title}`,
                  wcagLevel: issue.wcag_level,
                  severity: issue.severity,
                  title: issue.title,
                  description: issue.description,
                  element: issue.element_html || issue.element_context || '',
                  selector: issue.element_selector || '',
                  impact: issue.user_impact || issue.severity,
                  remediation: issue.how_to_fix || '',
                  helpUrl: issue.wcag_url || `https://www.w3.org/WAI/WCAG22/Understanding/${issue.wcag_criterion?.replace(/\./g, '')}.html`,
                  occurrences: 1,
                  codeExample: issue.code_example,
                })),
                agent_trace: apiResult.auditMethodology ? {
                  steps: [],
                  tools_used: apiResult.mcpToolsUsed || [],
                  sources_consulted: apiResult.sourcesConsulted || [],
                  duration_ms: undefined,
                } : undefined,
              };

              setProgressMessage("🎉 Audit complete! (Results not saved to database - check environment configuration)");
              setAuditStep("complete");
              onAuditComplete?.(result);
              
              setTimeout(() => {
                setAuditStep("idle");
                setProgressMessage("");
              }, 3000);
              
              return;
            }
            // If it's a different error, re-throw it
            throw error;
          }

          setProgressMessage("📊 Retrieving audit results from database...");
          setAuditStep("generating");
          
          // Fetch complete audit with issues
          const audit = await getAudit(auditId);
          const issues = (await getAuditIssues(auditId)) as Issue[];

          if (!audit) {
            throw new Error("Failed to retrieve audit results");
          }

          // Convert to AuditResult format (using mock type for now)
          const result: AuditResult = {
            auditId: audit.id,
            url: audit.input_type === 'url' ? audit.input_value : undefined,
            fileName: audit.input_type === 'snippet' ? 'HTML Snippet' 
              : audit.input_type === 'html' ? 'HTML Document' 
              : audit.input_type === 'document' ? (audit.document_path?.split('/').pop() || 'Document') 
              : undefined,
            documentType: (audit.input_type === 'url' || audit.input_type === 'html' || audit.input_type === 'snippet') 
              ? 'html' 
              : (audit.document_type as any || 'pdf'),
            timestamp: audit.created_at,
            summary: {
              totalIssues: audit.total_issues || 0,
              critical: audit.critical_issues || 0,
              serious: audit.serious_issues || 0,
              moderate: audit.moderate_issues || 0,
              minor: audit.minor_issues || 0,
              passed: 0, // Not tracked yet
              failed: audit.total_issues || 0, // Same as total for now
            },
            issues: issues.map(issue => ({
              id: `issue-${issue.wcag_criterion}`,
              principle: issue.wcag_principle,
              guideline: `${issue.wcag_criterion} ${issue.title}`,
              wcagLevel: issue.wcag_level,
              severity: issue.severity,
              title: issue.title,
              description: issue.description,
              element: issue.element_html || '',
              selector: issue.element_selector || '',
              impact: issue.user_impact || issue.severity,
              remediation: issue.how_to_fix || '',
              helpUrl: issue.wcag_url || `https://www.w3.org/WAI/WCAG22/Understanding/${issue.wcag_criterion.replace(/\./g, '')}.html`,
              occurrences: 1,
              codeExample: issue.code_example,
            })),
            agent_trace: audit.agent_trace ? {
              steps: (audit.agent_trace as any).steps || [],
              tools_used: audit.tools_used || [],
              sources_consulted: audit.sources_consulted || (audit.agent_trace as any).sources_consulted || [],
              duration_ms: (audit.agent_trace as any).duration_ms,
              methodology: audit.audit_methodology as any,
            } : (audit.ai_model ? {
              // Fallback trace if agent ran but didn't populate trace
              steps: [
                {
                  timestamp: audit.created_at,
                  action: "ai_agent_analysis",
                  reasoning: `Analyzed ${audit.input_type} using ${audit.ai_model || 'AI agent'}`,
                  output: `Found ${audit.total_issues} accessibility issues across ${audit.perceivable_issues + audit.operable_issues + audit.understandable_issues + audit.robust_issues} WCAG principles`
                }
              ],
              tools_used: audit.tools_used || (audit.ai_model ? [audit.ai_model] : []),
              sources_consulted: ["WCAG 2.2 Guidelines", "axe-core analysis"],
              duration_ms: undefined
            } : undefined),
          };

          setProgressMessage("🎉 Audit complete! Displaying results...");
          setAuditStep("complete");
          onAuditComplete?.(result);
          
          setTimeout(() => {
            setAuditStep("idle");
            setProgressMessage("");
          }, 2000);
          
          return;
        }
        // Fallback to axe-core (quick mode)
        else {
          let result: AuditResult;
          
          if (mode === "url") {
            setAuditStep("fetching");
            result = await runAxeAnalysisOnUrl(url);
          } else if (mode === "html" && file) {
            setAuditStep("fetching");
            const htmlContent = await file.text();
            setAuditStep("analyzing");
            result = await runAxeAnalysis(htmlContent, { 
              fileName: file.name, 
              documentType: "html" 
            });
          } else if (mode === "snippet") {
            setAuditStep("analyzing");
            result = await runAxeAnalysisOnSnippet(snippet);
          } else if (mode === "document" && file) {
            setAuditStep("fetching");
            await new Promise((resolve) => setTimeout(resolve, 1000));
            setAuditStep("analyzing");
            await new Promise((resolve) => setTimeout(resolve, 1500));
            result = file.name.endsWith(".pdf") 
              ? { ...mockPdfAuditResult, fileName: file.name }
              : { ...mockDocxAuditResult, fileName: file.name };
          } else {
            throw new Error("Invalid audit mode or missing input");
          }

          setAuditStep("generating");
          await new Promise((resolve) => setTimeout(resolve, 500));

          setAuditStep("complete");
          onAuditComplete?.(result);
          
          setTimeout(() => {
            setAuditStep("idle");
          }, 2000);
          
          return;
        }
      } catch (error) {
        attempt++;

        if (attempt >= maxRetries) {
          // Enhanced error messaging for specific API errors
          let errorMessage = t("error.network");
          
          if (error instanceof Error) {
            const msg = error.message.toLowerCase();
            
            if (msg.includes('overloaded') || msg.includes('503')) {
              errorMessage = "The AI service is currently overloaded. This is a temporary issue with Google's API. Please try again in a few minutes.";
            } else if (msg.includes('rate limit') || msg.includes('quota')) {
              errorMessage = "Rate limit exceeded. Please wait a moment before trying again.";
            } else if (msg.includes('timeout')) {
              errorMessage = "Request timed out. The audit is taking longer than expected. Please try a smaller page or try again later.";
            } else {
              errorMessage = error.message;
            }
          }
          
          setAuditError(errorMessage);
          setAuditStep("idle");
          return;
        }

        // Exponential backoff: 1s, 2s, 4s
        const delay = Math.pow(2, attempt - 1) * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  };

  const handleRetry = () => {
    setAuditError(null);
    void performAudit();
  };

  const getFieldError = (field: string) => errors.find((e) => e.field === field);

  const getStepNumber = (): number => {
    switch (auditStep) {
      case "fetching": return 1;
      case "analyzing": return 2;
      case "generating": return 3;
      case "complete": return 3;
      default: return 0;
    }
  };

  const getStepLabel = (): string => {
    switch (auditStep) {
      case "fetching": return t("loading.fetching");
      case "analyzing": return t("loading.analyzing");
      case "generating": return t("loading.generating");
      default: return "";
    }
  };

  const isProcessing = auditStep !== "idle" && auditStep !== "complete";

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Show error if audit failed */}
      {auditError && (
        <ErrorDisplay
          title={t("error.title")}
          message={auditError}
          onRetry={handleRetry}
        />
      )}

      {/* Show progress if audit is running */}
      {isProcessing && (
        <div className="space-y-4">
          <LoadingSpinner message={progressMessage || getStepLabel()} />
          <ProgressIndicator
            currentStep={getStepNumber()}
            totalSteps={3}
            stepLabel={progressMessage || getStepLabel()}
            percentage={progressPercent > 0 ? progressPercent : undefined}
          />
        </div>
      )}

      <Tabs value={mode} onValueChange={(value) => { setMode(value as InputMode); }} className="w-full">
        <TabsList className="grid w-full grid-cols-4 h-auto">
          <TabsTrigger value="url" className="gap-2 text-base md:text-lg h-auto py-3 focus-ring">
            <Icon name="globe" library={iconLibrary} className="h-5 w-5" />
            URL
          </TabsTrigger>
          <TabsTrigger value="html" className="gap-2 text-base md:text-lg h-auto py-3 focus-ring">
            <Icon name="upload" library={iconLibrary} className="h-5 w-5" />
            HTML
          </TabsTrigger>
          <TabsTrigger value="document" className="gap-2 text-base md:text-lg h-auto py-3 focus-ring">
            <Icon name="file-text" library={iconLibrary} className="h-5 w-5" />
            Document
          </TabsTrigger>
          <TabsTrigger value="snippet" className="gap-2 text-base md:text-lg h-auto py-3 focus-ring">
            <Icon name="code" library={iconLibrary} className="h-5 w-5" />
            Snippet
          </TabsTrigger>
        </TabsList>

        <form onSubmit={(e) => { void handleSubmit(e); }} className="mt-6">
          {/* URL Input */}
          <TabsContent value="url" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="url-input" className="text-base md:text-lg">
                {t("audit.urlLabel")}
              </Label>
              <Input
                id="url-input"
                type="url"
                placeholder={t("audit.urlPlaceholder")}
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  setErrors([]);
                }}
                onBlur={handleUrlBlur}
                aria-invalid={!!getFieldError("url")}
                aria-describedby={getFieldError("url") ? "url-error" : undefined}
                className="text-base md:text-lg h-auto py-3 focus-ring"
              />
              {getFieldError("url") && (
                <Alert variant="destructive" role="alert" aria-live="polite">
                  <Icon name="alert-circle" library={iconLibrary} className="h-4 w-4" />
                  <AlertDescription id="url-error" className="text-base">
                    {getFieldError("url")?.message}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </TabsContent>

          {/* HTML File Upload */}
          <TabsContent value="html" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="file-input" className="text-base md:text-lg">
                {t("audit.fileLabel")}
              </Label>
              <Input
                id="file-input"
                type="file"
                accept=".html,text/html,application/xhtml+xml"
                onChange={handleFileChange}
                aria-invalid={!!getFieldError("file")}
                aria-describedby={getFieldError("file") ? "file-error" : file ? "file-success" : undefined}
                className="text-base md:text-lg h-auto py-3 focus-ring cursor-pointer"
              />
              {file && !getFieldError("file") && (
                <p id="file-success" className="text-sm md:text-base text-accent-foreground" role="status">
                  ✓ {t("audit.fileSuccess", { name: file.name, size: (file.size / 1024).toFixed(1) })}
                </p>
              )}
              {getFieldError("file") && (
                <Alert variant="destructive" role="alert" aria-live="polite">
                  <Icon name="alert-circle" library={iconLibrary} className="h-4 w-4" />
                  <AlertDescription id="file-error" className="text-base">
                    {getFieldError("file")?.message}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </TabsContent>

          {/* Document Upload (PDF/DOCX) */}
          <TabsContent value="document" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="document-input" className="text-base md:text-lg">
                {t("audit.documentLabel")}
              </Label>
              <Input
                id="document-input"
                type="file"
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={handleFileChange}
                aria-invalid={!!getFieldError("document")}
                aria-describedby={getFieldError("document") ? "document-error" : file ? "document-success" : undefined}
                className="text-base md:text-lg h-auto py-3 focus-ring cursor-pointer"
              />
              {file && mode === "document" && !getFieldError("document") && (
                <p id="document-success" className="text-sm md:text-base text-accent-foreground" role="status">
                  ✓ {t("audit.fileSuccess", { name: file.name, size: (file.size / 1024).toFixed(1) })}
                  {file.name.endsWith(".pdf") ? " (PDF)" : " (DOCX)"}
                </p>
              )}
              {getFieldError("document") && (
                <Alert variant="destructive" role="alert" aria-live="polite">
                  <Icon name="alert-circle" library={iconLibrary} className="h-4 w-4" />
                  <AlertDescription id="document-error" className="text-base">
                    {getFieldError("document")?.message}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </TabsContent>

          {/* HTML Snippet */}
          <TabsContent value="snippet" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="snippet-input" className="text-base md:text-lg">
                {t("audit.snippetLabel")}
              </Label>
              <Textarea
                id="snippet-input"
                placeholder={t("audit.snippetPlaceholder")}
                value={snippet}
                onChange={(e) => {
                  setSnippet(e.target.value);
                  setErrors([]);
                }}
                aria-invalid={!!getFieldError("snippet")}
                aria-describedby={getFieldError("snippet") ? "snippet-error" : undefined}
                className="min-h-50 font-mono text-base md:text-lg focus-ring"
                rows={10}
              />
              {getFieldError("snippet") && (
                <Alert variant="destructive" role="alert" aria-live="polite">
                  <Icon name="alert-circle" library={iconLibrary} className="h-4 w-4" />
                  <AlertDescription id="snippet-error" className="text-base">
                    {getFieldError("snippet")?.message}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </TabsContent>

          {/* Submit Button */}
          <Button
            type="submit"
            size="lg"
            disabled={isProcessing}
            className="w-full mt-6 text-lg md:text-xl h-auto py-4 focus-ring shadow-elevation-2 hover:shadow-elevation-3"
          >
            {isProcessing ? t("loading.analyzing") : t("audit.analyze")}
          </Button>
        </form>
      </Tabs>
    </div>
  );
}
