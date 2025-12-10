# Workflow Division of Labor

**User handles:**
- All clicking ONLY (board refresh button, extension reload button, UI interactions)
- Physical interactions requiring clicks

**Claude (me) handles:**
- All console analysis and debugging
- Reading console messages through DevTools
- Examining page structures and DOM inspection
- Writing code in console (evaluate_script)
- Running rebuild commands (npm run build)
- Taking screenshots
- Analyzing logs and identifying issues
- Typing any console commands
- All "seeing" work - looking at logs, structures, debugging output
- No clicking - this causes crashes and wastes time

**Why:** Claude crashes when attempting to click with Windows-MCP. User can click faster. Claude should do ALL the analysis and debugging work directly.
