import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Globe, Code, Upload, AlertCircle, FileText, Brain, Zap } from "lucide-react";
import { LoadingSpinner } from "./LoadingSpinner";
import { ErrorDisplay } from "./ErrorDisplay";
import { ProgressIndicator } from "./ProgressIndicator";
import { runAxeAnalysisOnUrl, runAxeAnalysisOnSnippet, runAxeAnalysis } from "@/services/axeService";
import { 
  mockPdfAuditResult, 
  mockDocxAuditResult,
  type AuditResult 
} from "@/data/mockAuditResults";
import { runAudit, getAudit, getAuditIssues, type AuditInput, type AuditProgress, type Issue } from "@/lib/audit";
import { useAuth } from "@/contexts/AuthContext";

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
  const [mode, setMode] = useState<InputMode>("url");
  const [url, setUrl] = useState("");
  const [snippet, setSnippet] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [auditStep, setAuditStep] = useState<AuditStep>("idle");
  const [auditError, setAuditError] = useState<string | null>(null);
  const [agentMode, setAgentMode] = useState<boolean>(true); // Default to AI mode
  const [selectedModel, setSelectedModel] = useState<"claude" | "gemini" | "gpt4">("gemini"); // Use Gemini (implemented)
  const [progressMessage, setProgressMessage] = useState<string>("");

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
        if (agentMode) {
          // Prepare input for audit service
          let inputType: "url" | "html" | "snippet" = "html";
          let inputValue = "";
          
          if (mode === "url") {
            inputType = "url";
            inputValue = url;
          } else if (mode === "html" && file) {
            inputType = "html";
            inputValue = await file.text();
          } else if (mode === "snippet") {
            inputType = "snippet";
            inputValue = snippet;
          } else if (mode === "document") {
            throw new Error("AI Agent mode not yet supported for PDF/DOCX");
          } else {
            throw new Error("Invalid audit mode or missing input");
          }

          const auditInput: AuditInput = {
            input_type: inputType,
            input_value: inputValue,
            user_id: user.id,
          };

          // Progress callback
          const onProgress = (progress: AuditProgress) => {
            setProgressMessage(progress.message);
            
            switch (progress.status) {
              case "queued":
                setAuditStep("idle");
                break;
              case "analyzing":
                setAuditStep("analyzing");
                break;
              case "complete":
                setAuditStep("generating");
                break;
              case "failed":
                setAuditStep("idle");
                break;
            }
          };

          setAuditStep("fetching");
          // Run audit and get ID
          const auditId = await runAudit(auditInput, onProgress);

          setAuditStep("generating");
          
          // Fetch complete audit with issues
          const audit = await getAudit(auditId);
          const issues = (await getAuditIssues(auditId)) as Issue[];

          if (!audit) {
            throw new Error("Failed to retrieve audit results");
          }

          // Convert to AuditResult format (using mock type for now)
          const result: AuditResult = {
            url: audit.input_type === 'url' ? audit.input_value : undefined,
            fileName: audit.input_type === 'snippet' ? 'HTML Snippet' : audit.input_type === 'html' ? 'HTML Document' : undefined,
            documentType: audit.input_type === 'url' ? 'html' : audit.input_type as 'html' | 'snippet',
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
              description: issue.description || "",
              element: issue.element_html || "",
              selector: issue.element_selector || "",
              impact: issue.description || "",
              remediation: issue.how_to_fix || "",
              helpUrl: issue.wcag_url || `https://www.w3.org/WAI/WCAG22/Understanding/`,
              occurrences: 1,
            })),
          };

          setAuditStep("complete");
          onAuditComplete?.(result);
          
          setTimeout(() => {
            setAuditStep("idle");
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
          setAuditError(
            error instanceof Error 
              ? error.message 
              : t("error.network")
          );
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
          />
        </div>
      )}

      {/* Agent Mode Toggle */}
      <div className="bg-card border rounded-lg p-6 shadow-elevation-2">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {agentMode ? (
              <Brain className="h-6 w-6 text-primary" />
            ) : (
              <Zap className="h-6 w-6 text-muted-foreground" />
            )}
            <div>
              <h3 className="text-lg font-semibold">
                {agentMode ? "AI Agent Mode" : "Quick Mode"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {agentMode 
                  ? "AI-powered comprehensive analysis with heuristics" 
                  : "Instant automated testing with axe-core"}
              </p>
            </div>
          </div>
          <Switch
            checked={agentMode}
            onCheckedChange={setAgentMode}
            aria-label="Toggle AI Agent Mode"
          />
        </div>

        {agentMode && (
          <div className="mt-4 pt-4 border-t">
            <Label htmlFor="model-select" className="text-sm font-medium mb-2 block">
              AI Model
            </Label>
            <Select value={selectedModel} onValueChange={(value) => { setSelectedModel(value as typeof selectedModel); }}>
              <SelectTrigger id="model-select" className="w-full">
                <SelectValue placeholder="Select AI model" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="claude">Claude (Anthropic) - Recommended</SelectItem>
                <SelectItem value="gemini">Gemini (Google)</SelectItem>
                <SelectItem value="gpt4">GPT-4 (OpenAI)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground mt-2">
              {selectedModel === "claude" && "Best for accessibility analysis with MCP tools"}
              {selectedModel === "gemini" && "Fast analysis with multimodal capabilities"}
              {selectedModel === "gpt4" && "Reliable and comprehensive evaluation"}
            </p>
          </div>
        )}
      </div>

      <Tabs value={mode} onValueChange={(value) => { setMode(value as InputMode); }} className="w-full">`
        <TabsList className="grid w-full grid-cols-4 h-auto">
          <TabsTrigger value="url" className="gap-2 text-base md:text-lg h-auto py-3 focus-ring">
            <Globe className="h-5 w-5" />
            URL
          </TabsTrigger>
          <TabsTrigger value="html" className="gap-2 text-base md:text-lg h-auto py-3 focus-ring">
            <Upload className="h-5 w-5" />
            HTML
          </TabsTrigger>
          <TabsTrigger value="document" className="gap-2 text-base md:text-lg h-auto py-3 focus-ring">
            <FileText className="h-5 w-5" />
            Document
          </TabsTrigger>
          <TabsTrigger value="snippet" className="gap-2 text-base md:text-lg h-auto py-3 focus-ring">
            <Code className="h-5 w-5" />
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
                  <AlertCircle className="h-4 w-4" />
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
                <p id="file-success" className="text-sm md:text-base text-green-600 dark:text-green-400" role="status">
                  ✓ {t("audit.fileSuccess", { name: file.name, size: (file.size / 1024).toFixed(1) })}
                </p>
              )}
              {getFieldError("file") && (
                <Alert variant="destructive" role="alert" aria-live="polite">
                  <AlertCircle className="h-4 w-4" />
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
                <p id="document-success" className="text-sm md:text-base text-green-600 dark:text-green-400" role="status">
                  ✓ {t("audit.fileSuccess", { name: file.name, size: (file.size / 1024).toFixed(1) })}
                  {file.name.endsWith(".pdf") ? " (PDF)" : " (DOCX)"}
                </p>
              )}
              {getFieldError("document") && (
                <Alert variant="destructive" role="alert" aria-live="polite">
                  <AlertCircle className="h-4 w-4" />
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
                  <AlertCircle className="h-4 w-4" />
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
