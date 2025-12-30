import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Globe, Code, Upload, AlertCircle } from "lucide-react";
import { LoadingSpinner } from "./LoadingSpinner";
import { ErrorDisplay } from "./ErrorDisplay";
import { ProgressIndicator } from "./ProgressIndicator";

type InputMode = "url" | "html" | "snippet";

interface ValidationError {
  field: string;
  message: string;
}

type AuditStep = "idle" | "fetching" | "analyzing" | "generating" | "complete";

export function AuditInputForm() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<InputMode>("url");
  const [url, setUrl] = useState("");
  const [snippet, setSnippet] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [auditStep, setAuditStep] = useState<AuditStep>("idle");
  const [auditError, setAuditError] = useState<string | null>(null);

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

  const handleUrlBlur = () => {
    setErrors([]);
    if (url && !validateUrl(url)) {
      setErrors([{ field: "url", message: t("audit.validation.urlInvalid") }]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (validateFile(selectedFile)) {
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
    } else {
      // mode === "snippet"
      if (!snippet.trim()) {
        setErrors([{ field: "snippet", message: t("audit.validation.snippetRequired") }]);
        return;
      }
    }

    // Execute audit with retry logic
    await performAudit();
  };

  const performAudit = async () => {
    const maxRetries = 3;
    let attempt = 0;

    while (attempt < maxRetries) {
      try {
        setAuditStep("fetching");
        // TODO: Replace with actual API call
        await new Promise((resolve) => setTimeout(resolve, 1000));

        setAuditStep("analyzing");
        await new Promise((resolve) => setTimeout(resolve, 1500));

        setAuditStep("generating");
        await new Promise((resolve) => setTimeout(resolve, 1000));

        setAuditStep("complete");
        
        // TODO: Handle successful audit result
        console.log("Audit complete:", { mode, url, file, snippet });
        
        // Reset after 2 seconds
        setTimeout(() => {
          setAuditStep("idle");
        }, 2000);
        
        return;
      } catch {
        attempt++;

        if (attempt >= maxRetries) {
          setAuditError(t("error.network"));
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
          <LoadingSpinner message={getStepLabel()} />
          <ProgressIndicator
            currentStep={getStepNumber()}
            totalSteps={3}
            stepLabel={getStepLabel()}
          />
        </div>
      )}
      <Tabs value={mode} onValueChange={(value) => { setMode(value as InputMode); }} className="w-full">
        <TabsList className="grid w-full grid-cols-3 h-auto">
          <TabsTrigger value="url" className="gap-2 text-base md:text-lg h-auto py-3 focus-ring">
            <Globe className="h-5 w-5" />
            URL
          </TabsTrigger>
          <TabsTrigger value="html" className="gap-2 text-base md:text-lg h-auto py-3 focus-ring">
            <Upload className="h-5 w-5" />
            Upload HTML
          </TabsTrigger>
          <TabsTrigger value="snippet" className="gap-2 text-base md:text-lg h-auto py-3 focus-ring">
            <Code className="h-5 w-5" />
            HTML Snippet
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
