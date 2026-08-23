# Task 5: Home Screen Redesign

## File Modified
- `src/components/search-engine/search-engine/home-screen.tsx`

## Changes Made

### Hero Section
- Logo: w-28 h-28 (128px) → w-20 h-20 (80px), removed sm variant
- Title: text-5xl/6xl → text-4xl/5xl
- Subtitle: mt-2 → mt-1, text-sm/base → text-xs/sm
- Removed descriptive paragraph about Tor/Opera
- Status pill: more compact (1.5 gap, px-2.5 py-1, text-[11px], smaller dot w-1.5)
- Removed !bangs hints row entirely
- Removed suggestion chips row entirely
- Padding: pt-12 pb-8 / sm:pt-16 sm:pb-12
- Container: max-w-3xl → max-w-5xl

### Speed Dial Section
- 4 sites on mobile (items 5-8 use `hidden sm:flex`)
- 8 on desktop (unchanged)
- Section title: text-sm font-semibold → text-xs font-medium text-muted-foreground/70
- Removed subtitle text ("كل موقع يُفتح عبر البروكسي المجهّل")
- Container: max-w-4xl → max-w-5xl
- Spacing: pb-8 → pt-10 pb-10

### Features Section
- Cards: rounded-xl → rounded-2xl, p-4 → p-5
- Icon margin: mb-2.5 → mb-3, title margin: mb-1 → mb-1.5
- Grid gap: gap-3 → gap-4
- Section spacing: pb-8 → py-10 sm:py-14

### Bottom Section (Session + AI + Privacy)
- Session card: wrapped in `hidden lg:block` div
- Privacy card: `hidden lg:block` added directly
- AI CTA: always visible (the only bottom card on mobile)
- Cards: rounded-xl → rounded-2xl, p-4 → p-5
- Gap: gap-4 → gap-5
- Section: pb-12 → pt-10 (bottom padding handled by main's pb-16 sm:pb-8)

### Main Tag
- Added `scroll-mt-14 sm:scroll-mt-0` for mobile scroll offset
- Added `pb-16 sm:pb-8` for mobile bottom bar clearance

## Preserved
- All imports and store hooks
- All component logic (submitSuggestion, openSite, AI panel open)
- Ghosts decorative component
- All CSS classes (grid-bg, glow-text, pulse-ring, ghost-float)

## Lint
- 0 errors, 0 warnings
