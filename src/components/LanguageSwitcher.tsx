import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Languages } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function LanguageSwitcher() {
  const { i18n, t } = useTranslation();

  const languages = [
    { code: "sv-SE", name: t("language.swedish") },
    { code: "en-US", name: t("language.english") },
  ];

  const currentLanguage = languages.find((lang) => lang.code === i18n.language);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="focus-ring">
          <Languages className="h-5 w-5" />
          <span className="sr-only">{t("language.switch")}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => {
              i18n.changeLanguage(language.code);
            }}
            className={`focus-ring ${
              language.code === i18n.language ? "bg-accent" : ""
            }`}
          >
            {language.name}
            {language.code === i18n.language && " ✓"}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
