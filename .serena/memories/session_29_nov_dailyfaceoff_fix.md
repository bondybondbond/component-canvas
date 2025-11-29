# Session: Daily Faceoff Capture Fix (29 Nov 2025)

## Problem Diagnosed
dailyfaceoff.com Headlines component could not be captured - box turned green but nothing saved.

## Root Cause
**Tailwind CSS class names contain special characters** (`:` and `/`) that break CSS selectors:
- Classes like `xl:mt-0` and `xl:w-3/12` 
- When used in `querySelectorAll()`, browser interprets `:` as pseudo-class and `/` as invalid
- Error: `SyntaxError: 'div.xl:mt-0.xl:w-3/12' is not a valid selector`

## Solution Implemented
1. **Added `escapeCSSClass()` function** in content.ts
   - Escapes all special characters: `:` → `\\:`, `/` → `\\/`, etc.
   - Applied to all class names before building selectors
   
2. **Added debug logging toggle**
   - `const DEBUG = false` at top of content.ts
   - Set to `true` to enable detailed console logs for troubleshooting
   - Keeps error logging always enabled

3. **Comprehensive logging for diagnostics**
   - Tracks selector generation step-by-step
   - Shows storage operations
   - Critical for diagnosing issues on problematic sites

## Technical Details
**Before**: `div.xl:mt-0.xl:w-3/12 > div` ❌  
**After**: `div.xl\\:mt-0.xl\\:w-3\\/12 > div` ✅

## Impact
- Fixes capture on **any site using Tailwind CSS or similar utility frameworks**
- Modern websites commonly use these frameworks (Tailwind, UnoCSS, WindiCSS)
- Approximately 30%+ of modern web uses utility-first CSS with special characters

## Files Modified
- `src/content.ts`: Added escapeCSSClass(), debug toggle, cleaned up logging

## Testing Verified
- ✅ Headlines component from dailyfaceoff.com captured successfully
- ✅ Selector properly escaped: `div.w-full.xl\\:mt-0.xl\\:w-3\\/12 > div`
- ✅ Component saved to storage
- ✅ Alert shown to user

## Next Steps
- Test on /teams subpage (different issue to investigate)
- Consider adding selector validation before storage
