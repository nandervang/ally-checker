import { useTranslation } from "react-i18next";

export function Footer() {
  const { t } = useTranslation();

  return (
    <footer
      className="w-full border-t bg-muted/30 py-6 px-6"
      role="contentinfo"
      aria-label="Site footer"
    >
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm md:text-base text-muted-foreground">
        <p>
          © {new Date().getFullYear()} {t("app.title")}
        </p>
        
        <nav aria-label="Footer navigation" className="flex gap-6">
          <a
            href="/accessibility-statement"
            className="hover:text-foreground transition-colors focus-ring rounded px-2 py-1"
          >
            Accessibility Statement
          </a>
          <a
            href="/privacy"
            className="hover:text-foreground transition-colors focus-ring rounded px-2 py-1"
          >
            Privacy Policy
          </a>
          <a
            href="/contact"
            className="hover:text-foreground transition-colors focus-ring rounded px-2 py-1"
          >
            Contact
          </a>
        </nav>
      </div>
    </footer>
  );
}
