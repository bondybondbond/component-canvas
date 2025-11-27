# Session 29 Nov - ComponentCanvas Testing & Link Issues

## Status: Ready for Fixes Tomorrow

### CRITICAL FINDINGS

**Problem 1: Not All Links Clickable**
- Severity: HIGH
- Cause: DOM nesting - images/elements overlay links
- Symptom: Only first link in component works, others appear as links but don't click
- Evidence: User captured real BBC/HotUKDeals, my test HTML worked fine

**Problem 2: Wrong URLs**
- Severity: MEDIUM  
- Cause: Relative URLs resolve to extension origin, not source site
- Symptom: Click link → opens homepage instead of article/deal
- Example: `/news/articles/xyz` resolves to `chrome-extension://id/news/articles/xyz` instead of `https://bbc.com/news/articles/xyz`

**Problem 3: Erratic Cursor**
- Severity: MEDIUM
- Cause: Different DOM elements have different CSS cursor styles
- Symptom: Hand pointer shows on first link only, others show default cursor

## SOLUTIONS (All 3 Fixes = 35 mins total)

**Fix 1: Post-Process Captured HTML (20 mins)**
- Location: src/content.ts
- Remove overlaying elements that block clicks
- Flatten z-index conflicts
- Sanitize before storing in html_cache

**Fix 2: Transform Relative URLs (10 mins)**
- Location: public/dashboard.js
- Transform `/path` → `https://source.com/path`
- Handle relative paths starting with `.`
- Leave absolute URLs and hashes alone

**Fix 3: Ensure Cursor Consistency (5 mins)**
- Location: public/dashboard.js
- Add CSS: `a { cursor: pointer !important; }`
- Override any inherited cursor styles

## TOMORROW'S REQUIREMENTS

**User must provide:**
1. Real html_cache from broken component (console dump)
2. Screenshot showing which links don't work
3. Note the pattern (1st works? all after 1st broken? random?)
4. Any console errors when clicking

**With this data:** Can fix in 1 hour with 95% confidence

## TEST RESULTS SUMMARY

- ✅ Automated tests: All links work (clean HTML)
- ❌ Real captures: Some links don't work (complex DOM)
- ❓ User observation: Cursor erratic, only some links clickable
- ✅ Analysis: Clear root causes identified

## PHASE 2 (Future - Not Tomorrow)

Visual fidelity improvements:
- Capture HTML + CSS (not just HTML)
- Render in isolated container (iframe/shadow DOM)
- Keeps original layout + maintains link functionality
- ~2 hour effort
- Should be done after MVP stabilizes

## DOCUMENTS CREATED
- TESTING_REPORT.md - Single link test results
- COMPREHENSIVE_TESTING_REPORT.md - Multiple links + cursor
- FIXES_ROADMAP.md - Detailed fixes + code examples
- TOMORROW_CHECKLIST.md - What user needs to bring

## CONFIDENCE: 95%
- Problem well-defined
- Solutions straightforward
- Need real data to verify
