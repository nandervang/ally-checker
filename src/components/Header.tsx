import { useTranslation } from "react-i18next";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { useIconLibrary } from "@/contexts/IconLibraryContext";
import { Icon } from "@/lib/icons";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface HeaderProps {
  onOpenSettings: () => void;
}

export function Header({ onOpenSettings }: HeaderProps) {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const { user, signOut } = useAuth();
  const { iconLibrary } = useIconLibrary();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/98 backdrop-blur-md supports-[backdrop-filter]:bg-background/95 shadow-md">
      {/* Skip to main content link - visible on focus for keyboard users */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-[60] focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-md focus-ring"
      >
        {t("nav.skipToMain")}
      </a>

      <div className="flex h-20 items-center px-8 gap-8 max-w-[1600px] mx-auto">
        <Link to="/" className="hover:opacity-80 transition-opacity">
          <h1 className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold">
            {t("app.title")}
          </h1>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex gap-3 ml-8" aria-label="Main navigation">
          <Button
            asChild
            variant={isActive("/") ? "default" : "ghost"}
            size="sm"
            className="gap-2"
          >
            <Link to="/">
              <Icon name="home" library={iconLibrary} className="h-4 w-4" />
              Home
            </Link>
          </Button>
          <Button
            asChild
            variant={isActive("/history") ? "default" : "ghost"}
            size="sm"
            className="gap-2"
          >
            <Link to="/history">
              <Icon name="clock" library={iconLibrary} className="h-4 w-4" />
              History
            </Link>
          </Button>
          <Button
            asChild
            variant={isActive("/statement") ? "default" : "ghost"}
            size="sm"
            className="gap-2"
          >
            <Link to="/statement">
              <Icon name="file" library={iconLibrary} className="h-4 w-4" />
              Statement
            </Link>
          </Button>
        </nav>

        <div className="flex-1" />

        {/* User Menu (if authenticated) */}
        {user && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="focus-ring" aria-label="User menu">
                <Icon name="user" library={iconLibrary} className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onOpenSettings} className="gap-2 cursor-pointer">
                <Icon name="settings" library={iconLibrary} className="h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => { signOut(); }} className="gap-2 cursor-pointer">
                <Icon name="logout" library={iconLibrary} className="h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

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
          {theme === "dark" ? <Icon name="sun" library={iconLibrary} className="h-5 w-5" /> : <Icon name="moon" library={iconLibrary} className="h-5 w-5" />}
        </Button>

        {/* Language Switcher */}
        <LanguageSwitcher />
      </div>
    </header>
  );
}
