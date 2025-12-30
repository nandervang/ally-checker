/**
 * This file is the entry point for the React app, it sets up the root
 * element and renders the App component to the DOM with routing support.
 *
 * It is included in `src/index.html`.
 */

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { App } from "./App";
import { AuditHistory } from "./pages/AuditHistory";
import { AccessibilityStatement } from "./pages/AccessibilityStatement";
import { ErrorBoundary } from "./components/ErrorBoundary";
import "./i18n/config"; // Initialize i18n

const elem = document.getElementById("root")!;
const app = (
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/history" element={<AuditHistory />} />
          <Route path="/statement" element={<AccessibilityStatement />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>
);

if (import.meta.hot) {
  // With hot module reloading, `import.meta.hot.data` is persisted.
  const root = (import.meta.hot.data.root ??= createRoot(elem));
  root.render(app);
} else {
  // The hot module reloading API is not available in production.
  createRoot(elem).render(app);
}
