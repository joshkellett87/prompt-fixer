# Prompt Fixer

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Tech Stack](https://img.shields.io/badge/stack-React_Express_Gemini-orange.svg)

> **Transform vague ideas into high-performance AI prompts.**

A professional prompt optimization tool that automatically structures your rough ideas into clear, effective prompts using proven prompt engineering frameworks.

🔗 **[Live Demo](https://promptfixer.co)**

---

## Why This Matters

Most people struggle to write effective AI prompts. The difference between "write a blog post about coffee" and a well-structured prompt with clear role definition, audience context, and success criteria can be **dramatic** in output quality.

> **The problem:** Prompt engineering frameworks are powerful, but knowing which to use and how to apply them requires expertise most users don't have.

> **The solution:** Prompt Fixer uses intelligent framework selection to automatically choose and apply the right structure for your task—no prompt engineering knowledge required.

---

## How It Works

### 1. Intelligent Framework Selection

Instead of asking users to choose a framework, Prompt Fixer analyzes your request and automatically selects the best approach from 6 specialized frameworks:

| Framework | Meaning | Best For |
| :--- | :--- | :--- |
| **RACE** | Role, Action, Context, Expectation | Quick, simple requests under 20 words with a single action. |
| **MINIMAL** | Light Touch, Preserve Intent | Already well-structured prompts that need light polish only. |
| **RISEN** | Role, Instruction, Structure, Examples, Nuance | Technical tasks, coding, and data analysis. |
| **ARIA** | Angle, Research, Investigation, Assessment | Analysis, research, comparisons, and decision-making. |
| **COVAR** | Context, Objective, Voice, Audience, Response | Content with explicit audience targeting—marketing campaigns, sales copy, persuasive messaging. |
| **CRAFT** | Context, Role, Action, Format, Target | General-purpose tasks including creative writing, emails, and miscellaneous requests. |

### 2. Proportionality Principle

The tool matches output complexity to input complexity. A 5-word request gets a concise enhancement, not a 500-word prompt. This prevents over-engineering while ensuring every prompt gets appropriate structure.

### 3. Context Preservation

The optimization process is **additive, never subtractive**. Every detail you provide—names, constraints, format requirements—is preserved and enhanced, never summarized away.

### 4. Refinement Loop

After generation, you may receive 0-5 targeted questions to fill any gaps. If your prompt is already complete, no questions are asked. Answer what's relevant, ignore the rest. Each refinement makes the prompt more precise.

---

## Key Features

- ✅ **Zero prompt engineering knowledge required**
- ✅ **Intelligent framework selection** (transparent—you see which was used)
- ✅ **Edge case handling** (graceful prompts for vague/invalid input)
- ✅ **Multi-intent support** (handles hybrid requests intelligently)
- ✅ **Context preservation** (no detail loss)
- ✅ **Proportional output** (no over-engineering)
- ✅ **Interactive refinement** (0-5 optional follow-up questions)
- ✅ **Anti-hallucination safeguards** (for factual/research prompts)
- ✅ **Clean, focused UI** (no framework selection paralysis)

---

## Technical Approach

### System Architecture
- **Client:** React + Vite
- **Server:** Express.js with rate limiting
- **AI Model:** Google Gemini 2.5 Flash via OpenRouter
- **Security:** Cloudflare Turnstile for abuse prevention

### Prompt Engineering Strategy
- **Conditional role definitions** (only added when helpful, not forced)
- **Chain-of-thought scaffolding** for complex tasks only
- **Success criteria** for multi-step tasks only
- **Few-shot learning guidance** (RISEN framework for technical tasks)
- **Proportional output** (simple input → simple output)
- **Tone preservation** (respects user's style choices)

### Selection Logic

The system checks these rules in order and uses the **first match**:

| Priority | Criteria | Framework |
| :--- | :--- | :--- |
| 0 | Invalid/vague input (under 3 words, gibberish, no clear intent) | **Request clarification** |
| 1 | Short + single action (< 20 words with verb + object) | **RACE** |
| 2 | Already structured (has role, formatting, constraints) | **MINIMAL** |
| 3 | Technical / Code / Data / APIs / System Design | **RISEN** |
| 4 | Analysis / Research / Comparison / Evaluation | **ARIA** |
| 5 | Explicit audience targeting ("for [audience]", "targeting [demographic]") | **COVAR** |
| 6 | Everything else (general tasks, creative writing, emails) | **CRAFT** |

**Multi-Intent Handling:** When a request spans categories (e.g., "Write Python code to analyze sales data"), the system identifies the primary goal and applies that framework while incorporating relevant elements from secondary frameworks.

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

*   **Marketers:** Generate campaign briefs, ad copy prompts, persona-driven content → *COVAR*
*   **Engineers:** Create precise code generation prompts with few-shot examples → *RISEN*
*   **Researchers:** Structure analysis and comparison tasks → *ARIA*
*   **Content Creators:** Transform vague ideas into structured writing prompts → *CRAFT*
*   **Product Teams:** Draft clear feature specifications and user story prompts → *CRAFT*
*   **Everyone:** Quick translations, summaries, definitions → *RACE*

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
