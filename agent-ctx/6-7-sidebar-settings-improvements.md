# Task 6-7: Sidebar and Settings View Improvements

## Task 6: Sidebar Improvements
**File:** `src/components/shabah/shabah/sidebar.tsx`

### Changes Made:
1. **Removed history section** (was lines 189-225) - redundant with search bar dropdown
2. **Narrowed sidebar:** w-60 → w-56 for more content area
3. **Larger touch targets:** py-2 → py-2.5 on all nav/action items
4. **Subtle separator** between AI button and New Identity button (`border-t border-sidebar-border/50`)
5. **Compact firewall area:** icon 3.5→3, padding py-2→py-1.5
6. **Removed unused imports:** History icon, history/clearHistory/setQuery store bindings
7. **Preserved:** initBlockedAttempts useEffect, all t() calls, MobileBottomBar

## Task 7: Settings View Improvements
**File:** `src/components/shabah/shabah/settings-view.tsx`

### Changes Made:
1. **Reduced 7 tabs → 4 tabs:**
   - General = old General + Search
   - Protection = old Circuit + Security
   - Privacy = unchanged
   - More = old Firewall + About
2. **Section component:** rounded-2xl, p-6, mt-3 children spacing
3. **Row component:** py-3, max-w-[280px] on labels
4. **TabsList:** md:w-48 → md:w-44
5. **Removed unused imports:** Globe, Info, Search icons, useEffect
6. **Added i18n keys** in `/src/lib/i18n.ts`: settings.protection, settings.more

### Verification:
- ESLint: 0 errors
- All existing functionality preserved
- All t() calls maintained
