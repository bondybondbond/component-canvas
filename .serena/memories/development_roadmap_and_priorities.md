# ComponentCanvas Development Roadmap

## 🐛 BUGS TO FIX

### Bug 1: Popup doesn't resize after delete
- **Impact:** Low (fixes on reopen)
- **Fix:** Force height recalculation after state change
- **Priority:** Medium

### Bug 2: Dashboard drift still happens
- **Impact:** Low (visual only)
- **Fix:** Needs different CSS approach
- **Priority:** Low

---

## 🎯 PRIORITY FEATURES (High Impact)

### P1: Step 3 - Click component → Opens source URL
- **Why first:** Makes canvas actually useful for navigation
- **Effort:** 5 mins
- **Value:** High - core functionality

### P2: Filter popup to show only CURRENT PAGE components
- **Why:** Prevents accidental deletes, cleaner UX
- **Effort:** 15 mins
- **Value:** High - major UX improvement
- **New feature** (not in original PRD)

### P3: Delete from canvas (with confirmation)
- **Why:** Main delete location, safer workflow
- **Effort:** 10 mins
- **Value:** High - better UX than popup-only delete

### P4: Step 7 - Manual refresh button
- **Why:** The "live data" feature from use case
- **Effort:** 20 mins (needs Step 4 CSS selector work)
- **Value:** High - core differentiator

---

## 🔧 SUPPORTING FEATURES (Medium Impact)

### P5: Step 4 - Better CSS selectors
- **Why:** Required for refresh to work reliably
- **Effort:** 15 mins
- **Value:** Medium - enables refresh
- **Blocker for:** Step 7

### P6: Step 6 - Show timestamps
- **Why:** Shows when data was last fetched
- **Effort:** 5 mins
- **Value:** Medium - status awareness

### P7: Step 5 - Name/Notes modal
- **Why:** User-friendly labeling
- **Effort:** 20 mins
- **Value:** Medium - nice to have

---

## ✨ POLISH FEATURES (Lower Priority)

### P8: Preserve original styling
- **Why:** Components look like source
- **Effort:** 30 mins (complex CSS isolation)
- **Value:** Medium - visual appeal
- **Risk:** May break layouts

### P9: Add favicons
- **Why:** Visual identification of source
- **Effort:** 10 mins
- **Value:** Low - nice polish

### P10: Step 8 - Grid layout improvements
- **Why:** Better visual organization
- **Effort:** 15 mins
- **Value:** Low - already decent

### P11: Drag to rearrange
- **Why:** Canvas customization
- **Effort:** 60 mins (complex)
- **Value:** Low - marked "Later" in PRD

---

## 🚫 KNOWN LIMITATIONS (Won't Fix Now)

- **BBC.com protection:** Some sites block extensions (need page refresh first)
- **CORS issues:** Can't refresh all sites (accepted in PRD)
- **Popup resize bug:** Minor, fixes on reopen

---

## 💡 RECOMMENDED NEXT 3 SESSIONS

### Session 1 (Current - 15 mins):
1. **Step 3:** Clickable URLs (5 mins)
2. **Filter popup to current page** (10 mins)

### Session 2 (Next):
3. **Delete from canvas with confirmation** (10 mins)
4. **Manual refresh button** (20 mins)

### Session 3 (Polish):
5. **Timestamps** (5 mins)
6. **Favicons** (10 mins)
7. **Name/Notes modal** (20 mins)

---

## ✅ COMPLETED FEATURES

- Step 0: "Open Canvas" button → opens full tab
- Step 1: Capture actual HTML
- Step 2: Delete works (from popup)
