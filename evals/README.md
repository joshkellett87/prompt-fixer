# Model eval

Scores candidate models against **the product's own spec**
([`client/src/prompts/content/core-system-prompt.md`](../client/src/prompts/content/core-system-prompt.md))
rather than against output length.

This distinction matters. The spec's §5 Proportionality Principle is marked CRITICAL and says a
5-word request must not produce a 500-word prompt. An earlier ad-hoc comparison ranked models by how
much they expanded the input and reached the opposite conclusion from this harness on the same
models. **Longer is not better. Over-expansion is a defect.**

## Running

```bash
OPENROUTER_API_KEY=sk-or-... node evals/run.mjs
```

| Flag | Effect |
|---|---|
| `--self-test` | Run the assertions on the checks and exit. No API calls, no cost. |
| `--judge-test` | Confirm the judge picks a clearly-better rewrite and doesn't flip when the pair is swapped. ~2 calls. |
| `--cases N` | First N cases only. |
| `--models N` | First N models per tier. |
| `--reps N` | Repetitions per case per model (default 3). |
| `--no-judge` | Deterministic checks only — free apart from generation. |
| `--concurrency N` | Parallel requests (default 6). |

A full run is 22 cases × 6 models × 3 reps plus judging: roughly **$11-13** and ~10 minutes.
Cheap wiring check first:

```bash
node evals/run.mjs --cases 2 --models 2 --reps 1 --no-judge
```

The self-test runs automatically before every scored run. If it fails, no numbers are produced —
a harness that can't catch known-bad output can't be trusted to rank models.

## What's measured

**The format gate** — the exact regexes from `App.jsx` (`[PROMPT_START]`, questions parsing to a JSON
array, `[FRAMEWORK]` ∈ the six names). This is pass/fail, not a score: a model production cannot parse
is disqualified no matter how well it writes.

**Deterministic spec checks**, each traceable to a numbered section of the spec:

| Check | Spec | Fails when |
|---|---|---|
| proportionality | §5 | Output exceeds the band for the input's word count, or a well-formed input grows |
| preservation | §1 | A proper noun, number or stated constraint from the input is dropped |
| placeholders | §3 | `[INSERT X]` injected where the input was self-contained or deliberately open |
| conditionals | §2/§6/§7 | Role stacked on an input that had one; accuracy safeguards on creative/coding work; success criteria on a simple query |
| framework | — | Selection outside the acceptable set for the case |

**Judged** (`claude-opus-5`, blind, position-randomized) — faithfulness, efficacy, overall preference.
Pairs involving `claude-sonnet-5` are re-judged by `gpt-5.6-sol`, since same-family judging is a real
bias risk; report agreement rather than averaging it away.

## Adding a case

Add to `cases.mjs`. Every field is a claim about what correct behaviour is, so set them deliberately:

- `tier` — proportionality band. Should agree with the input's word count.
- `wellFormed` — input already has role/format/constraints, so output must be **shorter or equal**.
- `goldFramework` — a string, or an **array** when the input sits genuinely between two frameworks.
  Use the array whenever more than one choice is defensible; scoring a reasonable pick as wrong just
  adds noise. `null` for refinement cases, where selection isn't scored.
- `placeholdersAcceptable` — `true` only when context is genuinely missing *and required*
  (e.g. "summarize this article" needs the article). Deliberate open-endedness is not a gap.
- `mustPreserve` — matched hyphen- and case-insensitively, so `second-person` matches `second person`.
- `kind` — `creative`/`coding` make accuracy safeguards a violation; `research` makes them correct.

## Interpreting results

Written to `evals/results/<timestamp>.{json,md}` (gitignored). The decision rule, fixed in advance:

1. Format gate below 100% → disqualified.
2. Rank survivors on spec score.
3. Judged efficacy breaks ties and catches models that are compliant but useless.
4. **Keep the incumbent unless a challenger wins clearly.** A marginal win isn't worth a production change.
5. Cost is a tiebreaker only.

## Note

`run.mjs` bundles the real `getSystemInstruction()` through esbuild rather than copying the prompt,
because that module imports `core-system-prompt.md?raw` which plain Node can't resolve. Don't replace
this with a hand-maintained copy — it would drift from what ships and silently invalidate every score.

Files are `.mjs` because the repo's `package.json` has no `"type": "module"` (the server is CommonJS).
This is deliberately not a jest suite: it costs money and hits a live API, so it stays out of
`npm run test:server`.
