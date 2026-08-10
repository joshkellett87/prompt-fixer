# PromptFixer

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Release](https://img.shields.io/badge/release-v1.2.0-green.svg)
![Tech Stack](https://img.shields.io/badge/stack-React_Express_Gemini-orange.svg)

> **Transform vague ideas into high-performance AI prompts.**

A production-ready prompt optimization tool that automatically structures rough ideas into clear, effective prompts using proven prompt engineering frameworks. Novice-first, portfolio-grade, live at [promptfixer.co](https://promptfixer.co).

🔗 **[Live Demo](https://promptfixer.co)**

---

## Current Release — v1.2 (Security Hardening)

**v1.2.0** hardens deploy, API, and infrastructure. No user-facing feature changes — same prompt optimization experience, safer under the hood.

| Area | What changed |
| :--- | :--- |
| **Deploy** | Deploy token scrubbed from `.git/config` after every clone/fetch; guaranteed via an EXIT trap even if deploy fails |
| **API cost** | `max_tokens` capped at 10,000 (was 100,000) |
| **Rate limiting** | Proxy-aware per-IP limits — nginx forwards real client IP, Express trusts loopback proxy |
| **Dependencies** | `npm audit` clean (15 vulnerabilities patched) |
| **Resilience** | OpenRouter (30s) and Turnstile (10s) upstream timeouts → 504 instead of hanging |
| **Logging** | Upstream errors log status + provider code only — never full response bodies |
| **HTTPS** | nginx 80→443 redirect, TLS, HSTS |

**Rollback:** `v1.1.1` (Phase 1 shipped, immediately before security hardening).

**Next:** **v2.0** will add Phase 2 — prompt-type awareness (auto-detect chat / system / agents.md / image / video with an editable type pill).

---

## Why This Matters

Most people struggle to write effective AI prompts. The difference between "write a blog post about coffee" and a well-structured prompt with clear role definition, audience context, and success criteria can be **dramatic** in output quality.

> **The problem:** Prompt engineering frameworks are powerful, but knowing which to use and how to apply them requires expertise most users don't have.

> **The solution:** PromptFixer uses intelligent framework selection to automatically choose and apply the right structure for your task — no prompt engineering knowledge required.

---

## How It Works

### 1. Intelligent Framework Selection

Instead of asking users to choose a framework, PromptFixer analyzes your request and automatically selects the best approach from 6 specialized frameworks:

| Framework | Meaning | Best For |
| :--- | :--- | :--- |
| **RACE** | Role, Action, Context, Expectation | Quick, simple requests under 20 words with a single action |
| **MINIMAL** | Light Touch, Preserve Intent | Already well-structured prompts that need light polish only |
| **RISEN** | Role, Instruction, Structure, Examples, Nuance | Technical tasks, coding, and data analysis |
| **ARIA** | Angle, Research, Investigation, Assessment | Analysis, research, comparisons, and decision-making |
| **COVAR** | Context, Objective, Voice, Audience, Response | Content with explicit audience targeting — marketing, sales, persuasive messaging |
| **CRAFT** | Context, Role, Action, Format, Target | General-purpose tasks — creative writing, emails, miscellaneous requests |

### 2. Proportionality Principle

The tool matches output complexity to input complexity. A 5-word request gets a concise enhancement, not a 500-word prompt. This prevents over-engineering while ensuring every prompt gets appropriate structure.

### 3. Context Preservation

The optimization process is **additive, never subtractive**. Every detail you provide — names, constraints, format requirements — is preserved and enhanced, never summarized away.

### 4. Refinement Loop

After generation, you may receive 0–5 targeted questions to fill any gaps. If your prompt is already complete, no questions are asked. Answer what's relevant, ignore the rest. Each refinement makes the prompt more precise.

---

## Key Features

### Prompt intelligence
- ✅ **Zero prompt engineering knowledge required**
- ✅ **Intelligent framework selection** (transparent — you see which was used)
- ✅ **Edge case handling** (graceful prompts for vague/invalid input)
- ✅ **Multi-intent support** (handles hybrid requests intelligently)
- ✅ **Context preservation** (no detail loss)
- ✅ **Proportional output** (no over-engineering)
- ✅ **Interactive refinement** (0–5 optional follow-up questions)
- ✅ **Anti-hallucination safeguards** (for factual/research prompts)

### UI & experience (Phase 1)
- ✅ **Two-column tool layout** with a slim micro-hero value-prop line
- ✅ **Dark mode toggle** — respects `prefers-color-scheme`, persists choice
- ✅ **Example prompt chips** — curated starters, unobtrusive (hidden on mobile / when input has text or focus)
- ✅ **Teaching empty state** — shows a rough-idea → structured-prompt example before first use
- ✅ **Session history** — last 5 prompts saved in `localStorage`
- ✅ **Accessibility** — keyboard navigation, focus management, screen-reader-friendly output region
- ✅ **Responsive** — stacked layout on mobile with auto-scroll to results

### Models & cost
- ✅ **Default:** `openai/gpt-5.6-luna` via OpenRouter
- ✅ **Power tier (hidden):** `?mode=power` → `openai/gpt-5.6-terra`
- ✅ **Thinking-level scaling** — reasoning effort proportional to input complexity (no extra LLM call)
- ✅ **Automatic prompt caching** — stable system prompt cached on an identical prefix (~3.2k of 3.5k tokens)
- ✅ **Model choice is measured, not guessed** — both tiers selected by `npm run eval` ([evals/](evals/README.md))
- ✅ **`max_price` guardrail** — loose per-request routing ceiling, not a spend cap

---

## Technical Architecture

```
Browser (React + Vite)
    │
    ▼
nginx (HTTPS, HSTS, real-IP forwarding)
    │
    ▼
Express (rate limiting, Turnstile, input validation)
    │
    ▼
OpenRouter API → Google Gemini
```

| Layer | Stack |
| :--- | :--- |
| **Client** | React 18, Vite 7, Tailwind CSS, Lucide icons |
| **Server** | Express 4, `express-rate-limit`, compression |
| **AI** | OpenRouter → GPT-5.6 Luna (default) / GPT-5.6 Terra (power) |
| **Security** | Cloudflare Turnstile, CSP + security headers, allow-listed API input |
| **Deploy** | GitHub Actions → DigitalOcean droplet, PM2, nginx reverse proxy |

### Prompt engineering strategy
- **Conditional role definitions** — only added when helpful, not forced
- **Chain-of-thought scaffolding** — for complex tasks only (reasoning models do CoT natively)
- **Success criteria** — for multi-step tasks only
- **Few-shot learning guidance** — RISEN framework for technical tasks
- **Proportional output** — simple input → simple output
- **Tone preservation** — respects the user's style choices

### Framework selection logic

The system checks these rules in order and uses the **first match**:

| Priority | Criteria | Framework |
| :--- | :--- | :--- |
| 0 | Invalid/vague input (under 3 words, gibberish, no clear intent) | **Request clarification** |
| 1 | Short + single action (< 20 words with verb + object) | **RACE** |
| 2 | Already structured (has role, formatting, constraints) | **MINIMAL** |
| 3 | Technical / Code / Data / APIs / System Design | **RISEN** |
| 4 | Analysis / Research / Comparison / Evaluation | **ARIA** |
| 5 | Explicit audience targeting | **COVAR** |
| 6 | Everything else (general tasks, creative writing, emails) | **CRAFT** |

**Multi-intent handling:** When a request spans categories (e.g., "Write Python code to analyze sales data"), the system identifies the primary goal and applies that framework while incorporating relevant elements from secondary frameworks.

### API safeguards

| Control | Detail |
| :--- | :--- |
| **Input allow-list** | Only `messages`, `temperature`, `max_tokens`, `top_p`, `frequency_penalty`, `presence_penalty`, `usePowerModel` accepted |
| **`max_tokens` cap** | 1–10,000 |
| **Payload size** | ~100 KB max on `messages` |
| **Rate limits** | 100 requests / 15 min per IP; 20 Turnstile attempts / 15 min per IP |
| **Upstream timeouts** | OpenRouter 30s, Turnstile 10s |
| **Error responses** | Generic messages to clients; no upstream internals leaked |

---

## Security

v1.2 added defense-in-depth across deploy, server, and infrastructure:

- **Deploy token hygiene** — `DEPLOY_TOKEN` used only for git transport, then scrubbed from `.git/config` (EXIT trap guarantees cleanup on failure)
- **Proxy-aware rate limiting** — `trust proxy: loopback` + nginx `X-Real-IP` / `X-Forwarded-For` so limits apply per real client, not per nginx socket
- **HTTPS enforcement** — HTTP→HTTPS redirect (literal canonical host), TLS 1.2/1.3, HSTS with `includeSubDomains`
- **Production headers** — CSP, `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`, `Permissions-Policy`
- **CORS** — locked to `https://promptfixer.co` in production
- **Turnstile** — server-side token verification on every `/api/generate` request
- **Dependency hygiene** — zero known vulnerabilities (`npm audit`)

---

## Development

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your API keys (see below)

# Run development server (Vite + Express concurrently)
npm run dev

# Run server tests (28 tests)
npm run test:server

# Build for production
npm run build

# Start production server locally
npm start
```

### Environment variables

See [`.env.example`](.env.example) for the full list.

| Variable | Required | Purpose |
| :--- | :--- | :--- |
| `OPENROUTER_API_KEY` | Yes | AI model inference via OpenRouter |
| `VITE_TURNSTILE_SITE_KEY` | Yes (prod) | Client-side Turnstile widget |
| `TURNSTILE_SECRET_KEY` | Yes (prod) | Server-side Turnstile verification |
| `PORT` | No | Server port (default `3001`) |
| `NODE_ENV` | No | `production` or `development` |
| `GIT_COMMIT_HASH` | No | Shown in `/api/health` (set by CI/CD) |

### Local development without Turnstile keys

Production gates the Build button behind Turnstile. For local dev, use Cloudflare's [test keys](https://developers.cloudflare.com/turnstile/troubleshooting/testing/) in `.env`:

```
VITE_TURNSTILE_SITE_KEY=1x00000000000000000000AA
TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA
```

Both `npm run dev` (Vite on `:5173` proxying `/api` → `:3001`) and `OPENROUTER_API_KEY` must be set for end-to-end testing.

### Hidden power mode

Append `?mode=power` to the URL to use the Gemini 3 Flash Preview model. Not exposed in the UI — for testing only.

---

## Deployment

Pushes to `main` trigger automatic deployment via GitHub Actions:

1. SSH into the DigitalOcean droplet
2. `git fetch` + `git reset --hard origin/main` (deploy token scrubbed after)
3. `npm ci` + `npm run build`
4. PM2 restart via `ecosystem.config.js`

**Infrastructure:** nginx terminates TLS and proxies to Express on `:3001`. Config lives in [`deploy/nginx.conf`](deploy/nginx.conf).

**Required GitHub secrets:** `DROPLET_IP`, `SSH_USER`, `SSH_PRIVATE_KEY`, `SSH_PASSPHRASE`, `DEPLOY_TOKEN`, `OPENROUTER_API_KEY`, `VITE_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`.

**Deploy checklist (after nginx config changes):**
- Confirm TLS certs exist at `/etc/letsencrypt/live/promptfixer.co/` before applying the nginx config
- Verify rate limiting keys on the real client IP in production

### Rollback

```bash
# On the droplet — immediate hotfix
cd /var/www/prompt-builder
git fetch --tags origin
git reset --hard v1.1.1
npm ci && VITE_TURNSTILE_SITE_KEY=$VITE_TURNSTILE_SITE_KEY npm run build
pm2 startOrRestart ecosystem.config.js --env production --update-env
```

For a durable rollback, revert the merge commit on `main` and push — the deploy workflow will redeploy automatically.

---

## Roadmap

| Version | Scope | Status |
| :--- | :--- | :--- |
| **v1.1** | Phase 1 — foundation & polish (UI redesign, model swap, dark mode, branding) | ✅ Shipped |
| **v1.2** | Security hardening (deploy, API, nginx, dependencies) | ✅ Shipped |
| **v2.0** | Phase 2 — prompt-type awareness (chat / system / agents.md / image / video) | Planned |
| — | Phase 3 — Grill-me mode (opt-in deep refinement, 10-question cap) | Planned |
| — | Phase 4 — Image & video prompt modes + target-tool selector | Planned |

---

## Use Cases

| Audience | Example | Framework |
| :--- | :--- | :--- |
| **Marketers** | Campaign briefs, ad copy, persona-driven content | COVAR |
| **Engineers** | Code generation prompts with few-shot examples | RISEN |
| **Researchers** | Analysis and comparison tasks | ARIA |
| **Content Creators** | Vague ideas → structured writing prompts | CRAFT |
| **Product Teams** | Feature specs and user story prompts | CRAFT |
| **Everyone** | Quick translations, summaries, definitions | RACE |

---

## Philosophy

Good prompting isn't about length — it's about **structure, clarity, and intent preservation**. PromptFixer embodies three core principles:

1. **Expertise should be embedded, not required** — users shouldn't need to learn frameworks; the tool should know them.
2. **Proportionality over perfection** — not every request needs verbose structure; match the effort to the complexity.
3. **Transparency builds trust** — show which framework was used; let users learn by seeing the patterns.

---

## Contributing

Contributions welcome. This project is open source to help improve AI interaction quality across the ecosystem.

---

## License

MIT License — feel free to use, modify, and distribute.

---

## Built By

[Josh Kellett](https://linkedin.com/in/joshkellett) · [GitHub](https://github.com/joshkellett87)
