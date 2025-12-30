import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";
import { Moon, Sun } from "lucide-react";
import "./index.css";

export function App() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto p-8 max-w-4xl">
        {/* Header with theme toggle */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold">Accessibility Checker</h1>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="focus-ring"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            <span className="sr-only">Toggle theme</span>
          </Button>
        </div>

        {/* Demo Cards */}
        <div className="grid gap-6">
          <Card className="shadow-elevation-2">
            <CardHeader>
              <CardTitle>Material Design 3 Demo</CardTitle>
              <CardDescription>
                ShadCN 2.0 components with M3 design tokens, 18px base font, and WCAG 2.2 AA compliance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4 flex-wrap">
                <Button>Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="destructive">Destructive</Button>
                <Button variant="ghost">Ghost</Button>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-base">
                  ✅ Base font size: 18px (constitutional requirement)
                  <br />
                  ✅ Touch targets: 44x44px minimum
                  <br />
                  ✅ Focus rings: 3px with 3:1 contrast
                  <br />
                  ✅ Color contrast: 4.5:1 for normal text
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-elevation-3">
            <CardHeader>
              <CardTitle>UI Scaffolding Complete</CardTitle>
              <CardDescription>Tasks: ally-checker-0z3, am8, frg</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-base">
                <li>✅ Bun + Vite + React 19 + TypeScript</li>
                <li>✅ ShadCN 2.0 components (new-york style)</li>
                <li>✅ Tailwind CSS 4.0 with M3 tokens (OKLCH colors)</li>
                <li>✅ ESLint + Prettier configured</li>
                <li>✅ Dark mode support</li>
                <li>✅ Accessibility utilities (focus-ring, elevation)</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default App;
