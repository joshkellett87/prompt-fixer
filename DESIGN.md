---
name: PromptFixer
description: An editorial workbench for turning vague ideas into high-performance AI prompts.
colors:
  oxblood: "#9e2424"
  oxblood-dark-mode: "#b41d1d"
  desk: "#f2ece6"
  paper: "#fdfaf6"
  tray: "#e7ddd2"
  ink: "#1a1a1a"
  ink-muted: "#57534e"
  border-warm: "#f5e8d2"
  gold-surface: "#fef3c7"
  gold-surface-alt: "#fdf2d6"
  gold-ink: "#805500"
  destructive: "#991b1b"
  desk-dark: "#1c1917"
  paper-dark: "#292524"
  tray-dark: "#171412"
  ink-dark: "#f5f5f4"
  ink-muted-dark: "#d6d3d1"
  border-warm-dark: "#44403c"
typography:
  display:
    fontFamily: "Libre Baskerville, Georgia, serif"
    fontSize: "1.875rem"
    fontWeight: 500
    lineHeight: 1.15
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Libre Baskerville, Georgia, serif"
    fontSize: "1.125rem"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  body:
    fontFamily: "ui-sans-serif, system-ui, -apple-system, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "normal"
  label:
    fontFamily: "IBM Plex Mono, ui-monospace, monospace"
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
  panel: "1.25rem"
  full: "9999px"
spacing:
  xs: "0.375rem"
  sm: "0.5rem"
  md: "1rem"
  lg: "1.5rem"
  xl: "2rem"
components:
  button-primary:
    backgroundColor: "{colors.oxblood}"
    textColor: "{colors.paper}"
    rounded: "{rounded.md}"
    padding: "0.5rem 2rem"
    height: "2.75rem"
    typography: "{typography.label}"
  button-primary-hover:
    backgroundColor: "{colors.oxblood}"
    textColor: "{colors.paper}"
  button-outline:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0.5rem 0.75rem"
    height: "2.25rem"
  chip:
    backgroundColor: "{colors.tray}"
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.full}"
    padding: "0.375rem 0.75rem"
  card-sheet:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "1.5rem"
  card-tray:
    backgroundColor: "{colors.tray}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
    padding: "1.5rem"
  input-textarea:
    backgroundColor: "{colors.paper}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "0.5rem 0.75rem"
  output-block:
    backgroundColor: "{colors.tray}"
    textColor: "{colors.ink}"
    typography: "{typography.output}"
    rounded: "{rounded.lg}"
    padding: "1.5rem"
  text-control:
    backgroundColor: "{colors.desk}"
    textColor: "{colors.ink-muted}"
    typography: "{typography.label}"
    padding: "0.5rem 0"
---

# Design System: PromptFixer

## Overview

**Creative North Star: "The Editorial Workbench"**

PromptFixer looks and feels like a craftsman's desk. The surface is warm paper, not sterile white. Headlines are set in a serif that reads like a masthead — the voice of someone who knows the craft. The actual work — the prompt that gets built — is rendered in monospace, the way a writer sees their own text on the page or a developer sees their code. The interface is the demonstration: it produces clarity and precision, so it must itself be clear and precise. Every element earns its place; nothing is decorative for its own sake.

This system explicitly rejects four things. It is **not generic AI SaaS** — no purple/blue gradients, no glassmorphism, no sparkle "magic" iconography, no hero-metric templates. It is **not a cluttered dev tool** — the primary flow is one input and one confident result, never a wall of competing controls. It is **not a toy chatbot** — no bubbly chat UI, no emoji-heavy copy, no gamification. And it is **not corporate-sterile** — no cold enterprise blue, no stock-photo neutrality. Warmth and craft over shine; substance over gloss.

Density is calm and generous. Complexity (framework details, refinement questions) is present but held back until it earns attention — proportional interface. Authority comes from focus and restraint, not from features on display.

**Key Characteristics:**
- A warm desk (`#f2ece6`) with lighter paper sheets on it (`#fdfaf6`) — never a cold white, and never a flat single ground
- Serif for authority (headlines/titles), sans for reading (UI/body), mono for the work and for controls
- Oxblood as a rare, deliberate accent — the maker's mark
- Physical depth: a recessed tray for input, a lifted sheet for output, warm-tinted shadows throughout
- A fixed paper-grain layer over everything, so flat fills never read as sterile vector
- One confident primary action per view, live at rest rather than greyed out

## Colors

A warm, low-chroma neutral field anchored by a single deep oxblood accent, with muted gold as a quiet secondary. The palette is restrained: the accent's rarity is its power. Every value is authored as HSL custom properties in `client/src/index.css` with a full dark-theme counterpart.

### Primary
- **Oxblood** (`hsl(0 63% 38%)`): The maker's mark. The primary action button, focus rings, the `w-1` accent bars beside section labels, and the step numerals. When oxblood appears, it means "this is the important thing." In dark mode it brightens to **Oxblood (Dark)** (`hsl(0 72% 41%)`) to hold contrast as a *fill* on the near-black ground.

### Secondary
- **Muted Gold Surface** (`#fef3c7` / `#fdf2d6`): Soft amber backgrounds for hover states on chips and ghost controls. Never loud — a warm wash, not a signal.
- **Gold Ink** (`#805500`): Text on gold surfaces where readable contrast is needed.

### Neutral

The three-surface stack is the core of the system, and the order matters:

- **Desk** (`#f2ece6`, `hsl(30 20% 94%)`): The page ground. The deepest of the three light surfaces — everything else sits *on* it. Dark mode: **Desk (Dark)** (`#1c1917`).
- **Paper** (`#fdfaf6`, `hsl(32 40% 98%)`): Card and sheet surfaces, and the input field itself. Lighter than the desk, so cards read as physical objects rather than invisible outlines. Dark mode: **Paper (Dark)** (`#292524`).
- **Tray** (`#e7ddd2`, `hsl(30 22% 88%)`): The recessed working surface — the input panel and the output block sit on it. A perceptible step *below* the desk (~15 lightness values, not 2–3), so it genuinely reads as recessed. Dark mode: **Tray (Dark)** (`#171412`), which inverts the relationship correctly by going darker than the dark desk.
- **Ink** (`#1a1a1a`): Primary text. Near-black, warm. Dark mode: **Ink (Dark)** (`#f5f5f4`).
- **Ink Muted** (`#57534e`, `hsl(24 10% 34%)`): Secondary text, labels, chip text, descriptions. Dark mode: `#d6d3d1`. **Contrast-critical — verified 5.55:1 on the tray; re-verify if either value moves.**
- **Border Warm** (`#f5e8d2`): The default 1px border and input stroke — a warm sand line, never a cold gray rule. Dark mode: `#44403c`.

### Named Rules

**The Maker's Mark Rule.** Oxblood appears on ≤10% of any given screen. It is the primary action, the focus ring, the section accent bar, and the step numerals — nothing else. Its scarcity is what makes it read as authority. The moment a second thing turns oxblood "for emphasis," both stop meaning anything.

**The Warm Ground Rule.** Every surface is warm-tinted, including shadows (see Elevation & Depth). Borders are warm sand, not gray. There is no cold gray and no pure white anywhere in the light theme — a hardcoded `bg-white` is always a bug.

**The Three-Surface Rule.** Desk below, paper above, tray recessed. Never render a card in the same value as the page, and never let the tray sit within a few percent of the desk — if a recessed panel dissolves into the background, the step is too small.

## Typography

**Display Font:** Libre Baskerville (with Georgia, serif) — self-hosted, weight 400 only
**Body Font:** System sans stack (ui-sans-serif, system-ui, -apple-system…) — native, no re-hosting
**Label/Mono Font:** IBM Plex Mono (with ui-monospace) — self-hosted, weights 400 and 600

Only the three faces the interface actually requests are declared. The 400 serif and 400 mono are preloaded in `index.html`; mono 600 is not, because it only appears below the fold.

**Character:** A deliberate three-voice system on a genuine contrast axis (serif + humanist sans + mono), never two-of-a-kind. Serif carries authority and craft; the system sans disappears into readable UI; monospace signals "this is the work." The pairing is the brand: masthead, page, and manuscript.

### Hierarchy
- **Display** (Libre Baskerville, 500, 1.875rem / `text-3xl`, 1.15, -0.02em): The page H1. Steps down to `text-2xl` below `sm` so the header lockup survives a 320px viewport.
- **Title** (Libre Baskerville, 500, 1.125rem / `text-lg`, -0.01em): Card and section headings. Renders as `<h2>` — directly under the page `<h1>`, never skipping a level.
- **Body** (system sans, 400, 0.875rem / `text-sm`, 1.6): UI text, descriptions, instructions. Cap prose at 65–75ch.
- **Label** (IBM Plex Mono, 600, 0.75rem / `text-xs`, +0.025em, UPPERCASE): Framework names and section markers, paired with a `w-1` oxblood bar. The one sanctioned home for uppercase tracking — a functional marker, not a decorative eyebrow.
- **Output** (IBM Plex Mono, 400, 0.875rem / `text-sm`, 1.625): The generated prompt. `whitespace-pre-wrap` on a recessed tray block. This is the payload — the reason the tool exists.

Weight 500 on serif is matched from the 400 face by the browser; there is no 500 file, and none is needed.

### Named Rules

**The Three-Voice Rule.** Serif for authority, sans for reading, mono for the work. Never blur the roles: a heading is never mono, the prompt output is never sans.

**The Mono Chrome Rule.** Monospace extends past the output to the *instrument* layer — button labels, step numerals, key hints, and the small text controls. Mono here is machine-labelling, not a costume for "technical." Prose never takes it.

## Layout

A twelve-column grid at `lg` and above (1024px), collapsing to a single column below. The input occupies columns 1–5 and the result columns 6–12; the result spans both grid rows so the history region can sit directly beneath the input rather than being pushed down the page by the taller column.

Placement is explicit (`lg:col-start-*` / `lg:row-start-*`) rather than achieved by nesting, because nesting made it impossible to reorder regions independently at small sizes. Visual order and DOM order match at every breakpoint: idea → result → history.

The page is capped at `max-w-7xl` and centred, with `p-4` padding rising to `md:p-8`. The input column is sticky (`lg:sticky lg:top-8`) so it stays available while a long result scrolls.

**Breakpoints in use:** `sm` (640px), `md` (768px), `lg` (1024px), plus a `touch` variant defined as `(pointer: coarse)`. Screen width is not used as a proxy for input method — a wide laptop can have a touchscreen and a narrow tablet can have a trackpad.

**Spacing rhythm:** an 8px base. Tight within groups (`gap-2`/`gap-3`), generous between them (`gap-6`/`gap-8`), with more space above a heading than below it.

### Named Rules

**The Reflow Rule.** The layout must produce no horizontal scrolling at 320px and no clipped controls at 200% text zoom. The header is the usual casualty — the mark and wordmark step down below `sm` specifically to hold this.

**The Pointer Rule.** Touch sizing keys off `(pointer: coarse)`, never off viewport width. Every interactive target clears 24×24 CSS px on any pointer, and the icon-only ones reach 44×44 on touch. Grow the hit box with padding and cancel it with an equal negative margin so nothing shifts.

## Elevation & Depth

Physical, not decorative — and the whole shadow scale is re-tinted so nothing casts a neutral-black shadow onto warm paper. `--shadow-tint` is `hsl(24 30% 22%)` in light and `hsl(24 40% 3%)` in dark.

Depth carries meaning here. The input is a **recessed tray**: a full tray fill plus an inset shadow, as if hollowed into the desk. The output is a **lifted sheet**: paper fill with a soft, low, warm-tinted drop shadow, as if resting on top. Two panels that would otherwise read as identical boxes are told apart by physics rather than by borders or colour.

Over everything sits a single fixed, non-interactive **paper-grain layer** — SVG fractal noise at 3.5% opacity in light and 5% in dark — which keeps the flat fills from reading as sterile vector.

### Shadow Vocabulary
- **`sm`** (`0 1px 2px hsl(var(--shadow-tint) / 0.05)`): Chips, history items, the logo tile. Just enough to lift off the ground.
- **`md`** (`0 1px 2px / 0.06`, `0 6px 16px -6px / 0.12`): The primary action at rest.
- **`lg`** (`0 2px 4px / 0.07`, `0 12px 28px -10px / 0.16`): The primary action on hover.
- **`sheet`** (`0 1px 1px / 0.04`, `0 10px 30px -14px / 0.18`): The output panel. A single low, consistent light source from above.
- **`inner`** (`inset 0 1px 3px / 0.07`): Recessed surfaces. Light from above means the top edge is shaded.

### Named Rules

**The Warm Shadow Rule.** No shadow is black. Every elevation step is tinted with `--shadow-tint`, because a neutral shadow on warm paper reads as dirt.

**The Tray-and-Sheet Rule.** Input surfaces are recessed (tray fill + `shadow-inner`); result surfaces are lifted (paper fill + `shadow-sheet`). Never give both panels the same treatment — the elevation *is* the hierarchy.

## Shapes

Two radius registers, deliberately distinct. Containers get a softer corner than the elements nested inside them: panels use `rounded-panel` (1.25rem, derived as `--radius × 2.5`), while controls and blocks inside them use `rounded-lg` (0.5rem) or `rounded-md` (0.375rem). Chips are fully rounded (`rounded-full`) — the only pill shape in the system.

Borders are 1px, warm sand, and uniform. Where an accent stripe is wanted, it is a `w-1` bar *element* with `self-stretch` and a rounded cap, never a thick `border-left`.

Icons come from Lucide at a consistent stroke, imported per-icon, sized 10–16px inline with text and 12px in dense controls. No emoji or Unicode glyphs stand in for icons.

## Components

### Buttons
- **Shape:** `rounded-md` (0.375rem). Label in mono, `font-medium`, `tracking-tight`.
- **Primary:** Oxblood ground, paper text, `shadow-md` at rest lifting to `shadow-lg` on hover, `active:translate-y-px` and `active:shadow-sm` for a physical press. Sizes: `default` h-10, `sm` h-9, `lg` h-11 px-8.
- **Focus:** 2px oxblood ring with a 2px offset; outline removed. No glow.
- **Outline:** 1px warm border on paper, `shadow-sm`, hovering to the gold accent surface with an oxblood-tinted border.
- **Disabled:** `opacity-50` and `pointer-events-none` — but see the Live Control Rule below.

### Chips (example prompts)
- **Style:** Pill (`rounded-full`), tray background, warm border, `text-xs` ink-muted, `shadow-sm`, padding `0.375rem 0.75rem`. Sans, not mono — mono is ~15% wider and pushes them onto a third row.
- **Behavior:** Positioned absolutely *inside* the input so showing and hiding never shifts surrounding layout. Fade and scale in with `chip-in` (200ms ease-out), out with `chip-out` (150ms ease-in), as the input focuses. Hidden below `sm`, where they would overlap the placeholder.
- **State:** Action chips (click to apply), never filter toggles.

### Cards / Containers
- **Corner:** `rounded-panel` (1.25rem).
- **Tray variant:** tray fill, `border-border/80`, `shadow-inner`. The input panel.
- **Sheet variant:** paper fill, `border-border/60`, `shadow-sheet`. The result panel.
- **Internal Padding:** 1.5rem (`p-6`), rising to `sm:p-8` in the result body.

### Inputs / Fields
- **Style:** Paper background, 1px warm-sand border, `rounded-lg`, `text-sm`, `leading-relaxed`. The main textarea is `min-h-[260px] max-h-[500px] resize-y`.
- **Focus:** 2px oxblood ring, 2px offset.
- **Labelling:** every field is named by a visible heading or its own question via `aria-labelledby`. A placeholder is a hint, never a label.
- **Placeholder:** ink-muted — **must still hit 4.5:1**.

### Text Controls
Small mono controls that act on content — `start over`, `undo`, `N questions below`, `try again`. Mono `text-xs`, ink-muted, with a dotted 1px underline on an inner span so the rule stays tight to the text while the button's padding grows the hit area. Each carries a Lucide icon, which is what distinguishes them from the plain-text theme switch (a preference, not a content action).

### Disclosures
Native `<details>`/`<summary>`, `list-none`, with a chevron rotated 90° on `group-open`. Used for the worked-example remainder and the six-framework reference. Progressive disclosure is native HTML here — no JS state.

### The Output Block (signature component)
The generated prompt renders in IBM Plex Mono, `whitespace-pre-wrap`, `leading-relaxed`, on a recessed tray panel at 30% with a warm border, `rounded-lg`, `p-6`. This is the manuscript — the payload of the whole tool. While generating it shows skeleton bars shaped like the mono block they replace, with staggered pulse delays, so the layout doesn't jump when real text lands.

### Framework Attribution (signature component)
Beneath the output: a `w-1` oxblood bar, the framework name in mono uppercase, its expansion, and its use case. Framework transparency is half the product's positioning, so it gets the full section-label treatment rather than a grey footnote — and it must never display a stale attribution from a previous generation.

### Section Labels
A step numeral (`01` / `02` / `03`) in oxblood mono `text-xs`, or a `w-1` oxblood bar, preceding a serif title. The numerals carry real sequence information (idea → result → refine), which is what earns them their place.

### Toast (error)
Fixed bottom-left on desktop — near the action that caused it, clear of the result — and full-width on phones. Paper fill, 1px warm border, `shadow-xl`, with a `w-1` destructive bar as the accent. Always carries a dismiss control, and a retry action when the failure is retryable.

### Named Rules

**The Live Control Rule.** The primary control is live at rest. A one-action tool never opens on a greyed-out button — pressing it with nothing to act on moves the cursor to the work and says why. `disabled` is reserved for an action genuinely in flight.

**The Invisible Infrastructure Rule.** Work that exists for the product's benefit rather than the visitor's — the bot check, a token refresh, a warm-up — gets no UI state of its own. Absorb it into the state they asked for. Pressing Build with an unfinished Turnstile handshake shows `Building…` and waits; it does not announce a check the visitor never asked about, and it does not flash one at someone reading their result when the token re-arms. **Always cap an absorbed wait** — here at 12s, after which it surfaces as a real error with a retry. An absorbed wait with no ceiling is a progress indicator that lies.

## Do's and Don'ts

### Do:
- **Do** keep oxblood rare — primary action, focus ring, accent bar, step numerals only (the Maker's Mark Rule).
- **Do** keep every surface, border, and shadow warm-tinted; there is no cold gray, no pure white, and no black shadow.
- **Do** preserve the three-surface stack: desk below, paper above, tray recessed.
- **Do** render the prompt output in IBM Plex Mono on the recessed tray block — the work looks like work.
- **Do** hold serif for authority and sans for reading; mono covers the work *and* the instrument chrome.
- **Do** verify ink-muted and placeholder text hit ≥4.5:1 — the warm off-white ground is a known contrast trap.
- **Do** pair any oxblood *text* with a `dark:` fallback. Measured: oxblood-dark (#b91c1c) reaches only 2.5:1 on the dark card and 2.7:1 on the dark tray — it fails AA as type. It stays legible as a fill (button, `w-1` bar, focus ring); as text it needs `dark:text-foreground` or `dark:text-muted-foreground`.
- **Do** keep the primary control **live at rest**. A single-action tool should not open on a greyed-out button: an empty press moves the cursor to the work and says why. Reserve `disabled` for a genuine in-flight action.
- **Do** absorb infrastructure waits into the work the visitor asked for, and cap them (the Invisible Infrastructure Rule).
- **Do** size touch targets from `(pointer: coarse)`, and grow hit areas with padding cancelled by an equal negative margin so nothing shifts.
- **Do** give animation a `prefers-reduced-motion` fallback — with a deliberate exception for the loading spinner, which is functional feedback rather than decoration.
- **Do** keep the paper-grain layer over every surface.

### Don't:
- **Don't** use purple/blue gradients, glassmorphism, sparkle/"magic" icons, or hero-metric templates — this is not generic AI SaaS.
- **Don't** crowd the view with panels and controls — one input, one confident result.
- **Don't** add bubbly chat bubbles, emoji-heavy copy, or gamified flourishes.
- **Don't** introduce cold enterprise blue or stock-photo sterility.
- **Don't** hardcode a colour. `bg-white` on the logo tile shipped for months and burned a hole in the dark theme; every value comes from a token.
- **Don't** turn a second element oxblood "for emphasis."
- **Don't** use `border-left`/`border-right` >1px as a colored accent stripe. Use the `w-1` bar element.
- **Don't** use gradient text anywhere. Emphasis is weight and size in a single solid colour.
- **Don't** let a heading render in mono or the prompt output render in sans.
- **Don't** invent a type step. If a size isn't on the ramp, either use the nearest step or add it here first.
- **Don't** label a control with a placeholder alone, and don't ship an icon-only button without an accessible name.
