import { Icon } from "@/lib/icons";
import { useIconLibrary } from "@/contexts/IconLibraryContext";
import { useTranslation } from "react-i18next";

interface LoadingSpinnerProps {
  message?: string;
  size?: "sm" | "md" | "lg";
}

export function LoadingSpinner({ message, size = "md" }: LoadingSpinnerProps) {
  const { t } = useTranslation();
  const { iconLibrary } = useIconLibrary();

  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4 p-8" role="status" aria-live="polite">
      <Icon name="loader" library={iconLibrary} className={`${sizeClasses[size]} animate-spin text-primary`} aria-hidden="true" />
      <p className="text-base md:text-lg text-muted-foreground">
        {message || t("loading.default", "Loading...")}
      </p>
      <span className="sr-only">{message || "Loading"}</span>
    </div>
  );
}
