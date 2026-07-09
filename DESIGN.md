---
name: PromptFixer
description: An editorial workbench for turning vague ideas into high-performance AI prompts.
colors:
  oxblood: "#9b2c2c"
  oxblood-deep: "#7f1d1d"
  oxblood-dark-mode: "#b91c1c"
  paper: "#faf7f5"
  ink: "#1a1a1a"
  surface-muted: "#f0ebe8"
  ink-muted: "#57534e"
  border-warm: "#f5e8d2"
  gold-surface: "#fef3c7"
  gold-surface-alt: "#fdf2d6"
  gold-ink: "#805500"
  destructive: "#991b1b"
  paper-dark: "#1c1917"
  ink-dark: "#f5f5f4"
  surface-dark: "#292524"
typography:
  display:
    fontFamily: "Libre Baskerville, Georgia, serif"
    fontSize: "1.875rem"
    fontWeight: 500
    lineHeight: 1.15
    letterSpacing: "normal"
  title:
    fontFamily: "Libre Baskerville, Georgia, serif"
    fontSize: "1.125rem"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "normal"
  body:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  label:
    fontFamily: "ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "0.025em"
  output:
    fontFamily: "IBM Plex Mono, ui-monospace, monospace"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.625
    letterSpacing: "normal"
rounded:
  sm: "0.25rem"
  md: "0.375rem"
  lg: "0.5rem"
  full: "9999px"
spacing:
  xs: "0.375rem"
  sm: "0.5rem"
  md: "1rem"
  lg: "1.5rem"
components:
  button-primary:
    backgroundColor: "{colors.oxblood}"
    textColor: "{colors.paper}"
    rounded: "{rounded.md}"
    padding: "0.5rem 1rem"
    height: "2.5rem"
  button-primary-hover:
    backgroundColor: "{colors.oxblood-deep}"
    textColor: "{colors.paper}"
  button-outline:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0.5rem 1rem"
  chip:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.full}"
    padding: "0.375rem 0.75rem"
  card:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "1.5rem"
  input-textarea:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0.5rem 0.75rem"
  output-block:
    backgroundColor: "{colors.surface-muted}"
    textColor: "{colors.ink}"
    typography: "{typography.output}"
    rounded: "{rounded.lg}"
    padding: "1.5rem"
---

# Design System: PromptFixer

## 1. Overview

**Creative North Star: "The Editorial Workbench"**

PromptFixer looks and feels like a craftsman's desk. The surface is warm paper, not sterile white. Headlines are set in a serif that reads like a masthead — the voice of someone who knows the craft. The actual work — the prompt that gets built — is rendered in monospace, the way a writer sees their own text on the page or a developer sees their code. The interface is the demonstration: it produces clarity and precision, so it must itself be clear and precise. Every element earns its place; nothing is decorative for its own sake.

This system explicitly rejects four things. It is **not generic AI SaaS** — no purple/blue gradients, no glassmorphism, no sparkle "magic" iconography, no hero-metric templates. It is **not a cluttered dev tool** — the primary flow is one input and one confident result, never a wall of competing controls. It is **not a toy chatbot** — no bubbly chat UI, no emoji-heavy copy, no gamification. And it is **not corporate-sterile** — no cold enterprise blue, no stock-photo neutrality. Warmth and craft over shine; substance over gloss.

Density is calm and generous. Content sits in a single centered column with room to breathe. Complexity (framework details, refinement questions) is present but held back until it earns attention — proportional interface. Authority comes from focus and restraint, not from features on display.

**Key Characteristics:**
- Warm paper ground (#faf7f5), never a cold white
- Serif for authority (headlines/titles), sans for reading (UI/body), mono for the work (prompt output)
- Oxblood as a rare, deliberate accent — the maker's mark
- Flat surfaces with soft, state-driven lift; no decorative depth
- One confident primary action per view

## 2. Colors

A warm, low-chroma neutral field anchored by a single deep oxblood accent, with muted gold as a quiet secondary. The palette is restrained: the accent's rarity is its power.

### Primary
- **Oxblood** (`#9b2c2c`, `hsl(0 63% 38%)`): The maker's mark. Used sparingly and deliberately — the primary action button, focus rings, the small `w-1` accent bars beside section labels, active state. When oxblood appears, it means "this is the important thing." In dark mode it brightens to **Oxblood (Dark)** (`#b91c1c`) to hold contrast on the near-black ground.
- **Oxblood Deep** (`#7f1d1d`): The hover/pressed shade of the primary; also the accent-foreground text color on gold surfaces.

### Secondary
- **Muted Gold Surface** (`#fef3c7` / `#fdf2d6`): Soft amber backgrounds for accent chips, subtle highlights, and refinement-question surfaces. Never loud — a warm wash, not a signal.
- **Gold Ink** (`#805500`): Text color on gold surfaces where readable contrast is needed.

### Neutral
- **Paper** (`#faf7f5`, `hsl(30 15% 97%)`): The body and card ground. The warm off-white that defines the workbench. In dark mode: **Paper (Dark)** (`#1c1917`), a warm near-black.
- **Ink** (`#1a1a1a`): Primary text on paper. Near-black, warm. Dark mode inverts to **Ink (Dark)** (`#f5f5f4`).
- **Surface Muted** (`#f0ebe8`): Slightly recessed surfaces — the monospace output block sits on `surface-muted` at ~30% to separate the work from the chrome.
- **Ink Muted** (`#57534e`, `hsl(24 10% 34%)`): Secondary text, labels, chip text, descriptions. **Contrast-critical: verify ≥4.5:1 against paper before using at smaller sizes.**
- **Border Warm** (`#f5e8d2`): The default 1px border and input stroke — a warm sand line, never a cold gray rule.

### Named Rules
**The Maker's Mark Rule.** Oxblood appears on ≤10% of any given screen. It is the primary action, the focus ring, and the section accent bar — nothing else. Its scarcity is what makes it read as authority. The moment a second thing turns oxblood "for emphasis," both stop meaning anything.

**The Warm Ground Rule.** Every surface is warm-tinted. Borders are warm sand (#f5e8d2), not gray. There is no cold gray anywhere in the light theme. If a divider or surface reads as neutral-gray, it is wrong.

## 3. Typography

**Display Font:** Libre Baskerville (with Georgia, serif) — self-hosted, weights 400/700
**Body Font:** System sans stack (ui-sans-serif, system-ui, -apple-system…) — native, no re-hosting
**Label/Mono Font:** IBM Plex Mono (with ui-monospace) — self-hosted, weights 400/500/600

**Character:** A deliberate three-voice system on a genuine contrast axis (serif + humanist sans + mono), never two-of-a-kind. Serif carries authority and craft; the system sans disappears into readable UI; monospace signals "this is the work — the actual prompt." The pairing is the brand: masthead, page, and manuscript.

### Hierarchy
- **Display** (Libre Baskerville, 500, 1.875rem / `text-3xl`, ~1.15): The main H1 headline. Serif, medium weight. The masthead voice.
- **Title** (Libre Baskerville, 500, 1.125rem / `text-lg`, ~1.2): Card titles / section headings. Serif, sits beside a small icon.
- **Body** (system sans, 400, 0.875rem / `text-sm`, 1.6): UI text, descriptions, instructions. Cap prose at 65–75ch.
- **Label** (system sans, 600, 0.75rem / `text-xs`, +0.025em, UPPERCASE): Small section markers ("REFINEMENT", framework name), paired with a `w-1` oxblood bar or icon. This is the one place uppercase tracking is sanctioned — as a functional label, not a decorative eyebrow on every section.
- **Output** (IBM Plex Mono, 400, 0.875rem / `text-sm`, 1.625): The generated prompt itself. Monospace, `whitespace-pre-wrap`, on a recessed `surface-muted/30` block. This is the payload — the reason the tool exists.

### Named Rules
**The Three-Voice Rule.** Serif for authority, sans for reading, mono for the work. Never blur the roles: a heading is never mono, the prompt output is never sans. Each voice means something.

## 4. Elevation

Flat with soft lift. Surfaces are flat at rest on a warm ground; depth is restrained and appears mostly as a response to state, not as decoration. Cards carry a barely-there `shadow-sm`. The primary button is the one element allowed a slightly stronger resting shadow (`shadow-md`) that lifts on hover (`shadow-lg`) — because it is the one thing you're meant to press. There is no glassmorphism, no blur, no heavy drop-shadow anywhere.

### Shadow Vocabulary
- **Resting card** (`box-shadow: 0 1px 2px 0 rgb(0 0 0 / 0.05)` — Tailwind `shadow-sm`): Cards and chips. Just enough to separate from the ground.
- **Primary action** (`shadow-md` → `shadow-lg` on hover): The one deliberate lift. Signals pressability.

### Named Rules
**The Flat-By-Default Rule.** Surfaces are flat at rest. Shadow is a response to state (hover, the primary CTA), never ambient decoration. If a card has a shadow doing nothing but "looking nice," remove it. Depth here is functional or it isn't there.

## 5. Components

### Buttons
- **Shape:** Gently rounded (0.375rem / `rounded-md`).
- **Primary:** Oxblood ground (`#9b2c2c`), paper text, `shadow-md`, height 2.5rem, padding `0.5rem 1rem`. The single confident action per view.
- **Hover / Focus:** Background deepens to `oxblood/90` and shadow lifts to `shadow-lg`; `transition-all`. Focus-visible shows a 2px oxblood ring with a 2px offset.
- **Secondary / Outline / Ghost:** Outline is a 2px `oxblood/20` border on paper, hovering to a gold accent surface. Ghost is transparent, hovering to accent. Secondary uses the muted-gold surface.

### Chips (example prompts)
- **Style:** Pill-shaped (`rounded-full`), paper background, warm border, `text-xs` ink-muted text, `shadow-sm`. Padding `0.375rem 0.75rem`.
- **Behavior:** Live *inside* the input, absolutely positioned. They fade/scale in with `chip-in` (200ms ease-out) and out with `chip-out` (150ms ease-in) as the input focuses. Hover shifts to the gold accent surface.
- **State:** Action chips (click to apply an example), not filter toggles.

### Cards / Containers
- **Corner Style:** 0.5rem (`rounded-lg`).
- **Background:** Paper (`bg-card` = #faf7f5), matching the body ground — cards are defined by border + faint shadow, not a contrasting fill.
- **Shadow Strategy:** `shadow-sm` only (see Elevation).
- **Border:** 1px warm sand (`#f5e8d2`).
- **Internal Padding:** 1.5rem (`p-6`).

### Inputs / Fields
- **Style:** Paper background, 1px warm-sand border, `rounded-md`, `text-sm`. The main textarea has a generous min-height.
- **Focus:** 2px oxblood ring (`ring-ring`) with 2px offset; outline removed. No glow.
- **Placeholder:** `text-muted-foreground` — **must still hit 4.5:1**; do not let placeholder drop to a light decorative gray.
- **Disabled:** `opacity-50`, `cursor-not-allowed`.

### The Output Block (signature component)
The generated prompt renders in IBM Plex Mono, `whitespace-pre-wrap`, `leading-relaxed`, on a recessed `surface-muted/30` panel with a warm border and `rounded-lg` corners, `p-6`. This is the manuscript — the payload of the whole tool. While generating, it shows animated `bg-muted` skeleton bars (pulse), never a bare spinner-only void.

### Section Labels
Small uppercase sans label (`text-xs font-semibold uppercase tracking-wide`, ink-muted) preceded by a `w-1 h-4` oxblood bar or a small icon. The sanctioned home for uppercase tracking — as a functional marker, not a per-section eyebrow.

## 6. Do's and Don'ts

### Do:
- **Do** keep oxblood (#9b2c2c) rare — primary action, focus ring, accent bar only (the Maker's Mark Rule).
- **Do** keep every surface and border warm-tinted; borders are sand (#f5e8d2), never gray.
- **Do** render the prompt output in IBM Plex Mono on the recessed `surface-muted` block — the work looks like work.
- **Do** hold serif for authority (headlines/titles) and sans for reading; never cross the voices.
- **Do** verify `ink-muted` (#57534e) and placeholder text hit ≥4.5:1 on paper before shipping — the warm off-white ground is a known contrast trap.
- **Do** give animations a `prefers-reduced-motion` fallback (chip-in/out, skeleton pulse, spinners → crossfade or instant).
- **Do** keep surfaces flat at rest; reserve shadow for the primary CTA and hover states.

### Don't:
- **Don't** use purple/blue gradients, glassmorphism, sparkle/"magic" icons, or hero-metric templates — this is not generic AI SaaS.
- **Don't** crowd the view with panels and controls — this is not a cluttered dev tool; one input, one confident result.
- **Don't** add bubbly chat bubbles, emoji-heavy copy, or gamified flourishes — this is not a toy chatbot.
- **Don't** introduce cold enterprise blue or stock-photo sterility — this is not corporate software.
- **Don't** turn a second element oxblood "for emphasis" — it destroys the accent's meaning.
- **Don't** use `border-left`/`border-right` >1px as a colored accent stripe. Use the `w-1` bar element or a full border instead.
- **Don't** use gradient text (`background-clip: text`) anywhere. Emphasis is weight and size, in a single solid color.
- **Don't** let a heading render in mono or the prompt output render in sans — the three voices must stay distinct.
