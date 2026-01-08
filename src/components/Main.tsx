import { ReactNode } from "react";

interface MainProps {
  children: ReactNode;
}

export function Main({ children }: MainProps) {
  return (
    <main
      id="main-content"
      className="flex-1 w-full bg-background"
      role="main"
      aria-label="Main content"
    >
      {children}
    </main>
  );
}
