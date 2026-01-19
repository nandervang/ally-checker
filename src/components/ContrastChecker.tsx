import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getContrastRatio, getWCAGRating } from "@/lib/contrast";
import { Icon } from "@/lib/icons";
import { useIconLibrary } from "@/contexts/IconLibraryContext";

interface ContrastCheckerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ContrastChecker({ open, onOpenChange }: ContrastCheckerProps) {
  const { t } = useTranslation();
  const { iconLibrary } = useIconLibrary();
  const [foreground, setForeground] = useState("#000000");
  const [background, setBackground] = useState("#FFFFFF");

  const ratio = getContrastRatio(foreground, background);
  const rating = getWCAGRating(ratio);
  const formattedRatio = ratio.toFixed(2);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon name="contrast" library={iconLibrary} className="h-5 w-5" />
            {t('contrastCheckerTool.title')}
          </DialogTitle>
          <DialogDescription>
            {t('contrastCheckerTool.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="foreground">{t('contrastCheckerTool.foreground')}</Label>
              <div className="flex gap-2">
                <div className="relative">
                  <div 
                    className="w-10 h-10 rounded border shadow-sm shrink-0 no-alpha-background" 
                    style={{ backgroundColor: foreground }}
                  />
                  <Input
                    type="color"
                    value={foreground}
                    onChange={(e) => { setForeground(e.target.value); }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer p-0 border-0"
                  />
                </div>
                <Input 
                  id="foreground" 
                  value={foreground} 
                  onChange={(e) => { setForeground(e.target.value); }}
                  placeholder="#000000"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="background">{t('contrastCheckerTool.background')}</Label>
              <div className="flex gap-2">
                <div className="relative">
                   <div 
                    className="w-10 h-10 rounded border shadow-sm shrink-0 no-alpha-background" 
                    style={{ backgroundColor: background }}
                  />
                   <Input
                    type="color"
                    value={background}
                    onChange={(e) => { setBackground(e.target.value); }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer p-0 border-0"
                  />
                </div>
                <Input 
                  id="background" 
                  value={background} 
                  onChange={(e) => { setBackground(e.target.value); }}
                  placeholder="#FFFFFF"
                />
              </div>
            </div>
          </div>

          <div className="p-6 rounded-lg border flex items-center justify-center text-center shadow-inner mt-2" 
               style={{ backgroundColor: background, color: foreground }}>
            <div>
              <p className="text-2xl font-bold">{t('contrastCheckerTool.preview.heading')}</p>
              <p className="text-sm mt-1">{t('contrastCheckerTool.preview.subheading')}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1 text-center p-3 bg-muted/50 rounded-lg">
               <div className="text-sm font-medium text-muted-foreground">{t('contrastCheckerTool.ratio')}</div>
               <div className="text-3xl font-bold">{formattedRatio}:1</div>
            </div>
            
            <div className="space-y-2">
               <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{t('contrastCheckerTool.normalText')}</span>
                  <Badge variant={rating.aa ? "default" : "destructive"}>
                     {rating.aa ? t('contrastCheckerTool.status.aaPass') : t('contrastCheckerTool.status.fail')}
                  </Badge>
               </div>
               <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{t('contrastCheckerTool.largeText')}</span>
                   <Badge variant={rating.aaLarge ? "default" : "destructive"}>
                     {rating.aaLarge ? t('contrastCheckerTool.status.aaPass') : t('contrastCheckerTool.status.fail')}
                  </Badge>
               </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{t('contrastCheckerTool.enhanced')}</span>
                   <Badge variant={rating.aaa ? "default" : "secondary"}>
                     {rating.aaa ? t('contrastCheckerTool.status.aaaPass') : (rating.aa ? t('contrastCheckerTool.status.aaOnly') : t('contrastCheckerTool.status.fail'))}
                  </Badge>
               </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
