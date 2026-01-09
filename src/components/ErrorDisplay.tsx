import { useTranslation } from "react-i18next";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Icon } from "@/lib/icons";
import { useIconLibrary } from "@/contexts/IconLibraryContext";

interface ErrorDisplayProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}

export function ErrorDisplay({ title, message, onRetry, retryLabel }: ErrorDisplayProps) {
  const { t } = useTranslation();
  const { iconLibrary } = useIconLibrary();

  return (
    <Alert variant="destructive" role="alert" aria-live="assertive" className="shadow-elevation-2">
      <Icon name="alert" library={iconLibrary} className="h-5 w-5" />
      <AlertTitle className="text-lg md:text-xl font-semibold">
        {title || t("error.title", "Something went wrong")}
      </AlertTitle>
      <AlertDescription className="text-base md:text-lg mt-2">
        {message}
      </AlertDescription>
      {onRetry && (
        <Button
          variant="outline"
          size="sm"
          onClick={onRetry}
          className="mt-4 gap-2 focus-ring"
        >
          <Icon name="refresh" library={iconLibrary} className="h-4 w-4" />
          {retryLabel || t("error.retry", "Try Again")}
        </Button>
      )}
    </Alert>
  );
}
