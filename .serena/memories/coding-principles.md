# SpotBoard Coding Principles

## 🚫 NEVER: Site-Specific Rules

**FORBIDDEN PATTERN:**
```typescript
// ❌ BAD - Site-specific hack
if (url.includes('bbc.co.uk')) {
  // Special BBC handling
}

// ❌ BAD - Site-specific selector
const bbcSelectors = ['.bbc-specific-class'];
const guardianSelectors = ['.guardian-specific-class'];
```

**Why forbidden:**
- Creates technical debt that scales linearly with sites
- Breaks when sites change their structure
- Unmaintainable - each new site needs new code
- Violates PRD design principle: "Scalable Solutions Only"

---

## ✅ ALWAYS: Universal Patterns

**CORRECT PATTERN:**
```typescript
// ✅ GOOD - Universal pattern matching
const duplicateSelectors = [
  '[class*="-mobile"]',    // Catches ANY mobile class pattern
  '[class*="short-"]',     // Catches ANY short version pattern
  '[class*="-abbr"]'       // Catches ANY abbreviated pattern
];
```

**Why correct:**
- Works across 85-90% of sites automatically
- Survives site redesigns (patterns persist)
- No code changes needed for new sites
- Scales sub-linearly - one rule fixes many sites

---

## Decision Framework

When encountering a new issue:

1. **Identify the pattern** - What's the underlying structure?
2. **Generalize it** - What pattern would catch this + similar sites?
3. **Test universality** - Does it work on BBC, Guardian, ESPN, etc.?
4. **Accept limitations** - Document edge cases rather than add site-specific fixes

**Example:**
- Issue: Evening Standard shows duplicate article titles
- Pattern: Mobile (`short-title`) + Desktop (`title`) in same DOM
- Universal fix: `[class*="short-"]` catches short-title, short-name, short-description across ALL sites
- Result: Fixes Evening Standard + future sites with similar patterns

---

## Tech Debt Prevention

**Site-specific rules create this nightmare:**
```typescript
// ❌ After 6 months without universal thinking
if (url.includes('bbc')) { /* 50 lines */ }
if (url.includes('guardian')) { /* 40 lines */ }
if (url.includes('standard')) { /* 45 lines */ }
if (url.includes('telegraph')) { /* 55 lines */ }
// ... 20 more sites = 1000+ lines of unmaintainable spaghetti
```

**Universal patterns keep it clean:**
```typescript
// ✅ Same codebase handles 50+ sites
const patterns = [
  '[class*="-mobile"]',
  '[class*="short-"]',
  '[class*="-abbr"]'
];
// 3 lines handle most sites
```

---

## When Universal Isn't Possible

If truly no pattern exists (rare ~5% of sites):

1. **Document limitation** in PRD/learnings
2. **Add to known limitations list**
3. **DO NOT add site-specific code**
4. **Accept it won't work** for that site

**Example:** Yahoo Finance authentication - no universal fix exists, so it's documented as a limitation rather than adding Yahoo-specific auth handling.

---

## Mantra

**"Universal patterns or documented limitations - never site-specific hacks"**
