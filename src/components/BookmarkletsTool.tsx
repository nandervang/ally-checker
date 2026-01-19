import { useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { useIconLibrary } from "@/contexts/IconLibraryContext";
import { Icon } from "@/lib/icons";
import { cn } from "@/lib/utils";

interface BookmarkletsToolProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// Special component to safely render javascript: hrefs without React blocking them
function DraggableBookmarklet({ code, label, children }: { code: string; label: string; children: React.ReactNode }) {
  const linkRef = useRef<HTMLAnchorElement>(null);

  useEffect(() => {
    if (linkRef.current) {
      linkRef.current.href = code;
    }
  }, [code]);

  return (
    <a
      ref={linkRef}
      className={cn(
        buttonVariants({ variant: "secondary" }),
        "cursor-grab active:cursor-grabbing w-full justify-start h-auto py-3 border-2 border-dashed border-primary/20 hover:border-primary/50"
      )}
      title={label}
      // Removed onClick preventDefault to allow clicking to test on the current page
    >
      {children}
    </a>
  );
}

export function BookmarkletsTool({ open, onOpenChange }: BookmarkletsToolProps) {
  const { t } = useTranslation();
  const { iconLibrary } = useIconLibrary();
  
  const INJECTED_STYLE_ID = 'a11y-injected-styles';

  const resetStyles = () => {
    const existingStyles = document.querySelectorAll(`#${INJECTED_STYLE_ID}`);
    existingStyles.forEach(el => { el.remove(); });
  };

  // Text Spacing Bookmarklet (WCAG 1.4.12)
  const textSpacingCode = `javascript:(function(){var id='${INJECTED_STYLE_ID}';var old=document.getElementById(id);if(old)old.remove();var style=document.createElement('style');style.id=id;style.innerHTML='*{line-height:1.5 !important;letter-spacing:0.12em !important;word-spacing:0.16em !important;} p{margin-bottom:2em !important;}';document.head.appendChild(style);})();`;

  // Line Height Only (WCAG 1.4.12 subset)
  const lineHeightCode = `javascript:(function(){var id='${INJECTED_STYLE_ID}';var old=document.getElementById(id);if(old)old.remove();var style=document.createElement('style');style.id=id;style.innerHTML='*{line-height:1.5 !important;}';document.head.appendChild(style);})();`;

  // Letter Spacing Only (WCAG 1.4.12 subset)
  const letterSpacingCode = `javascript:(function(){var id='${INJECTED_STYLE_ID}';var old=document.getElementById(id);if(old)old.remove();var style=document.createElement('style');style.id=id;style.innerHTML='*{letter-spacing:0.12em !important;word-spacing:0.16em !important;}';document.head.appendChild(style);})();`;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Icon name="bookmark" library={iconLibrary} className="h-5 w-5" />
            {t('bookmarklets.title')}
          </SheetTitle>
          <SheetDescription>
            {t('bookmarklets.description')}
          </SheetDescription>
        </SheetHeader>

        <div className="py-6 space-y-6">
          <div className="p-4 bg-muted rounded-lg border text-sm space-y-2">
            <h4 className="font-semibold flex items-center gap-2">
              <Icon name="info" library={iconLibrary} className="h-4 w-4" />
              {t('bookmarklets.howToUse')}
            </h4>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li><strong>{t('bookmarklets.installInstruction')}</strong> {t('bookmarklets.installStep')}</li>
              <li><strong>{t('bookmarklets.testInstruction')}</strong> {t('bookmarklets.testStep')}</li>
            </ul>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-lg font-medium">{t('bookmarklets.textSpacing.title')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('bookmarklets.textSpacing.description')}
              </p>
              <div className="pt-1">
                <DraggableBookmarklet code={textSpacingCode} label={t('bookmarklets.textSpacing.label')}>
                   <Icon name="move" library={iconLibrary} className="mr-2 h-4 w-4 text-muted-foreground" />
                   {t('bookmarklets.textSpacing.button')}
                </DraggableBookmarklet>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-medium">{t('bookmarklets.lineHeight.title')}</h3>
              <p className="text-sm text-muted-foreground">
                {t('bookmarklets.lineHeight.description')}
              </p>
              <div className="pt-1">
                <DraggableBookmarklet code={lineHeightCode} label={t('bookmarklets.lineHeight.label')}>
                   <Icon name="move" library={iconLibrary} className="mr-2 h-4 w-4 text-muted-foreground" />
                   {t('bookmarklets.lineHeight.button')}
                </DraggableBookmarklet>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-medium">{t('bookmarklets.letterSpacing.title')}</h3>
              <p className="text-sm text-muted-foreground">
                 {t('bookmarklets.letterSpacing.description')}
              </p>
              <div className="pt-1">
                <DraggableBookmarklet code={letterSpacingCode} label={t('bookmarklets.letterSpacing.label')}>
                   <Icon name="move" library={iconLibrary} className="mr-2 h-4 w-4 text-muted-foreground" />
                   {t('bookmarklets.letterSpacing.button')}
                </DraggableBookmarklet>
              </div>
            </div>

            {/* Test Area */}
            <div className="border-t pt-6 mt-6">
               <div className="flex items-center justify-between mb-4">
                 <h3 className="text-lg font-medium">{t('bookmarklets.preview.title')}</h3>
                 <Button variant="outline" size="sm" onClick={resetStyles}>
                   <Icon name="refresh" library={iconLibrary} className="mr-2 h-3 w-3" />
                   {t('bookmarklets.preview.reset')}
                 </Button>
               </div>
               <div className="p-4 rounded-lg bg-card border shadow-sm space-y-4">
                  <div>
                     <h4 className="font-bold text-lg">{t('bookmarklets.preview.heading')}</h4>
                     <p className="text-muted-foreground text-sm">{t('bookmarklets.preview.subheading')}</p>
                  </div>
                  <p className="text-base my-4">
                    {t('bookmarklets.preview.paragraph1')}
                  </p>
                  <p className="text-base my-4">
                    {t('bookmarklets.preview.paragraph2')}
                  </p>
               </div>
               <p className="text-xs text-muted-foreground mt-2">
                  {t('bookmarklets.preview.footer')}
               </p>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
