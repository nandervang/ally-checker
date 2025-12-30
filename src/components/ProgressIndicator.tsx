import { Progress } from "@/components/ui/progress";
import { useTranslation } from "react-i18next";

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepLabel?: string;
  percentage?: number;
}

export function ProgressIndicator({ 
  currentStep, 
  totalSteps, 
  stepLabel,
  percentage 
}: ProgressIndicatorProps) {
  const { t } = useTranslation();
  const calculatedPercentage = percentage ?? Math.round((currentStep / totalSteps) * 100);

  return (
    <div className="w-full space-y-3" role="status" aria-live="polite">
      <div className="flex justify-between items-center text-sm md:text-base text-muted-foreground">
        <span>
          {stepLabel || t("progress.step", "Step {{current}} of {{total}}", { 
            current: currentStep, 
            total: totalSteps 
          })}
        </span>
        <span className="font-semibold">{calculatedPercentage}%</span>
      </div>
      <Progress 
        value={calculatedPercentage} 
        className="h-2 md:h-3"
        aria-label={`Progress: ${calculatedPercentage}%`}
      />
      <span className="sr-only">
        {t("progress.srOnly", "Progress: {{percentage}} percent complete", { 
          percentage: calculatedPercentage 
        })}
      </span>
    </div>
  );
}
