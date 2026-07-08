# PromptFixer

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Tech Stack](https://img.shields.io/badge/stack-React_Express_Gemini-orange.svg)

> **Transform vague ideas into high-performance AI prompts.**

A professional prompt optimization tool that automatically structures your rough ideas into clear, effective prompts using proven prompt engineering frameworks.

🔗 **[Live Demo](https://promptfixer.co)**

---

## Why This Matters

Most people struggle to write effective AI prompts. The difference between "write a blog post about coffee" and a well-structured prompt with clear role definition, audience context, and success criteria can be **dramatic** in output quality.

> **The problem:** Prompt engineering frameworks (CO-STAR, RISEN, RACE) are powerful, but knowing which to use and how to apply them requires expertise most users don't have.

> **The solution:** PromptFixer uses intelligent framework selection to automatically choose and apply the right structure for your task—no prompt engineering knowledge required.

---

## How It Works

### 1. Intelligent Framework Selection

Instead of asking users to choose a framework, PromptFixer analyzes your request and automatically selects the best approach:

| Framework | Meaning | Best For |
| :--- | :--- | :--- |
| **CO-STAR** | Context, Objective, Style, Tone, Audience, Response | Marketing, creative writing, and audience-focused content. |
| **RISEN** | Role, Instructions, Steps, End-goal, Narrowing | Technical tasks, coding, and data analysis—emphasizes step-based instructions and tight scope. |
| **RACE** | Role, Action, Context, Expectation | Quick, simple requests where full structure would be overkill. |

### 2. Proportionality Principle

The tool matches output complexity to input complexity. A 5-word request gets a concise enhancement, not a 500-word prompt. This prevents over-engineering while ensuring every prompt gets appropriate structure.

### 3. Context Preservation

The optimization process is **additive, never subtractive**. Every detail you provide—names, constraints, format requirements—is preserved and enhanced, never summarized away.

### 4. Refinement Loop

After generation, you receive 3-5 targeted questions to fill any gaps. Answer what's relevant, ignore the rest. Each refinement makes the prompt more precise.

---

## Key Features

- ✅ **Zero prompt engineering knowledge required**
- ✅ **Intelligent framework selection** (transparent—you see which was used)
- ✅ **Context preservation** (no detail loss)
- ✅ **Proportional output** (no over-engineering)
- ✅ **Interactive refinement** (optional follow-up questions)
- ✅ **Anti-hallucination safeguards** (for factual/research prompts)
- ✅ **Clean, focused UI** (no framework selection paralysis)

---

## Technical Approach

### System Architecture
- **Client:** React + Vite
- **Server:** Express.js with rate limiting
- **AI Model:** Google Gemini 3.1 Flash-Lite via OpenRouter (hidden power tier: Gemini 3 Flash)
- **Cost/latency:** thinking-level scaling (reasoning effort proportional to input complexity), implicit prompt caching of the stable system prompt, and a loose `max_price` routing guardrail
- **Security:** Cloudflare Turnstile for abuse prevention

### Prompt Engineering Strategy
- Authoritative role applied only when it adds value (not a blanket mandate)
- Conditional chain-of-thought—reasoning cues added only for genuinely multi-step tasks, since modern reasoning models think natively
- Success criteria definition
- Few-shot examples where they lock in output format
- Markdown-formatted output for readability

### Selection Logic

| Priority | Criteria | Framework |
| :--- | :--- | :--- |
| 1 | Code / Data / Logic | **RISEN** |
| 2 | Audience / Persuasion / Marketing | **CO-STAR** |
| 3 | Simple queries (< 15 words) | **RACE** |
| 4 | Uncertain / General | **CO-STAR** (Vertical fallback) |

---

## Development

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your actual API keys

# Run development server
npm run dev

# Build for production
npm run build
```

### Environment Setup

See `.env.example` for all required and optional environment variables. You'll need:

1.  **OpenRouter API Key** - Get from [openrouter.ai/keys](https://openrouter.ai/keys)
    *   Used for AI model inference via their API
2.  **Cloudflare Turnstile Keys** - Get from [Cloudflare Dashboard](https://dash.cloudflare.com)
    *   Used for bot protection (both site key and secret key required)

---

## Use Cases

*   **Marketers:** Generate campaign briefs, ad copy prompts, persona-driven content
*   **Engineers:** Create precise code generation prompts with few-shot examples
*   **Researchers:** Structure analysis tasks with anti-hallucination safeguards
*   **Content Creators:** Transform vague ideas into structured writing prompts
*   **Product Teams:** Draft clear feature specifications and user story prompts

---

## Philosophy

Good prompting isn't about length—it's about **structure, clarity, and intent preservation**. This tool embodies three core principles:

1.  **Expertise should be embedded, not required**
    Users shouldn't need to learn frameworks—the tool should know them.
2.  **Proportionality over perfection**
    Not every request needs verbose structure. Match the effort to the complexity.
3.  **Transparency builds trust**
    Show which framework was used. Let users learn by seeing the patterns.

---

## Contributing

Contributions welcome! This project is open source to help improve AI interaction quality across the ecosystem.

---

## License

MIT License - feel free to use, modify, and distribute.

---

## Built By

[Josh Kellett](https://linkedin.com/in/joshkellett) | [GitHub](https://github.com/joshkellett87)
