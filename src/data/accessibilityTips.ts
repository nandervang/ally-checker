export interface AccessibilityTip {
  id: string;
  title: string;
  content: string;
  category: "Visual" | "Screen Reader" | "Keyboard" | "Cognitive" | "Forms" | "General" | "Mobile" | "Tools";
  source: string;
  url: string;
}

export const ACCESSIBILITY_TIPS: AccessibilityTip[] = [
  // --- Visual Design ---
  {
    id: "vis-1",
    title: "Color Reliance",
    content: "Did you know? Color alone should not be used to convey meaning. Use icons, text labels, or patterns alongside color indicators to ensure users with color blindness can understand the status.",
    category: "Visual",
    source: "WCAG 2.1 - 1.4.1 Use of Color",
    url: "https://www.w3.org/WAI/WCAG21/Understanding/use-of-color.html"
  },
  {
    id: "vis-2",
    title: "Text Contrast",
    content: "Body text should have a contrast ratio of at least 4.5:1 against its background. Large text (bold 18pt+ or regular 24pt+) needs a ratio of 3:1.",
    category: "Visual",
    source: "WCAG 2.1 - 1.4.3 Contrast (Minimum)",
    url: "https://www.w3.org/WAI/WCAG21/Understanding/contrast-minimum.html"
  },
  {
    id: "vis-3",
    title: "Focus Indicators",
    content: "All interactive elements must have a visible focus indicator. Never remove the outline style with CSS unless you replace it with a highly visible custom style.",
    category: "Visual",
    source: "WCAG 2.1 - 2.4.7 Focus Visible",
    url: "https://www.w3.org/WAI/WCAG21/Understanding/focus-visible.html"
  },
  {
    id: "vis-4",
    title: "Zoom and Scaling",
    content: "Users should be able to zoom in up to 200% without loss of content or functionality. Avoid disabling viewport zooming in your meta tags.",
    category: "Visual",
    source: "WCAG 2.1 - 1.4.4 Resize Text",
    url: "https://www.w3.org/WAI/WCAG21/Understanding/resize-text.html"
  },
  {
    id: "vis-5",
    title: "Link Identification",
    content: "Links within text blocks should be identifiable by more than just color. Underlines are the most common and understood way to distinguish links.",
    category: "Visual",
    source: "WebAIM - Links",
    url: "https://webaim.org/techniques/hypertext/link_text#appearance"
  },

  // --- Keyboard ---
  {
    id: "key-1",
    title: "Keyboard Traps",
    content: "Ensure users can navigate into and out of all interactive elements using only a keyboard. Custom modals are common places where keyboard focus can get stuck.",
    category: "Keyboard",
    source: "WCAG 2.1 - 2.1.2 No Keyboard Trap",
    url: "https://www.w3.org/WAI/WCAG21/Understanding/no-keyboard-trap.html"
  },
  {
    id: "key-2",
    title: "Logical Tab Order",
    content: "The tab order should follow the visual reading order of the page. Avoid using positive tabindex values (> 0) as they can disrupt the natural flow.",
    category: "Keyboard",
    source: "WCAG 2.1 - 2.4.3 Focus Order",
    url: "https://www.w3.org/WAI/WCAG21/Understanding/focus-order.html"
  },
  {
    id: "key-3",
    title: "Skip Links",
    content: "Provide a 'Skip to Main Content' link at the top of the page. This allows keyboard and screen reader users to bypass repetitive navigation menus.",
    category: "Keyboard",
    source: "WCAG 2.1 - 2.4.1 Bypass Blocks",
    url: "https://www.w3.org/WAI/WCAG21/Understanding/bypass-blocks.html"
  },
  {
    id: "key-4",
    title: "Interactive Elements",
    content: "Anything that looks clickable must be clickable with a keyboard. If you use a <div> as a button, you must add role='button' and tabindex='0' and handle Enter/Space keys.",
    category: "Keyboard",
    source: "MDN - ARIA: button role",
    url: "https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/button_role"
  },

  // --- Screen Reader ---
  {
    id: "sr-1",
    title: "Alternative Text",
    content: "Alt text should describe the purpose of the image, not just its appearance. If an image is purely decorative, use an empty alt attribute (alt=\"\").",
    category: "Screen Reader",
    source: "WCAG 2.1 - 1.1.1 Non-text Content",
    url: "https://www.w3.org/WAI/tutorials/images/decision-tree/"
  },
  {
    id: "sr-2",
    title: "Heading Structure",
    content: "Use headings (H1-H6) to create a logical outline of your content. Don't skip heading levels (e.g., H1 to H3) as screen reader users rely on them for navigation.",
    category: "Screen Reader",
    source: "WCAG 2.1 - 1.3.1 Info and Relationships",
    url: "https://www.w3.org/WAI/tutorials/page-structure/headings/"
  },
  {
    id: "sr-3",
    title: "Meaningful Link Text",
    content: "Link text should make sense on its own. Avoid 'Click here' or 'Read more'. Instead, use descriptive text like 'Read more about Accessibility'.",
    category: "Screen Reader",
    source: "WCAG 2.1 - 2.4.4 Link Purpose",
    url: "https://www.w3.org/WAI/WCAG21/Understanding/link-purpose-in-context.html"
  },
  {
    id: "sr-4",
    title: "Landmarks",
    content: "Use HTML5 semantic regions like <main>, <nav>, <header>, and <footer>. These are automatically recognized as landmarks by screen readers.",
    category: "Screen Reader",
    source: "WAI-ARIA - Landmarks",
    url: "https://www.w3.org/WAI/ARIA/apg/practices/landmark-regions/"
  },
  {
    id: "sr-5",
    title: "Language Attribute",
    content: "Always set the <html lang=\"en\"> attribute. This ensures screen readers pronounce the content correctly using the appropriate accent and rules.",
    category: "Screen Reader",
    source: "WCAG 2.1 - 3.1.1 Language of Page",
    url: "https://www.w3.org/WAI/WCAG21/Understanding/language-of-page.html"
  },

  // --- Forms ---
  {
    id: "form-1",
    title: "Visible Labels",
    content: "Every form input needs a permanently visible label. Placeholders are not a substitute for labels, as they disappear when the user starts typing.",
    category: "Forms",
    source: "WCAG 2.1 - 3.3.2 Labels or Instructions",
    url: "https://www.w3.org/WAI/tutorials/forms/labels/"
  },
  {
    id: "form-2",
    title: "Error Identification",
    content: "When a form error occurs, identify the error clearly in text and programmatically associate the error message with the input field using aria-describedby.",
    category: "Forms",
    source: "WCAG 2.1 - 3.3.1 Error Identification",
    url: "https://www.w3.org/WAI/WCAG21/Understanding/error-identification.html"
  },
  {
    id: "form-3",
    title: "Autocomplete Attributes",
    content: "Use the autocomplete attribute on input fields to help users fill out forms faster. This is especially helpful for people with cognitive disabilities.",
    category: "Forms",
    source: "WCAG 2.1 - 1.3.5 Identify Input Purpose",
    url: "https://www.w3.org/WAI/WCAG21/Understanding/identify-input-purpose.html"
  },
  {
    id: "form-4",
    title: "Grouping Controls",
    content: "Related form controls, like radio buttons or checkboxes, should be grouped using <fieldset> and <legend> to provide context.",
    category: "Forms",
    source: "WCAG 2.1 - 1.3.1 Info and Relationships",
    url: "https://www.w3.org/WAI/tutorials/forms/grouping/"
  },

  // --- Cognitive & General ---
  {
    id: "gen-1",
    title: "Motion Sensitivity",
    content: "Provide a mechanism to pause, stop, or hide any auto-playing content or animations. Respect the 'prefers-reduced-motion' media query.",
    category: "General",
    source: "WCAG 2.1 - 2.2.2 Pause, Stop, Hide",
    url: "https://www.w3.org/WAI/WCAG21/Understanding/pause-stop-hide.html"
  },
  {
    id: "gen-2",
    title: "Simple Language",
    content: "Write clearly and simply. Avoid jargon and complex sentence structures. This benefits users with cognitive disabilities and non-native speakers.",
    category: "Cognitive",
    source: "WCAG 2.1 - 3.1.5 Reading Level",
    url: "https://www.w3.org/WAI/WCAG21/Understanding/reading-level.html"
  },
  {
    id: "gen-3",
    title: "Consistent Navigation",
    content: "Keep navigation mechanisms consistent across your site. Users shouldn't have to relearn how to navigate on every new page.",
    category: "Cognitive",
    source: "WCAG 2.1 - 3.2.3 Consistent Navigation",
    url: "https://www.w3.org/WAI/WCAG21/Understanding/consistent-navigation.html"
  },
  {
    id: "gen-4",
    title: "Target Size",
    content: "Touch targets should be at least 44x44 CSS pixels (or 24x24 in WCAG 2.2) to ensure they are easily tappable on mobile devices.",
    category: "Mobile",
    source: "WCAG 2.1 - 2.5.5 Target Size",
    url: "https://www.w3.org/WAI/WCAG21/Understanding/target-size.html"
  },
  
  // --- Magenta / Testing Specific ---
  {
    id: "mag-1",
    title: "Automated vs Manual",
    content: "Automated tools only catch about 30-50% of accessibility issues. Manual testing with keyboard and screen readers is essential for full compliance.",
    category: "General",
    source: "Magenta A11y",
    url: "https://www.magentaa11y.com/"
  },
  {
    id: "mag-2",
    title: "Acceptance Criteria",
    content: "Include accessibility checks in your definition of done (DoD). Accessibility should be considered during design and development, not just at the end.",
    category: "General",
    source: "Magenta A11y - Process",
    url: "https://www.magentaa11y.com/checklist/"
  },
  {
    id: "mag-3",
    title: "Headings Map",
    content: "Use a browser extension like 'HeadingsMap' to visualize your document/page structure. The outline should look like a table of contents.",
    category: "Tools",
    source: "Common Testing Tools",
    url: "https://chrome.google.com/webstore/detail/headingsmap/flbjommegcjonpdmenkdiocclhjacmbi"
  },
  {
    id: "mag-4",
    title: "Screen Reader on Mobile",
    content: "Test on real mobile devices using VoiceOver (iOS) or TalkBack (Android). Emulators often don't accurately reflect mobile screen reader behavior.",
    category: "Mobile",
    source: "Mobile Accessibility",
    url: "https://www.w3.org/WAI/standards-guidelines/mobile/"
  },
  {
    id: "doc-1",
    title: "PDF Accessibility",
    content: "PDFs need tags to be accessible. A tagged PDF contains a hidden layer of structure that screen readers use to navigate the document.",
    category: "General",
    source: "WAI - PDF Techniques",
    url: "https://www.w3.org/WAI/WCAG21/Techniques/pdf/"
  },
  {
    id: "doc-2",
    title: "Table Headers",
    content: "Data tables must have header cells (<th>) identified. Use scope='col' or scope='row' to association data cells with their headers explicitly.",
    category: "Screen Reader",
    source: "WCAG 2.1 - 1.3.1 Info and Relationships",
    url: "https://www.w3.org/WAI/tutorials/tables/"
  },
  {
    id: "dev-1",
    title: "Linter Integration",
    content: "Use eslint-plugin-jsx-a11y to catch accessibility errors while you code. It can identify missing alt text, invalid aria roles, and more.",
    category: "Tools",
    source: "ESLint A11y Plugin",
    url: "https://github.com/jsx-eslint/eslint-plugin-jsx-a11y"
  },
  // --- New Additions (Magenta/WAI/Tools) ---
  {
    id: "mag-5",
    title: "Keyboard Traps & Regions",
    content: "Ensure custom widgets (like complex grids or maps) allow keyboard escape. Users should never get stuck in a component without a way to exit.",
    category: "Keyboard",
    source: "Magenta A11y - Keyboard",
    url: "https://www.magentaa11y.com/checklist/#keyboard"
  },
  {
    id: "wai-1",
    title: "Label in Name",
    content: "For buttons with text and icons, ensure the visible text matches the accessible name (aria-label). Speech recognition users rely on saying exactly what they see.",
    category: "Screen Reader",
    source: "WCAG 2.1 - 2.5.3 Label in Name",
    url: "https://www.w3.org/WAI/WCAG21/Understanding/label-in-name.html"
  },
  {
    id: "wai-2",
    title: "Status Messages",
    content: "Use role='status' or aria-live='polite' for dynamic updates (like 'Search results updated') so screen readers announce them without moving focus.",
    category: "Screen Reader",
    source: "WCAG 2.1 - 4.1.3 Status Messages",
    url: "https://www.w3.org/WAI/WCAG21/Understanding/status-messages.html"
  },
  {
    id: "mob-2",
    title: "Orientation",
    content: "Don't lock screen orientation. Apps must work in both portrait and landscape modes, as some users have devices fixed to wheelchairs.",
    category: "Mobile",
    source: "WCAG 2.1 - 1.3.4 Orientation",
    url: "https://www.w3.org/WAI/WCAG21/Understanding/orientation.html"
  },
  {
    id: "vis-6",
    title: "Reflow (400% Zoom)",
    content: "Test your site at 400% zoom (1280px width). Content should reflow into a single column without horizontal scrolling, which is difficult for low-vision users.",
    category: "Visual",
    source: "WCAG 2.1 - 1.4.10 Reflow",
    url: "https://www.w3.org/WAI/WCAG21/Understanding/reflow.html"
  },
  {
    id: "tool-2",
    title: "WAVE Tool",
    content: "WAVE is a browser extension that visualizes accessibility issues directly on your page. It's excellent for spotting heading structure and contrast errors.",
    category: "Tools",
    source: "WebAIM - WAVE",
    url: "https://wave.webaim.org/"
  },
  {
    id: "tool-3",
    title: "axe DevTools",
    content: "axe DevTools runs in your browser console and catches ~50% of issues automatically. It's a standard tool for developers to catch syntax errors early.",
    category: "Tools",
    source: "Deque - axe DevTools",
    url: "https://www.deque.com/axe/devtools/"
  },
  {
    id: "tool-4",
    title: "Colour Contrast Analyser",
    content: "The TPGi Colour Contrast Analyser (CCA) includes an eyedropper to test contrast on non-web files like PDFs or Figma designs.",
    category: "Tools",
    source: "TPGi - CCA",
    url: "https://www.tpgi.com/color-contrast-checker/"
  }
];
