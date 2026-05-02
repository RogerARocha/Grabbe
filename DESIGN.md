---
name: GrabbeCS (Cinematic Solarized)
description: A high-end, cinematic dark mode design system for media tracking. It balances deep, low-fatigue backgrounds with vibrant, neon-esque accents and glassmorphism.
colors:
  # Backgrounds & Surfaces (The Canvas)
  background: '#002b36'                  # Deep solarized dark base (App background)
  surface: '#073642'                     # Elevated surface (Cards, Modals, Sidebar)
  surface-container: '#00212b'           # Depressed/Inset surfaces (Inputs, Dropdowns)
  surface-container-high: '#00151c'      # Deeper inset (Progress bars, secondary panels)
  surface-container-highest: '#000c11'   # Deepest possible surface
  
  # Text & Content
  text-high: '#ffffff'           # Pure white for high-emphasis (Titles)
  text-base: '#eee8d5'           # Off-white for body reading comfort
  text-muted: '#93a1a1'          # Muted teal-grey for subtitles, metadata
  on-surface: '#ffffff'          # Text on opaque surface backgrounds
  on-surface-variant: '#adaaaa'  # Slightly warmer muted; alt to text-muted
  
  # Accents (The "Neon/Prismatic" layer)
  primary: '#00A3F5'               # Cyan/Blue - Main actions, Active states
  on-primary: '#00314e'            # Dark text on primary-colored backgrounds
  secondary: '#53EAAA'             # Emerald/Mint - Completed, Library active tab
  tertiary: '#F848A1'              # Magenta/Pink - Accents, Dropped status
  warning: '#FEA800'               # Amber - Paused, Ratings (Stars)
  error: '#ff716c'                 # Coral/Red - Destructive actions, lowest ratings
  on-tertiary-container: '#2f0018' # Dark text on tertiary-tinted containers
  
  # Borders & Dividers
  outline-variant: '#484847'                 # Subtle borders, dividers (use at /10-/30 opacity)
  border-focus: 'rgba(0, 163, 245, 0.3)'     # Primary glow/focus ring
---

## 1. Brand & Ethos
**"The Cinematic Critic"**
This UI is built for power users. It feels less like a traditional web app and more like a high-end heads-up display (HUD) or a premium desktop application. It relies on deep contrast, glowing accents, and fluid micro-interactions to create an immersive, theater-like experience.

## 2. Core Effects & Utilities (The Secret Sauce)
The identity of this project relies heavily on custom CSS utility classes implemented in the `style` block. These MUST be used to maintain the "Masterpiece" aesthetic:

* **`.bloom-shadow`**: `box-shadow: 0px 12px 32px rgba(0, 0, 0, 0.5);`
    * *Usage:* Applied to all elevated elements (Hero Covers, Modals, Bento Boxes). It grounds elements in the dark space.
* **`.primary-glow` / `.primary-glow-hover`**: `box-shadow: 0px 0px 15px rgba(0, 163, 245, 0.3);`
    * *Usage:* Used on interactive media cards and primary buttons on hover to simulate a neon light emission.
* **`.prismatic-text`**: Uses `bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent`.
    * *Usage:* Used for the main Logo ("Grabbe"), high-impact headlines, and score displays.
* **`.prismatic-text-blue`**: Animated scrolling gradient — deep navy blues (`#014770 → #26618c → #6497b1`), `background-size: 200% auto`, loops via `prismatic-animate 4s linear infinite`.
    * *Usage:* Exclusively for the **Score 10 "Masterpiece"** entry in the rating picker. Do not use for generic headings.
* **`.group:hover .prismatic-text-blue-hover`**: Amplified state — `animation-duration: 0.7s`, `filter: drop-shadow` neon glow, `transform: scale(1.08)`.
    * *Usage:* Paired with `.prismatic-text-blue` on an element inside a `group` parent for hover amplification.
* **`.glass-panel`**: `background: rgba(0, 43, 54, 0.6); backdrop-filter: blur(20px);`
    * *Usage:* Used for sticky headers, floating badges over images, and any overlay that needs to reveal content beneath.

## 3. Typography Hierarchy
Powered entirely by **Bricolage Grotesque**, utilizing extreme font weights for contrast instead of size alone.

* **Display/Hero:** `text-5xl` to `text-6xl`, `font-extrabold` (800) or `font-black` (900), `tracking-tighter`.
* **Section Headers:** `text-2xl`, `font-bold`.
* **Body:** `text-sm` or `text-base`, `font-normal` or `font-medium`, `text-on-surface-variant` (`#93a1a1`).
* **Eyebrows/Labels:** `text-[10px]` or `text-xs`, `uppercase`, `tracking-[0.2em]` (widest), `font-bold`. *Crucial for metadata (e.g., "IMDB", "DIRECTOR").*

## 4. Component Architecture

### MediaCard — Shared (two variants)
File: `src/components/shared/MediaCard.tsx`

**Status color mapping** (applies to both variants):

| Status | Border | Badge bg | Badge text |
|---|---|---|---|
| `CONSUMING` | `border-primary` | `bg-primary/15` | `text-primary` |
| `COMPLETED` | `border-secondary` | `bg-secondary/15` | `text-secondary` |
| `DROPPED` | `border-tertiary` | `bg-tertiary/15` | `text-tertiary` |
| `PLANNED` | `border-warning` | `bg-warning/15` | `text-warning` |
| `PENDING` | `border-[#A0AEC0]` | `bg-[#A0AEC0]/15` | `text-[#A0AEC0]` |

**`library` variant (default):**
* Container: `aspect-[2/3]`, `rounded-lg`, `overflow-hidden`, `bloom-shadow`.
* Interactive: `transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]`, `hover:scale-[1.05]`.
* Border: `border-2` from the status map. On hover, softens to `border-outline-variant/60`.
* Badge: Floating `top-3 left-3`, `backdrop-blur-md`, `rounded-full`, `text-[10px] font-bold tracking-wider`.

**`dashboard` variant:**
* Compact `max-h-[240px]` cover with `aspect-[2/3]`.
* Always shows `border-primary` and `.primary-glow` (active-only context).
* Gradient overlay `from-black/80 to-transparent` at the bottom.
* Glass badge top-right: `.glass-panel rounded-full text-[10px] text-secondary uppercase`.
* Progress bar below image: `h-1 bg-surface-container-high` track, fill `bg-primary`.

### Buttons & Controls
* **Primary CTA:** `bg-primary text-on-primary font-bold px-12 py-4 rounded-lg .primary-glow active:scale-95`. Icon uses `group-hover:scale-110 transition-transform`.
* **Status Button (in-library):** `bg-primary/10 border border-primary/20 rounded-lg`. Contains a pulsing dot (`w-2 h-2 bg-primary animate-pulse`) as a live-state indicator.
* **Score Display Button:** `bg-surface-container-high border border-outline-variant/10`, score value rendered with `.prismatic-text`.
* **Ghost/Destructive:** Text-only, `text-text-muted hover:text-error transition-colors`.
* **Icon Buttons:** `p-3 rounded-lg bg-surface-container border border-outline-variant/10 hover:text-text-high`.
* **Inputs/Selects:** `bg-background border-none focus:ring-2 focus:ring-primary outline-none`. No visible border at rest — only the focus ring.
* **"Load More" button:** `bg-surface-container-high`, morphs on hover to `bg-primary text-on-primary`. Icon animates `group-hover:translate-y-1`.
* All buttons that trigger state changes: `active:scale-95` for tactile click feedback.
* All icons: Google Material Symbols Outlined.

### Modals & Dialogs — EvaluationModal
File: `src/components/modals/EvaluationModal.tsx`

* **Backdrop:** `bg-black/40 backdrop-blur-sm`.
* **Container:** `w-[420px] bg-surface rounded-[12px] .bloom-shadow max-h-[90vh] overflow-y-auto`.
* **Animation:** `animate-in fade-in zoom-in-95 duration-200`.
* **Two modes** via `mode: 'add' | 'update'` prop:
  * `add` — shows a search input with leading `search` icon.
  * `update` — shows a read-only label displaying `initialMediaName`.
* **Fields:** Status select, Progress number input (`current / ?`), Start/End date inputs each with an "Insert Today" shortcut button.
* **Score Picker:** Collapsible dropdown. Scores 1–10 with semantic label + color-coded text. Score 10 "Masterpiece" uses `.prismatic-text-blue` + `.prismatic-text-blue-hover` inside a `group` wrapper. Selected state shown via `check_circle` icon.
* **Footer:** Cancel (ghost, `text-text-muted hover:text-text-high`) + Confirm (`bg-secondary text-[#00412a] font-bold active:scale-95 bloom-shadow`).

### Stat Cards (QuickStats)
File: `src/components/dashboard/QuickStats.tsx`

* `bg-surface p-6 rounded-xl bloom-shadow` with a left accent stripe `border-l-4`.
* Stripe color maps to stat type: `border-primary` (Total Media), `border-tertiary` (Hours Watched), `border-secondary` (Masterpieces).
* Metric: `text-4xl font-bold`. Sub-label: `text-[10px] font-bold uppercase tracking-widest text-text-muted`.

### Progress Tracker
File: `src/components/media-details/ProgressTracker.tsx`

* Container: `bg-surface rounded-lg p-5 border border-outline-variant/10`.
* Live indicator: `w-2 h-2 rounded-full bg-primary animate-pulse` + label `text-xs font-bold text-primary uppercase tracking-wider`.
* Bar track: `h-2 bg-surface-container-high rounded-full`. Fill: `bg-primary transition-all duration-500 ease-out` driven by `style={{ width: percent% }}`.

### HeroCover
File: `src/components/media-details/HeroCover.tsx`

* `aspect-[2/3] rounded-lg overflow-hidden bloom-shadow hover:scale-[1.02]`.
* On hover: gradient overlay `from-background/60 to-transparent` fades in, revealing a "View Gallery" ghost button (`bg-text-base/10 backdrop-blur-md border border-text-base/20`).

### ActionBar
File: `src/components/media-details/ActionBar.tsx`

Renders conditionally on `isInLibrary` boolean:
* **Not in library:** Large primary CTA "Add to List" + share icon button.
* **In library:** Status badge button (pulsing dot + label) + score display + ghost "Remove" + share icon. All in `flex items-center gap-6`.

### Breadcrumbs
File: `src/components/shared/Breadcrumbs.tsx`

* `text-[10px] font-bold tracking-widest uppercase text-text-muted`.
* Separator: `chevron_right` Material Symbol at `text-[12px] text-outline-variant`.
* Current (last) item: `text-primary`. Ancestors: links with `hover:text-primary transition-colors`.

## 5. Layout Patterns

### MainLayout
File: `src/components/layout/MainLayout.tsx`

* Root: `min-h-screen bg-background text-text-base font-sans`.
* Composes `<Sidebar />` (fixed left) + `<TopBar />` (fixed top-right) + `<main>` (`ml-[260px] pt-24 px-12 pb-12`).
* All pages that use the shell must wrap in `<MainLayout>`.

### Sidebar Navigation
File: `src/components/layout/Sidebar.tsx`

* Fixed left, `w-[260px]`, `bg-surface`, `bloom-shadow`, `py-8 px-4 z-40`.
* Logo: `text-3xl font-black bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent`.
* Tagline eyebrow: `text-[10px] font-bold text-text-muted tracking-widest uppercase`.
* Nav links: `flex items-center gap-3 py-3 px-4 rounded-lg font-medium transition-all duration-200`.
  * Active: `text-primary font-bold border-r-2 border-primary`.
  * Inactive: `text-text-muted hover:bg-background hover:text-white`.
* Bottom CTA — "New Evaluation": `w-full bg-primary py-3 rounded-lg text-on-primary font-bold`, `hover:bg-gradient-to-r hover:from-primary hover:to-tertiary`. Opens `EvaluationModal` in `add` mode.

**Route map:**

| Route | Nav icon | Status |
|---|---|---|
| `/` | `dashboard` | Implemented |
| `/library` | `movie_filter` | Implemented |
| `/media/:id` | — | Implemented (linked from cards) |
| `/analytics` | `monitoring` | Stub (nav only) |
| `/community` | `group` | Stub (nav only) |
| `/settings` | `settings` | Stub (nav only) |
| `/movies`, `/series`, `/anime`, `/games`, `/books` | — | Commented out |

### TopBar
File: `src/components/layout/TopBar.tsx`

* Fixed top-right: `w-[calc(100%-260px)] h-16 z-40`, `.glass-panel` (`bg-background/60 backdrop-blur-md`).
* Left: search bar `bg-surface rounded-lg px-4 py-1.5 w-96` with leading `search` icon.
* Right: notifications icon (`hover:text-tertiary`) + user block (name + rank text + `rounded-full` avatar with `border border-primary/20`).

### Dashboard Layout
File: `src/pages/Dashboard.tsx`

* `<QuickStats />` (full-width `grid-cols-3` stat bar) sits above the main grid.
* `grid grid-cols-12 gap-8` below:
  * Left `col-span-12 lg:col-span-9`: `<CurrentlyConsuming />` + `<RecentEvaluations />`.
  * Right remainder: `<RightSidebar />` (planned queue + trending section).

### Library Grid
File: `src/components/library/LibraryGrid.tsx`

* Responsive: `grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6`.
* Renders `<MediaCard variant="library" />` for each entry.
* Pagination: "Load More Entries" loads 12 items at a time. Button uses `bg-surface-container-high` at rest, morphs to `bg-primary text-on-primary` on hover with a `translate-y-1` icon animation.