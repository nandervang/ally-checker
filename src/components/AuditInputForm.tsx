import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Globe, Code, Upload, AlertCircle } from "lucide-react";

type InputMode = "url" | "html" | "snippet";

interface ValidationError {
  field: string;
  message: string;
}

export function AuditInputForm() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<InputMode>("url");
  const [url, setUrl] = useState("");
  const [snippet, setSnippet] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [isValidating, setIsValidating] = useState(false);

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
      setErrors([{ field: "file", message: "Please upload an HTML file (.html)" }]);
      return false;
    }

    if (uploadedFile.size > maxSize) {
      setErrors([{ field: "file", message: "File size must be less than 10MB" }]);
      return false;
    }

    return true;
  };

  const handleUrlBlur = () => {
    setErrors([]);
    if (url && !validateUrl(url)) {
      setErrors([{ field: "url", message: "Please enter a valid URL (must start with http:// or https://)" }]);
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsValidating(true);
    setErrors([]);

    // Validation logic based on mode
    if (mode === "url") {
      if (!url) {
        setErrors([{ field: "url", message: "URL is required" }]);
        setIsValidating(false);
        return;
      }
      if (!validateUrl(url)) {
        setErrors([{ field: "url", message: "Please enter a valid URL" }]);
        setIsValidating(false);
        return;
      }
    } else if (mode === "html") {
      if (!file) {
        setErrors([{ field: "file", message: "Please select an HTML file" }]);
        setIsValidating(false);
        return;
      }
    } else if (mode === "snippet") {
      if (!snippet.trim()) {
        setErrors([{ field: "snippet", message: "HTML snippet is required" }]);
        setIsValidating(false);
        return;
      }
    }

    // TODO: Trigger actual audit
    console.log("Submitting audit:", { mode, url, file, snippet });
    
    setTimeout(() => {
      setIsValidating(false);
    }, 1000);
  };

  const getFieldError = (field: string) => errors.find((e) => e.field === field);

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Tabs value={mode} onValueChange={(value) => setMode(value as InputMode)} className="w-full">
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

        <form onSubmit={handleSubmit} className="mt-6">
          {/* URL Input */}
          <TabsContent value="url" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="url-input" className="text-base md:text-lg">
                Website URL
              </Label>
              <Input
                id="url-input"
                type="url"
                placeholder="https://example.com"
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
                HTML File (max 10MB)
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
                  ✓ {file.name} ({(file.size / 1024).toFixed(1)} KB)
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
                HTML Code Snippet
              </Label>
              <Textarea
                id="snippet-input"
                placeholder="<div>Your HTML code here...</div>"
                value={snippet}
                onChange={(e) => {
                  setSnippet(e.target.value);
                  setErrors([]);
                }}
                aria-invalid={!!getFieldError("snippet")}
                aria-describedby={getFieldError("snippet") ? "snippet-error" : undefined}
                className="min-h-[200px] font-mono text-base md:text-lg focus-ring"
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
            disabled={isValidating}
            className="w-full mt-6 text-lg md:text-xl h-auto py-4 focus-ring shadow-elevation-2 hover:shadow-elevation-3"
          >
            {isValidating ? "Analyzing..." : "Analyze Accessibility"}
          </Button>
        </form>
      </Tabs>
    </div>
  );
}
