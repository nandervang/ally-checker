import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Moon, Sun } from "lucide-react";

export function Header() {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-elevation-1">
      {/* Skip to main content link - visible on focus for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[60] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus-ring"
      >
        {t("nav.skipToMain")}
      </a>

      <div className="flex h-16 items-center px-6 gap-6">
        <h1 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold">
          {t("app.title")}
        </h1>

        <div className="flex-1" />

        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            setTheme(theme === "dark" ? "light" : "dark");
          }}
          className="focus-ring"
          aria-label={t("nav.toggleTheme")}
        >
          {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>

        {/* Language Switcher */}
        <LanguageSwitcher />
      </div>
    </header>
  );
}
