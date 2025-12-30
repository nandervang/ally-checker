import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useTheme } from "@/hooks/useTheme";
import { Moon, Sun, Settings, FileText, Database, ChevronRight, Menu } from "lucide-react";
import "./index.css";

export function App() {
  const { theme, setTheme } = useTheme();
  const [activePanel, setActivePanel] = useState<string | null>(null);

  const menuItems = [
    { id: "overview", label: "Overview", icon: FileText },
    { id: "components", label: "Components", icon: Database },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Navigation Bar - Full Width */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-elevation-1">
        <div className="flex h-16 items-center px-6 gap-6">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="focus-ring md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-80">
              <SheetHeader>
                <SheetTitle className="text-2xl">Navigation</SheetTitle>
                <SheetDescription className="text-base">Access all features</SheetDescription>
              </SheetHeader>
              <nav className="flex flex-col gap-2 mt-6">
                {menuItems.map((item) => (
                  <Button
                    key={item.id}
                    variant="ghost"
                    className="justify-start gap-3 focus-ring text-lg h-auto py-3"
                    onClick={() => setActivePanel(item.id)}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.label}
                  </Button>
                ))}
              </nav>
            </SheetContent>
          </Sheet>

          <h1 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold">Accessibility Checker</h1>
          
          <div className="flex-1" />
          
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="focus-ring"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>
      </header>

      {/* Main Content - Full Width */}
      <main className="flex-1 w-full">
        <div className="h-full w-full px-6 py-8">
          {/* Quick Actions Bar */}
          <div className="flex gap-3 mb-8 overflow-x-auto pb-2">
            {menuItems.map((item) => (
              <Button
                key={item.id}
                variant="outline"
                className="gap-2 whitespace-nowrap focus-ring shadow-elevation-1 hover:shadow-elevation-2 transition-all text-base md:text-lg lg:text-xl h-auto py-3 px-6"
                onClick={() => setActivePanel(item.id)}
              >
                <item.icon className="h-5 w-5 md:h-6 md:w-6" />
                {item.label}
                <ChevronRight className="h-4 w-4 md:h-5 md:w-5 ml-1" />
              </Button>
            ))}
          </div>

          {/* Content Grid - Responsive */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 w-full">
            <Card className="shadow-elevation-2 hover:shadow-elevation-3 transition-all cursor-pointer" onClick={() => setActivePanel("overview")}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl md:text-2xl lg:text-3xl">
                  <FileText className="h-6 w-6 md:h-7 md:w-7 lg:h-8 lg:w-8" />
                  Material Design 3
                </CardTitle>
                <CardDescription className="text-base md:text-lg">
                  M3 tokens with 18px base font and WCAG 2.2 AA
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-3 flex-wrap">
                  <Button size="sm" className="text-base">Primary</Button>
                  <Button size="sm" variant="secondary" className="text-base">Secondary</Button>
                  <Button size="sm" variant="outline" className="text-base">Outline</Button>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg text-base md:text-lg">
                  <p>✅ 18px base font</p>
                  <p>✅ 44x44px touch targets</p>
                  <p>✅ 3px focus rings</p>
                  <p>✅ 4.5:1 contrast ratio</p>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-elevation-2 hover:shadow-elevation-3 transition-all cursor-pointer" onClick={() => setActivePanel("components")}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl md:text-2xl lg:text-3xl">
                  <Database className="h-6 w-6 md:h-7 md:w-7 lg:h-8 lg:w-8" />
                  UI Components
                </CardTitle>
                <CardDescription className="text-base md:text-lg">ShadCN 2.0 library integration</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-base md:text-lg">
                  <li>✅ React 19 + TypeScript</li>
                  <li>✅ ShadCN 2.0 (new-york)</li>
                  <li>✅ Tailwind CSS 4.0</li>
                  <li>✅ ESLint + Prettier</li>
                  <li>✅ Dark mode support</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="shadow-elevation-2 hover:shadow-elevation-3 transition-all cursor-pointer lg:col-span-2 xl:col-span-1" onClick={() => setActivePanel("settings")}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl md:text-2xl lg:text-3xl">
                  <Settings className="h-6 w-6 md:h-7 md:w-7 lg:h-8 lg:w-8" />
                  Configuration
                </CardTitle>
                <CardDescription className="text-base md:text-lg">Accessibility utilities and themes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-base md:text-lg font-medium">Theme</span>
                    <span className="text-base md:text-lg text-muted-foreground capitalize">{theme}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-base md:text-lg font-medium">Focus Indicators</span>
                    <span className="text-base md:text-lg text-muted-foreground">Enabled</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span className="text-base md:text-lg font-medium">High Contrast</span>
                    <span className="text-base md:text-lg text-muted-foreground">Available</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Sheet open={activePanel === "overview"} onOpenChange={(open) => !open && setActivePanel(null)}>
        <SheetContent side="right" className="w-full sm:w-[540px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 text-2xl md:text-3xl">
              <FileText className="h-6 w-6 md:h-7 md:w-7" />
              Material Design 3 Overview
            </SheetTitle>
            <SheetDescription className="text-base md:text-lg">
              Design system implementation details
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-6">
            <div>
              <h3 className="font-semibold mb-3 text-xl md:text-2xl">Color System</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-primary text-primary-foreground rounded-lg text-base md:text-lg">Primary</div>
                <div className="p-4 bg-secondary text-secondary-foreground rounded-lg text-base md:text-lg">Secondary</div>
                <div className="p-4 bg-accent text-accent-foreground rounded-lg text-base md:text-lg">Accent</div>
                <div className="p-4 bg-muted text-muted-foreground rounded-lg text-base md:text-lg">Muted</div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-3 text-xl md:text-2xl">Typography Scale</h3>
              <div className="space-y-2">
                <p className="text-4xl md:text-5xl lg:text-6xl font-bold">Heading 1</p>
                <p className="text-3xl md:text-4xl lg:text-5xl font-bold">Heading 2</p>
                <p className="text-2xl md:text-3xl lg:text-4xl font-semibold">Heading 3</p>
                <p className="text-xl md:text-2xl lg:text-3xl">Heading 4</p>
                <p className="text-lg md:text-xl">Large Text</p>
                <p className="text-base">Body Text (fluid 18px+)</p>
                <p className="text-sm md:text-base">Small Text</p>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-3 text-xl md:text-2xl">Elevation Shadows</h3>
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((level) => (
                  <div key={level} className={`p-4 bg-card rounded-lg shadow-elevation-${level} text-base md:text-lg`}>
                    Elevation Level {level}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={activePanel === "components"} onOpenChange={(open) => !open && setActivePanel(null)}>
        <SheetContent side="right" className="w-full sm:w-[540px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 text-2xl md:text-3xl">
              <Database className="h-6 w-6 md:h-7 md:w-7" />
              Component Library
            </SheetTitle>
            <SheetDescription className="text-base md:text-lg">
              Available ShadCN components
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-6">
            <div>
              <h3 className="font-semibold mb-3 text-xl md:text-2xl">Interactive Components</h3>
              <div className="space-y-3">
                <div className="flex gap-2 flex-wrap">
                  <Button className="text-base">Default</Button>
                  <Button variant="secondary" className="text-base">Secondary</Button>
                  <Button variant="outline" className="text-base">Outline</Button>
                  <Button variant="ghost" className="text-base">Ghost</Button>
                  <Button variant="destructive" className="text-base">Destructive</Button>
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-3 text-xl md:text-2xl">Installed Components</h3>
              <ul className="space-y-2 text-base md:text-lg">
                <li>✓ Accordion</li>
                <li>✓ Alert</li>
                <li>✓ Button</li>
                <li>✓ Card</li>
                <li>✓ Dialog</li>
                <li>✓ Dropdown Menu</li>
                <li>✓ Form</li>
                <li>✓ Progress</li>
                <li>✓ Separator</li>
                <li>✓ Sheet (Side Panel)</li>
                <li>✓ Skeleton</li>
                <li>✓ Tabs</li>
                <li>✓ Toast (Sonner)</li>
              </ul>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <Sheet open={activePanel === "settings"} onOpenChange={(open) => !open && setActivePanel(null)}>
        <SheetContent side="right" className="w-full sm:w-[540px] overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 text-2xl md:text-3xl">
              <Settings className="h-6 w-6 md:h-7 md:w-7" />
              Settings & Configuration
            </SheetTitle>
            <SheetDescription className="text-base md:text-lg">
              Accessibility and theme preferences
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 space-y-6">
            <div>
              <h3 className="font-semibold mb-3 text-xl md:text-2xl">Theme</h3>
              <div className="flex gap-2">
                <Button
                  variant={theme === "light" ? "default" : "outline"}
                  onClick={() => setTheme("light")}
                  className="flex-1 text-base md:text-lg h-auto py-3"
                >
                  Light
                </Button>
                <Button
                  variant={theme === "dark" ? "default" : "outline"}
                  onClick={() => setTheme("dark")}
                  className="flex-1 text-base md:text-lg h-auto py-3"
                >
                  Dark
                </Button>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-3 text-xl md:text-2xl">Accessibility Features</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium text-base md:text-lg">Focus Indicators</p>
                    <p className="text-sm md:text-base text-muted-foreground">3px ring with 3:1 contrast</p>
                  </div>
                  <span className="text-sm md:text-base text-green-600 dark:text-green-400">Active</span>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium text-base md:text-lg">Touch Targets</p>
                    <p className="text-sm md:text-base text-muted-foreground">44x44px minimum size</p>
                  </div>
                  <span className="text-sm md:text-base text-green-600 dark:text-green-400">Active</span>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium text-base md:text-lg">High Contrast</p>
                    <p className="text-sm md:text-base text-muted-foreground">4.5:1 ratio for text</p>
                  </div>
                  <span className="text-sm md:text-base text-green-600 dark:text-green-400">Active</span>
                </div>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default App;
