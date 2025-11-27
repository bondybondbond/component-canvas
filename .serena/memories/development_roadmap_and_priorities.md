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

**All high-impact features are now DONE!**

---

## 🔧 SUPPORTING FEATURES (Medium Impact)

**All medium-impact features are now DONE!**

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

## 💡 WHAT'S LEFT

Only **Polish Features** remain (P8-P11):
- P8: Preserve original styling (30 mins, risky)
- P9: Add favicons (10 mins)
- P10: Grid layout improvements (15 mins)
- P11: Drag to rearrange (60 mins, complex)

**Recommendation:** MVP is essentially complete! All core + supporting features done. Polish features are optional nice-to-haves.

---

## ✅ COMPLETED FEATURES

- Step 0: "Open Canvas" button → opens full tab
- Step 1: Capture actual HTML
- Step 2: Delete works (from popup)
- Step 3: Click component → Opens source URL
- Step 4: Filter popup to show only CURRENT PAGE components
- Step 5: Delete from canvas (with confirmation)
- Step 6: Manual refresh button (hybrid fetch + tab-based)
- Step 7: Better CSS selectors (unique selector generation)
- Step 8: Show timestamps (absolute + relative time)
- Step 9: **Name/Notes modal → Editable labels** (Click-to-edit titles)
