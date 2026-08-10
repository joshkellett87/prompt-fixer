# Product

<!-- impeccable:product-schema 1 -->

## Register

product

## Platform

web

## Users

People who need better output from AI models but don't know prompt engineering — knowledge workers, marketers, developers, students, and creators typing a rough idea into a box. Their context: they have a task in mind ("write a blog post about coffee") and want a stronger prompt without learning frameworks. They arrive impatient, judge value in seconds, and want to paste a vague thought and get a structured, usable prompt back. A minority are power users who understand frameworks and want transparency into what the tool did.

The job to be done: turn a vague idea into a high-performance, ready-to-use AI prompt — fast, with no expertise required, and without losing any detail they provided.

A second audience carries equal weight: people evaluating the maker's craft — hiring managers, clients, peers. The product must genuinely serve its users *and* read as portfolio-grade work. Neither goal is subordinate to the other, and design decisions that serve only one at the cost of the other are wrong.

## Product Purpose

PromptFixer transforms rough ideas into well-structured prompts by automatically selecting and applying the right prompt-engineering framework (RACE, MINIMAL, RISEN, ARIA, COVAR, CRAFT) for the task. It handles framework choice so the user doesn't have to, matches output complexity to input complexity (proportionality), preserves every detail additively, and offers an optional 0–5 question refinement loop to fill gaps.

Success looks like: a user pastes a vague request, receives a materially better prompt in one step, understands (if they care) which framework was applied, and copies it out with confidence. The tool earns trust by being fast, transparent, and never over-engineering a simple ask.

## Positioning

Two claims a neighboring prompt tool could not truthfully copy:

1. **Automatic framework selection.** Six named prompt-engineering frameworks — RACE, MINIMAL, RISEN, ARIA, COVAR, CRAFT — and the tool picks. The user never chooses, never learns them, and can still see which was applied. Competitors either make you pick a framework or quietly run one generic template over everything.
2. **Proportionality plus additive preservation.** Output complexity is scaled to input complexity, and no detail the user supplied is ever summarized away. A five-word request gets a concise enhancement, not a 500-word prompt. Competitors inflate short inputs into bloat and drop specifics in the rewrite.

The position is the pair together. Transparency (showing which framework ran) supports both but is not the differentiator on its own.

## Operating Context

Single-page web app at [promptfixer.co](https://promptfixer.co). One primary flow: paste a rough idea → receive one optimized prompt → optionally answer up to five refinement questions → copy out and paste into whatever AI tool the user actually works in.

PromptFixer is never the last stop. The output is destined for another surface (ChatGPT, Claude, an API call, an `agents.md` file), so the copy-out moment is the real conversion, not time-on-site. Sessions are short, intent-driven, and often one-shot; there are no accounts, no saved history, and no login.

## Capabilities and Constraints

**Stack.** React 18 + Vite client, Express server, Tailwind CSS, deployed behind nginx (80→443 redirect, TLS, HSTS). Client entry `client/src/App.jsx`; API in `server/routes/api.js`. Dev via `npm run dev`.

**Inference.** Server-side calls to OpenRouter. Default tier `openai/gpt-5.6-luna`; a hidden `?mode=power` tier uses `openai/gpt-5.6-terra`. Both were selected by the eval harness in `evals/`, which scores candidates against the Proportionality Principle and the other rules in the system prompt rather than against output length. Reasoning effort is a deterministic pre-call heuristic (low → medium by input word count; high on power tier) — no extra LLM round-trip. `max_tokens` capped at 10,000 per request.

**Abuse and cost controls.** Cloudflare Turnstile bot gate (production only) plus per-IP rate limits: 100 API requests and 20 Turnstile verifications per 15 minutes. Per-request price ceilings guard against provider price changes. These are load-bearing, not decorative — the Turnstile gate must never be weakened to make development or testing easier.

**Constraints future work must respect.** No user accounts or persistence. Server never logs upstream response bodies. The whole experience must survive a cold first visit with no onboarding.

**Roadmap (stated, not yet built).** v2.0 adds prompt-type awareness — auto-detecting chat / system / `agents.md` / image / video with an editable type pill. Treat as planned, not shipped.

## Brand Commitments

**Name and domain.** PromptFixer, promptfixer.co. MIT licensed, public repository.

**Existing assets.** Logo and favicon set in `client/public/`; self-hosted Libre Baskerville and IBM Plex Mono woff2 subsets. The serif-display + monospace pairing and oxblood palette are established identity, recorded in DESIGN.md.

**Personality.** Expert and precise. The product should feel like a well-made instrument in the hands of someone who knows the craft — confident, editorial, quietly authoritative. Three words: **expert, precise, crafted**. The voice is direct and knowledgeable without being academic or preachy; it demonstrates prompt-engineering skill rather than lecturing about it. Emotionally, users should feel capable and in control — the intimidation of "writing a good prompt" lifted, replaced by a sense that a professional did the structuring for them. Lean into craftsman confidence, not generic tech-tool neutrality.

**Anti-references.**

- **Generic AI SaaS.** No purple/blue gradients, glassmorphism, hero-metric templates, sparkle/star "magic" iconography, or the default "AI startup" gloss. This tool is about substance, not shine.
- **Cluttered dev tool.** No dense, cramped panels or a wall of controls competing for attention. The primary flow is one input and one confident result.
- **Toy / playful chatbot.** No bubbly rounded chat UI, emoji-heavy copy, or gamified flourishes. Playfulness would undercut the sense of expertise.
- **Corporate / sterile.** No cold enterprise blue, stock-photo feel, or personality-free minimalism. Craft and warmth over sterility.

## Evidence on Hand

**What exists:** a working, publicly deployed product at promptfixer.co that can be demonstrated live, and a public MIT-licensed repository. The demonstration *is* the evidence — a real before/after on a real vague input is the strongest available proof.

**What does not exist, and must never be fabricated:** usage or traffic numbers, user counts, testimonials, quotes, customer or company logos, ratings, press mentions, funding, awards, or team size. No social proof of any kind is available. Future marketing or landing-page work must persuade through demonstration, not borrowed credibility.

## Product Principles

1. **Practice what you preach.** The interface itself should be a demonstration of clarity and precision — the same qualities it produces in prompts. Sloppy UI undermines the pitch.
2. **Proportional interface.** Match interface weight to task weight. A simple input deserves a calm, uncluttered surface; complexity (framework details, refinement questions) reveals only when it earns its place.
3. **Transparent expertise.** Show the craft without demanding the user learn it. Surface which framework was applied and why, as optional depth — informative for power users, ignorable for everyone else.
4. **Confident restraint.** One primary action, one confident result. Resist adding controls, options, and decoration; the authority comes from focus, not from features on display.
5. **Preserve, never dilute.** Just as the tool is additive and never subtractive with user detail, the UI should never bury or lose what the user typed — their input stays present, respected, and editable throughout.

## Accessibility & Inclusion

Target WCAG 2.1 AA. Body text ≥4.5:1 contrast against its background (watch the warm off-white bg — muted grays must be verified, not assumed); large text ≥3:1. Full keyboard operability with a visible, non-color-only focus indicator. Respect `prefers-reduced-motion` for all animation (the chip-in/out and any result transitions need a crossfade or instant fallback). Don't rely on color alone to convey framework identity or state — pair with text/label. Dark mode is a first-class theme, not an afterthought; verify contrast in both.
