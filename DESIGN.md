---
name: GrabbeCS (Cinematic Solarized)
description: A high-end, cinematic dark mode design system for media tracking. It balances deep, low-fatigue backgrounds with vibrant, neon-esque accents and glassmorphism.
colors:
  # Backgrounds & Surfaces (The Canvas)
  background: '#002b36'          # Deep solarized dark base (App background)
  surface: '#073642'             # Elevated surface (Cards, Modals, TopBar)
  surface-container: '#00212b'   # Depressed/Inset surfaces (Inputs, Dropdowns)
  
  # Text & Content
  text-high: '#ffffff'           # Pure white for high-emphasis (Titles)
  text-base: '#eee8d5'           # Off-white for body reading comfort
  text-muted: '#93a1a1'          # Muted teal-grey for subtitles, metadata
  
  # Accents (The "Neon/Prismatic" layer)
  primary: '#00A3F5'             # Cyan/Blue - Main actions, Active states
  secondary: '#53EAAA'           # Emerald/Mint - Completed, Library active tab
  tertiary: '#F848A1'            # Magenta/Pink - Accents, Dropped status
  warning: '#FEA800'             # Amber - Paused, Ratings (Stars)
  error: '#ff716c'               # Coral/Red - Destructive actions, lowest ratings
  
  # Borders & Dividers
  border-subtle: 'rgba(255, 255, 255, 0.05)' # 5% white for structural borders
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
* **`.prismatic-text`**: Uses `bg-gradient-to-r from-[#00A3F5] to-[#53EAAA] bg-clip-text text-transparent`.
    * *Usage:* Used for the main Logo ("Grabbe") and high-impact greeting headlines.
* **`.glass-panel`**: `background: rgba(0, 43, 54, 0.6); backdrop-filter: blur(20px);`
    * *Usage:* Used for sticky headers, modal overlays, and floating badges over images.

## 3. Typography Hierarchy
Powered entirely by **Bricolage Grotesque**, utilizing extreme font weights for contrast instead of size alone.

* **Display/Hero:** `text-5xl` to `text-6xl`, `font-extrabold` (800) or `font-black` (900), `tracking-tighter`.
* **Section Headers:** `text-2xl`, `font-bold`.
* **Body:** `text-sm` or `text-base`, `font-normal` or `font-medium`, `text-on-surface-variant` (`#93a1a1`).
* **Eyebrows/Labels:** `text-[10px]` or `text-xs`, `uppercase`, `tracking-[0.2em]` (widest), `font-bold`. *Crucial for metadata (e.g., "IMDB", "DIRECTOR").*

## 4. Component Architecture

### Media Cards (Grid Items)
* **Container:** Aspect ratio `2/3`, `rounded-lg`, `overflow-hidden`.
* **Interactive States:** `transition-all duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]`. On hover: `scale-[1.05]` and `.primary-glow-hover`.
* **Border:** Selected/Status cards use a `border-2` mapping to their status color (e.g., `border-[#00A3F5]`).
* **Badges:** Floating top-left, `backdrop-blur-md` with 15% opacity background of the accent color and solid text.

### Buttons & Controls
* **Primary Button:** Solid accent color (e.g., `bg-[#00A3F5]`), `rounded-lg`, bold text. On active/click, must use `active:scale-95` for tactile feedback.
* **Icon Buttons (FABs/Nav):** Hover state should trigger a subtle translation or scale (`hover:scale-110`, `active:scale-95`). Icons use Google Material Symbols Outlined.
* **Inputs/Selects:** `bg-surface-container` (`#00212b`), `border-none`, `focus:ring-2 focus:ring-primary`. No harsh borders, just pure colored rings on focus.

### Modals & Dialogs
* **Backdrop:** `bg-black/60` (or `40%`) combined with `backdrop-blur-xl`.
* **Container:** `w-[400px]` (or fluid), `bg-[#073642]`, `.bloom-shadow`, `rounded-[12px]`.
* **Animation:** `animate-in fade-in zoom-in duration-300` for smooth entrance.

## 5. Layout Patterns
* **Sidebar Navigation:** Fixed left, `w-[260px]`. Navigation links use `flex`, `gap-3`, `px-4`, `py-3`, with `hover:scale-[1.02]` and `active:scale-95`.
* **Bento Grid:** Used in Dashboards. Mixes `col-span-12 md:col-span-8` (large featured items) with `col-span-4` (smaller stat boxes). Always backed by `bg-surface-container` and `.bloom-shadow`.