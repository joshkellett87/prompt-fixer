# Product

## Register

product

## Platform

web

## Users

People who need better output from AI models but don't know prompt engineering — knowledge workers, marketers, developers, students, and creators typing a rough idea into a box. Their context: they have a task in mind ("write a blog post about coffee") and want a stronger prompt without learning frameworks. They arrive impatient, judge value in seconds, and want to paste a vague thought and get a structured, usable prompt back. A minority are power users who understand frameworks and want transparency into what the tool did.

The job to be done: turn a vague idea into a high-performance, ready-to-use AI prompt — fast, with no expertise required, and without losing any detail they provided.

## Product Purpose

PromptFixer transforms rough ideas into well-structured prompts by automatically selecting and applying the right prompt-engineering framework (RACE, MINIMAL, RISEN, ARIA, COVAR, CRAFT) for the task. It handles framework choice so the user doesn't have to, matches output complexity to input complexity (proportionality), preserves every detail additively, and offers an optional 0–5 question refinement loop to fill gaps.

Success looks like: a user pastes a vague request, receives a materially better prompt in one step, understands (if they care) which framework was applied, and copies it out with confidence. The tool earns trust by being fast, transparent, and never over-engineering a simple ask.

## Brand Personality

Expert and precise. The product should feel like a well-made instrument in the hands of someone who knows the craft — confident, editorial, quietly authoritative. Three words: **expert, precise, crafted**. The voice is direct and knowledgeable without being academic or preachy; it demonstrates prompt-engineering skill rather than lecturing about it (practice what you preach). Emotionally, users should feel capable and in control — the intimidation of "writing a good prompt" lifted, replaced by a sense that a professional did the structuring for them. The existing serif-display + monospace type and oxblood palette already signal this register; lean into that craftsman confidence, not generic tech-tool neutrality.

## Anti-references

- **Generic AI SaaS.** No purple/blue gradients, glassmorphism, hero-metric templates, sparkle/star "magic" iconography, or the default "AI startup" gloss. This tool is about substance, not shine.
- **Cluttered dev tool.** No dense, cramped panels or a wall of controls competing for attention. The primary flow is one input and one confident result.
- **Toy / playful chatbot.** No bubbly rounded chat UI, emoji-heavy copy, or gamified flourishes. Playfulness would undercut the sense of expertise.
- **Corporate / sterile.** No cold enterprise blue, stock-photo feel, or personality-free minimalism. Craft and warmth over sterility.

## Design Principles

1. **Practice what you preach.** The interface itself should be a demonstration of clarity and precision — the same qualities it produces in prompts. Sloppy UI undermines the pitch.
2. **Proportional interface.** Match interface weight to task weight. A simple input deserves a calm, uncluttered surface; complexity (framework details, refinement questions) reveals only when it earns its place.
3. **Transparent expertise.** Show the craft without demanding the user learn it. Surface which framework was applied and why, as optional depth — informative for power users, ignorable for everyone else.
4. **Confident restraint.** One primary action, one confident result. Resist adding controls, options, and decoration; the authority comes from focus, not from features on display.
5. **Preserve, never dilute.** Just as the tool is additive and never subtractive with user detail, the UI should never bury or lose what the user typed — their input stays present, respected, and editable throughout.

## Accessibility & Inclusion

Target WCAG 2.1 AA. Body text ≥4.5:1 contrast against its background (watch the warm off-white bg — muted grays must be verified, not assumed); large text ≥3:1. Full keyboard operability with a visible, non-color-only focus indicator. Respect `prefers-reduced-motion` for all animation (the chip-in/out and any result transitions need a crossfade or instant fallback). Don't rely on color alone to convey framework identity or state — pair with text/label. Dark mode is a first-class theme, not an afterthought; verify contrast in both.
