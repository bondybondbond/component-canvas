📝 ComponentCanvas: MVP Specifications
Version: 2.1 (Lean MVP) Type: Chrome Extension (Manifest V3)
!Remember to always activate the project in Serena before you start!
serena activate component-canvas

1. Executive Summary
A desktop browser extension that allows the user to visually capture specific DOM elements (components) from any website and display them in a grid on a local dashboard.
2. Core Functional Requirements (MVP)
A. Capture Mechanism (Content Script)
Activation: User clicks extension icon to toggle "Capture Mode".
Selection: Hovering highlights DOM elements. Clicking locks the selection.
Validation: System generates a unique CSS selector. If multiple elements match, it defaults to the specific clicked element.
Modal: Upon selection, a modal appears asking for:
Name (Required)
Notes (Optional).
Storage: Saves URL, Selector, and metadata to chrome.storage.local.
B. Dashboard (UI)
View: A dedicated tab or popup displaying captured components in a responsive grid.
Interactivity: Clicking a component title/header opens the original URL in a new tab.
State: Components show a "Last updated" timestamp.
C. Refresh Logic (Background Worker)
Trigger: Manual "Refresh All" button or individual component refresh button.
Action: Background script fetches the source URL, parses HTML, finds the selector, and updates the stored HTML.
Failure Handling: If refresh fails, show the last cached version with a "Stale/Error" indicator.
3. Technical Constraints & Architecture
Manifest Version: V3 (Required).
Storage: Local Storage Only (chrome.storage.local). No database, no cloud.
Refresh: Client-side fetching. No server-side proxy.
External Assets: Images/styles within captured components should load directly from the source (hotlinked).
Framework: React (for Dashboard and Capture UI).
4. Data Structure (Schema)
The AI will use this strictly for the state management.
JSON
{
  "components": [
    {
      "id": "uuid-v4",
      "url": "https://bbc.co.uk/news",
      "selector": "div[data-testid='most-read']", 
      "label": "BBC Top Stories",
      "notes": "Morning check",
      "html_cache": "<div...>...</div>", 
      "last_refresh": "ISO-8601-Timestamp",
      "status": "active" // or "error"
    }
  ]
}

5. Non-Goals (Strictly Out of Scope)
No Background Refresh: Dashboard only updates when the user clicks refresh.
No Auth/Accounts: No login required.
No Notifications: The tool is passive.
No Cross-Device Sync: Desktop only.

