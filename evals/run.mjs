// PromptFixer model eval. See evals/README.md.
//
// Scores candidate models against the product's own spec (core-system-prompt.md)
// rather than against output length, which is the axis the spec explicitly warns
// against ("A 5-word request should NOT produce a 500-word prompt").
//
//   node evals/run.mjs --self-test              prove the checks catch known-bad output
//   node evals/run.mjs --cases 2 --models 2 --no-judge    cheap wiring check
//   node evals/run.mjs                          full run
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert';
import module from 'node:module';
import { fileURLToPath } from 'node:url';
import { cases, buildUserMessage, referenceText } from './cases.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoRequire = module.createRequire(path.join(ROOT, 'package.json'));

// ── CLI ────────────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const flag = (n) => argv.includes(`--${n}`);
const opt = (n, d) => { const i = argv.indexOf(`--${n}`); return i >= 0 ? Number(argv[i + 1]) : d; };
const OPTS = {
  selfTest: flag('self-test'),
  judge: !flag('no-judge'),
  reps: opt('reps', 3),
  maxCases: opt('cases', Infinity),
  maxModels: opt('models', Infinity),
  concurrency: opt('concurrency', 6),
};

// ── Candidates ─────────────────────────────────────────────────────────────────
// prices are $/M tokens, used for cost reporting and for the max_price routing
// guardrail (set at 2x list, mirroring server/routes/api.js).
const CANDIDATES = [
  { tier: 'default', id: 'google/gemini-3.1-flash-lite', in: 0.25, out: 1.50, incumbent: true },
  { tier: 'default', id: 'openai/gpt-5.6-luna', in: 0.10, out: 0.60 },
  { tier: 'default', id: 'google/gemini-3.5-flash-lite', in: 0.30, out: 2.50 },
  { tier: 'power', id: 'google/gemini-3.6-flash', in: 1.50, out: 7.50 },
  { tier: 'power', id: 'anthropic/claude-sonnet-5', in: 2.00, out: 10.00 },
  { tier: 'power', id: 'openai/gpt-5.6-terra', in: 1.00, out: 6.00 },
];
const JUDGE = { id: 'anthropic/claude-opus-5', in: 5, out: 25 };
// claude-opus-5 judging claude-sonnet-5 is same-family. Pairs involving Sonnet get
// re-judged here and agreement is reported rather than quietly averaged.
const CROSS_JUDGE = { id: 'openai/gpt-5.6-sol', in: 5, out: 30 };
const CROSS_CHECK_MODEL = 'anthropic/claude-sonnet-5';

const VALID_FRAMEWORKS = new Set(['RACE', 'MINIMAL', 'RISEN', 'ARIA', 'COVAR', 'CRAFT']);

// ── Load the REAL system instruction ───────────────────────────────────────────
// systemInstructions.js is ESM and imports core-system-prompt.md?raw, which plain
// Node can't resolve. Bundling it is the only way to eval the prompt that actually
// ships — a hand-copied duplicate would drift and quietly invalidate every score.
async function loadSystemInstruction() {
  const esbuild = repoRequire('esbuild');
  const out = await esbuild.build({
    entryPoints: [path.join(ROOT, 'client/src/prompts/systemInstructions.js')],
    bundle: true, format: 'cjs', platform: 'node', write: false,
    plugins: [{
      name: 'raw-md',
      setup(b) {
        b.onResolve({ filter: /\?raw$/ }, (a) => ({
          path: path.resolve(a.resolveDir, a.path.replace(/\?raw$/, '')), namespace: 'raw',
        }));
        b.onLoad({ filter: /.*/, namespace: 'raw' }, (a) => ({
          contents: fs.readFileSync(a.path, 'utf8'), loader: 'text',
        }));
      },
    }],
  });
  const mod = { exports: {} };
  new Function('module', 'exports', 'require', out.outputFiles[0].text)(mod, mod.exports, repoRequire);
  return mod.exports.getSystemInstruction;
}

// ── Text helpers ───────────────────────────────────────────────────────────────
const words = (s) => s.trim().split(/\s+/).filter(Boolean).length;
const sentences = (s) => s.split(/[.!?]+(?=\s|$)/).map((x) => x.trim()).filter(Boolean).length;
const paragraphs = (s) => s.split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean).length;
const structured = (s) => /^\s*#{1,6}\s/m.test(s) || /^\s*[-*•]\s/m.test(s) || /^\s*\d+[.)]\s/m.test(s);
// Hyphen/whitespace-insensitive containment, so "second-person" matches "second person"
// and an entity check doesn't fail on cosmetic punctuation.
const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

const ok = () => ({ pass: true });
const bad = (why) => ({ pass: false, why });

// ── Deterministic checks (spec-derived) ────────────────────────────────────────

// Exactly the regexes App.jsx uses. A pass here means production would parse it.
function checkFormat(text) {
  const promptMatch = text.match(/\[PROMPT_START\]([\s\S]*?)\[PROMPT_END\]/);
  const questionMatch = text.match(/\[QUESTIONS_START\]([\s\S]*?)\[QUESTIONS_END\]/);
  const frameworkMatch = text.match(/\[FRAMEWORK\](.*?)\[\/FRAMEWORK\]/);
  if (!promptMatch) return { ...bad('no [PROMPT_START]…[PROMPT_END] block'), prompt: '', framework: null };
  if (!questionMatch) return { ...bad('no [QUESTIONS_START]…[QUESTIONS_END] block'), prompt: promptMatch[1].trim(), framework: null };
  let questions = null;
  try { const q = JSON.parse(questionMatch[1]); if (Array.isArray(q)) questions = q; } catch { /* handled below */ }
  const framework = frameworkMatch ? frameworkMatch[1].trim() : null;
  const prompt = promptMatch[1].trim();
  if (questions === null) return { ...bad('questions block is not a JSON array'), prompt, framework };
  if (!VALID_FRAMEWORKS.has(framework)) return { ...bad(`framework "${framework}" not one of the 6`), prompt, framework };
  return { ...ok(), prompt, framework, questions };
}

// spec §5 Proportionality Principle. Over-expansion is a defect, not a bonus.
function checkProportionality(c, out) {
  const ref = referenceText(c);
  if (c.wellFormed) {
    const ratio = out.length / ref.length;
    // 1.15 tolerates genuine polish (punctuation, a clarified clause) without
    // tolerating a rewrite. Spec: "SHORTER or EQUAL to input".
    return ratio <= 1.15 ? ok() : bad(`well-formed input grew to ${Math.round(ratio * 100)}% of original`);
  }
  const w = words(ref);
  if (w < 15) {
    if (structured(out)) return bad(`headers/bullets added to a ${w}-word query (spec: "No headers")`);
    const s = sentences(out);
    return s <= 4 ? ok() : bad(`${s} sentences for a ${w}-word input (spec max 4)`);
  }
  if (w <= 50) {
    const p = paragraphs(out);
    if (p > 2) return bad(`${p} paragraphs for a ${w}-word input (spec: 1-2)`);
    const ow = words(out);
    return ow <= 150 ? ok() : bad(`${ow} words for a ${w}-word input (spec: 1-2 short paragraphs)`);
  }
  const ow = words(out);
  return ow <= w * 2 ? ok() : bad(`${ow} words vs ${w}-word input — >2x is not "modestly exceed"`);
}

// spec §1 Entity + Constraint Checklists.
function checkPreservation(c, out) {
  const haystack = norm(out);
  const missing = c.mustPreserve.filter((e) => !haystack.includes(norm(e)));
  return missing.length ? bad(`dropped: ${missing.join(', ')}`) : ok();
}

// spec §3 Step 3 — "Deliberate openness is not a gap".
const PLACEHOLDER_RE = () =>
  /\[(?:INSERT|YOUR|ADD|SPECIFY|ENTER|PASTE|EXAMPLE|E\.G\.)\b[^\]]*\]|\[[A-Z][A-Z0-9 _\/-]{3,}\]/g;
function checkPlaceholders(c, out) {
  if (c.placeholdersAcceptable) return ok();
  const found = out.match(PLACEHOLDER_RE()) || [];
  return found.length ? bad(`injected ${found.length} placeholder(s): ${found.slice(0, 3).join(' ')}`) : ok();
}

// spec §2 (role only if missing), §6 (safeguards only for research/data), §7
// (success criteria only for complex tasks).
function checkConditionals(c, out) {
  const v = [];
  const roleRe = /\b(you are|act as|assume the role of)\b/gi;
  if (roleRe.test(referenceText(c))) {
    const n = (out.match(/\b(you are|act as|assume the role of)\b/gi) || []).length;
    if (n > 1) v.push(`${n} role openers though the input already defined one (spec §2)`);
  }
  if (c.kind === 'creative' || c.kind === 'coding') {
    if (/do not fabricate|don'?t fabricate|cite sources|state your confidence/i.test(out))
      v.push(`accuracy safeguards on a ${c.kind} task (spec §6 says skip)`);
  }
  if (c.tier === 'simple' && /success criteria|acceptance criteria|what does a good output look like/i.test(out))
    v.push('success criteria on a simple query (spec §7 says skip)');
  return v.length ? bad(v.join('; ')) : ok();
}

// Some inputs sit legitimately between two frameworks (a short creative task is
// arguably RACE or CRAFT). Those cases carry an array and any member counts —
// scoring a defensible choice as wrong would just add noise to the comparison.
function checkFramework(c, framework) {
  if (!c.goldFramework) return null;              // refinement path — not scored
  const accept = Array.isArray(c.goldFramework) ? c.goldFramework : [c.goldFramework];
  return accept.includes(framework) ? ok() : bad(`chose ${framework}, expected ${accept.join(' or ')}`);
}

const CHECKS = ['proportionality', 'preservation', 'placeholders', 'conditionals', 'framework'];

function scoreSample(c, text) {
  const format = checkFormat(text);
  // A broken format contract means there's no reliable prompt to score. Gate, don't score.
  if (!format.pass) return { format, checks: null };
  const checks = {
    proportionality: checkProportionality(c, format.prompt),
    preservation: checkPreservation(c, format.prompt),
    placeholders: checkPlaceholders(c, format.prompt),
    conditionals: checkConditionals(c, format.prompt),
    framework: checkFramework(c, format.framework),
  };
  return { format, checks, prompt: format.prompt, framework: format.framework, questions: format.questions };
}

// ── OpenRouter ─────────────────────────────────────────────────────────────────
const KEY = process.env.OPENROUTER_API_KEY;

async function call(model, messages, { effort, maxPrice, retries = 2 } = {}) {
  const body = { model, messages };
  if (effort) body.reasoning = { effort };
  if (maxPrice) body.provider = { max_price: maxPrice };
  for (let attempt = 0; ; attempt++) {
    const t0 = Date.now();
    try {
      const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json',
          'HTTP-Referer': 'https://promptfixer.co', 'X-Title': 'PromptFixer-eval',
        },
        body: JSON.stringify(body),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(`HTTP ${r.status} ${JSON.stringify(j.error || j).slice(0, 160)}`);
      return { text: j.choices?.[0]?.message?.content || '', usage: j.usage || {}, ms: Date.now() - t0 };
    } catch (e) {
      if (attempt >= retries) return { error: String(e.message || e), ms: Date.now() - t0 };
      await new Promise((res) => setTimeout(res, 800 * (attempt + 1)));
    }
  }
}

const cost = (m, u) => ((u.prompt_tokens || 0) / 1e6) * m.in + ((u.completion_tokens || 0) / 1e6) * m.out;

// Mirrors determineReasoningEffort() in server/routes/api.js.
const effortFor = (tier, userMessage) =>
  tier === 'power' ? 'high' : (words(userMessage) > 60 ? 'medium' : 'low');

async function pool(items, n, fn) {
  const out = new Array(items.length);
  let i = 0;
  await Promise.all(Array.from({ length: Math.min(n, items.length) }, async () => {
    while (i < items.length) { const k = i++; out[k] = await fn(items[k], k); }
  }));
  return out;
}

// ── Judge ──────────────────────────────────────────────────────────────────────
const JUDGE_SYSTEM = `You are evaluating a tool that rewrites a user's rough idea into a better prompt for an LLM.

Judge against these rules, which are the tool's own specification:
- PROPORTIONALITY IS CRITICAL. Output must match input complexity. A short request must NOT become a long elaborate prompt. Length is not quality; over-expansion is a defect exactly as much as under-expansion is.
- FAITHFULNESS. The rewrite must not invent constraints the user never implied — a specific word count, an audience, a tone, a structure the user did not ask for. Adding clarity is good; adding requirements is not.
- PRESERVATION. Everything the user did specify must survive.
- RESPECT DELIBERATE OPENNESS. If the user left something open on purpose, filling it in with a guess or a [PLACEHOLDER] is wrong.

You will see the user's original input and two candidate rewrites, A and B.
Decide which is better on each axis. "tie" is a legitimate and expected answer — use it when the candidates are genuinely comparable rather than forcing a winner.

Respond with ONLY a JSON object, no prose, no code fence:
{"faithfulness":"A|B|tie","efficacy":"A|B|tie","overall":"A|B|tie","reason":"<one sentence>"}

"efficacy" means: which rewrite would actually produce a better response from an LLM, for the user's real intent?`;

async function judgePair(judgeModel, c, promptA, promptB) {
  const user = `## User's original input\n${referenceText(c)}\n\n## Candidate A\n${promptA}\n\n## Candidate B\n${promptB}`;
  const r = await call(judgeModel.id, [
    { role: 'system', content: JUDGE_SYSTEM }, { role: 'user', content: user },
  ], { effort: 'high' });
  if (r.error) return { error: r.error };
  const m = r.text.match(/\{[\s\S]*\}/);
  if (!m) return { error: 'judge returned no JSON' };
  try { return { verdict: JSON.parse(m[0]), usage: r.usage }; }
  catch (e) { return { error: `judge JSON parse: ${e.message}` }; }
}

// ── Self-test ──────────────────────────────────────────────────────────────────
// The harness has to prove itself before its numbers mean anything. These assert
// each check FAILS on output that is known-bad by the spec.
function selfTest() {
  const simple = cases.find((c) => c.id === 'race-coffee');
  const wellFormed = cases.find((c) => c.id === 'minimal-long-brief');
  const research = cases.find((c) => c.id === 'aria-churn');

  // Proportionality: a 400-word expansion of a 6-word input must fail.
  const bloated = 'You are an expert. ' + 'The post should be engaging and well structured. '.repeat(50);
  assert.equal(checkProportionality(simple, bloated).pass, false, 'bloat should fail proportionality');
  assert.equal(checkProportionality(simple, 'Write an engaging blog post about coffee with a clear structure.').pass, true, 'concise should pass');
  // …and headers on a simple query are their own violation.
  assert.equal(checkProportionality(simple, '## Role\nWriter.\n\n## Task\nCoffee post.').pass, false, 'headers on simple query should fail');
  // Well-formed inputs must not grow.
  assert.equal(checkProportionality(wellFormed, wellFormed.input + ' '.repeat(10) + 'x'.repeat(400)).pass, false, 'well-formed growth should fail');
  assert.equal(checkProportionality(wellFormed, wellFormed.input).pass, true, 'unchanged well-formed should pass');

  // Preservation: dropping a required entity must fail.
  assert.equal(checkPreservation(simple, 'Write an engaging blog post about tea.').pass, false, 'dropped entity should fail');
  assert.equal(checkPreservation(simple, 'Write about COFFEE.').pass, true, 'entity match should be case-insensitive');
  assert.equal(checkPreservation({ mustPreserve: ['second-person'] }, 'Use second person voice.').pass, true, 'hyphen-insensitive match');

  // Placeholders: injecting one where the case forbids it must fail.
  assert.equal(checkPlaceholders(simple, 'Write about coffee from [INSERT SPECIFIC ANGLE].').pass, false, 'placeholder should fail');
  assert.equal(checkPlaceholders(simple, 'Write about coffee.').pass, true, 'no placeholder should pass');
  assert.equal(checkPlaceholders({ placeholdersAcceptable: true }, 'Summarize [INSERT ARTICLE].').pass, true, 'allowed placeholder should pass');

  // Conditional patterns.
  assert.equal(checkConditionals(simple, 'Do not fabricate statistics. Write about coffee.').pass, false, 'safeguards on creative should fail');
  assert.equal(checkConditionals(research, 'Do not fabricate statistics or citations.').pass, true, 'safeguards on research should pass');
  assert.equal(checkConditionals(simple, 'Write about coffee. Success criteria: the post is engaging.').pass, false, 'success criteria on simple should fail');
  assert.equal(checkConditionals(wellFormed, 'You are a writer. You are also an editor. Act as a reviewer.').pass, false, 'stacked roles should fail');

  // Format contract mirrors App.jsx exactly.
  assert.equal(checkFormat('[PROMPT_START]hi[PROMPT_END][QUESTIONS_START][][QUESTIONS_END][FRAMEWORK]RACE[/FRAMEWORK]').pass, true, 'valid format');
  assert.equal(checkFormat('[PROMPT_START]hi[QUESTIONS_START][][QUESTIONS_END]').pass, false, 'missing PROMPT_END');
  assert.equal(checkFormat('[PROMPT_START]hi[PROMPT_END][QUESTIONS_START]- a\n- b[QUESTIONS_END][FRAMEWORK]RACE[/FRAMEWORK]').pass, false, 'markdown list questions');
  assert.equal(checkFormat('[PROMPT_START]hi[PROMPT_END][QUESTIONS_START][][QUESTIONS_END][FRAMEWORK]NOPE[/FRAMEWORK]').pass, false, 'invalid framework');

  // Framework accuracy skips the refinement path rather than scoring it as wrong.
  assert.equal(checkFramework({ goldFramework: null }, 'RACE'), null, 'refinement not scored');
  assert.equal(checkFramework({ goldFramework: 'RACE' }, 'CRAFT').pass, false, 'wrong framework');
  assert.equal(checkFramework({ goldFramework: ['RACE', 'CRAFT'] }, 'CRAFT').pass, true, 'either of an ambiguous pair counts');
  assert.equal(checkFramework({ goldFramework: ['RACE', 'CRAFT'] }, 'ARIA').pass, false, 'ambiguous pair still rejects a third');

  console.log('self-test: all assertions passed');
}

// A judge that can't pick a clearly-better rewrite, or that changes its mind when
// the two are swapped, produces numbers worth nothing. Verify before trusting.
async function judgeSanity() {
  const c = cases.find((x) => x.id === 'race-coffee');
  const good = 'Write an engaging blog post about coffee. Use a clear structure with a hook, a few short sections, and a brief conclusion.';
  const poor = `You are a world-class coffee expert with 15+ years of experience.

## Task
Write a blog post about coffee.

## Requirements
- Length: exactly 1,500 words
- Target audience: [INSERT TARGET AUDIENCE HERE]
- Tone: [INSERT TONE HERE]
- Angle: [INSERT SPECIFIC ANGLE - e.g. roasting science, brewing guides]
- Include at least 7 subheadings and a comparison table
- Do not fabricate statistics; cite all sources
- Success criteria: the reader subscribes to the newsletter`;

  for (const [label, a, b, expect] of [['good-first', good, poor, 'A'], ['good-second', poor, good, 'B']]) {
    const v = await judgePair(JUDGE, c, a, b);
    if (v.error) { console.log(`judge-sanity ${label}: ERROR ${v.error}`); continue; }
    const got = v.verdict.overall;
    console.log(`judge-sanity ${label}: overall=${got} expected=${expect} ${got === expect ? 'OK' : 'MISMATCH'} — ${v.verdict.reason}`);
  }
}

// ── Reporting ──────────────────────────────────────────────────────────────────
function summarise(results, judged) {
  const byModel = new Map();
  for (const r of results) {
    if (!byModel.has(r.model)) byModel.set(r.model, {
      tier: r.tier, n: 0, formatPass: 0, errors: 0, cost: 0, ms: [],
      checks: Object.fromEntries(CHECKS.map((k) => [k, { pass: 0, n: 0, fails: [] }])),
    });
    const m = byModel.get(r.model);
    m.n++;
    if (r.error) { m.errors++; continue; }
    m.cost += r.cost; m.ms.push(r.ms);
    if (!r.score.format.pass) continue;
    m.formatPass++;
    for (const k of CHECKS) {
      const c = r.score.checks[k];
      if (!c) continue;
      m.checks[k].n++;
      if (c.pass) m.checks[k].pass++;
      else if (m.checks[k].fails.length < 4) m.checks[k].fails.push(`${r.caseId}: ${c.why}`);
    }
  }

  const lines = [];
  for (const tier of ['default', 'power']) {
    lines.push(`\n### ${tier.toUpperCase()} TIER\n`);
    lines.push('| model | format gate | proportionality | preservation | placeholders | conditionals | framework | spec score | $/req | p50 ms |');
    lines.push('|---|---|---|---|---|---|---|---|---|---|');
    const rows = [...byModel.entries()].filter(([, v]) => v.tier === tier);
    for (const [id, m] of rows) {
      const pct = (c) => (c.n ? `${Math.round((c.pass / c.n) * 100)}%` : '—');
      const specPass = CHECKS.reduce((a, k) => a + m.checks[k].pass, 0);
      const specN = CHECKS.reduce((a, k) => a + m.checks[k].n, 0);
      const p50 = m.ms.length ? m.ms.slice().sort((a, b) => a - b)[Math.floor(m.ms.length / 2)] : 0;
      const gate = `${m.formatPass}/${m.n - m.errors}`;
      lines.push(`| \`${id}\` | ${gate} | ${pct(m.checks.proportionality)} | ${pct(m.checks.preservation)} | ${pct(m.checks.placeholders)} | ${pct(m.checks.conditionals)} | ${pct(m.checks.framework)} | **${specN ? Math.round((specPass / specN) * 100) : 0}%** | $${(m.cost / Math.max(1, m.n)).toFixed(4)} | ${p50} |`);
    }
  }

  lines.push('\n### Representative failures\n');
  for (const [id, m] of byModel) {
    const fails = CHECKS.flatMap((k) => m.checks[k].fails.map((f) => `${k} — ${f}`));
    if (!fails.length) continue;
    lines.push(`**\`${id}\`**`);
    for (const f of fails.slice(0, 6)) lines.push(`- ${f}`);
    lines.push('');
  }

  if (judged?.length) {
    lines.push('\n### Judged head-to-head (win / loss / tie)\n');
    const tally = new Map();
    for (const j of judged) {
      if (j.error || !j.verdict) continue;
      const key = `${j.tier}|${j.a}|${j.b}|${j.judge}`;
      if (!tally.has(key)) tally.set(key, { a: 0, b: 0, tie: 0, tier: j.tier, A: j.a, B: j.b, judge: j.judge });
      const t = tally.get(key);
      const v = j.verdict.overall;
      if (v === 'A') t.a++; else if (v === 'B') t.b++; else t.tie++;
    }
    lines.push('| tier | judge | A | B | A wins | B wins | ties |');
    lines.push('|---|---|---|---|---|---|---|');
    for (const t of tally.values())
      lines.push(`| ${t.tier} | \`${t.judge.split('/')[1]}\` | \`${t.A.split('/')[1]}\` | \`${t.B.split('/')[1]}\` | ${t.a} | ${t.b} | ${t.tie} |`);
  }
  return lines.join('\n');
}

// ── Main ───────────────────────────────────────────────────────────────────────
async function main() {
  if (OPTS.selfTest) { selfTest(); return; }
  selfTest();   // always runs — the harness proves itself before it reports numbers
  if (!KEY) { console.error('OPENROUTER_API_KEY not set'); process.exit(1); }
  if (flag('judge-test')) { await judgeSanity(); return; }

  const getSystemInstruction = await loadSystemInstruction();
  const activeCases = cases.slice(0, OPTS.maxCases);
  const byTier = { default: [], power: [] };
  for (const m of CANDIDATES) byTier[m.tier].push(m);
  const models = [...byTier.default.slice(0, OPTS.maxModels), ...byTier.power.slice(0, OPTS.maxModels)];

  const jobs = [];
  for (const c of activeCases)
    for (const m of models)
      for (let rep = 0; rep < OPTS.reps; rep++) jobs.push({ c, m, rep });

  console.log(`${activeCases.length} cases × ${models.length} models × ${OPTS.reps} reps = ${jobs.length} generations`);

  let done = 0;
  const results = await pool(jobs, OPTS.concurrency, async ({ c, m, rep }) => {
    const user = buildUserMessage(c);
    const messages = [
      { role: 'system', content: getSystemInstruction(!!c.isRefinement) },
      { role: 'user', content: user },
    ];
    const r = await call(m.id, messages, {
      effort: effortFor(m.tier, user),
      maxPrice: { prompt: m.in * 2, completion: m.out * 2 },
    });
    if (++done % 25 === 0) process.stdout.write(`  ${done}/${jobs.length}\n`);
    if (r.error) return { caseId: c.id, model: m.id, tier: m.tier, rep, error: r.error };
    return {
      caseId: c.id, model: m.id, tier: m.tier, rep, ms: r.ms, usage: r.usage,
      cost: cost(m, r.usage), text: r.text, score: scoreSample(c, r.text),
    };
  });

  // Judge round-robin within each tier, on rep 0 only.
  const judged = [];
  if (OPTS.judge) {
    const pairs = [];
    for (const tier of ['default', 'power']) {
      const tm = models.filter((m) => m.tier === tier);
      for (let i = 0; i < tm.length; i++)
        for (let k = i + 1; k < tm.length; k++)
          for (const c of activeCases) pairs.push({ tier, c, x: tm[i].id, y: tm[k].id });
    }
    console.log(`judging ${pairs.length} pairs (+ cross-check on ${CROSS_CHECK_MODEL} pairs)`);
    let jdone = 0;
    const runs = await pool(pairs, OPTS.concurrency, async (p) => {
      const get = (id) => results.find((r) => r.caseId === p.c.id && r.model === id && r.rep === 0);
      const rx = get(p.x), ry = get(p.y);
      if (!rx?.score?.format?.pass || !ry?.score?.format?.pass) return null;   // gate failed; nothing to compare
      // Position randomisation — otherwise a judge's A-bias reads as a model win.
      const swap = Math.random() < 0.5;
      const [pa, pb] = swap ? [ry.score.prompt, rx.score.prompt] : [rx.score.prompt, ry.score.prompt];
      const label = (slot) => (swap ? (slot === 'A' ? p.y : p.x) : (slot === 'A' ? p.x : p.y));
      const out = [];
      const judges = [JUDGE];
      if (p.x === CROSS_CHECK_MODEL || p.y === CROSS_CHECK_MODEL) judges.push(CROSS_JUDGE);
      for (const jm of judges) {
        const v = await judgePair(jm, p.c, pa, pb);
        if (++jdone % 25 === 0) process.stdout.write(`  judged ${jdone}\n`);
        if (v.error) { out.push({ ...p, judge: jm.id, error: v.error }); continue; }
        // Re-map A/B back to model ids so the tally isn't distorted by the shuffle.
        const remap = (s) => (s === 'A' || s === 'B' ? (label(s) === p.x ? 'A' : 'B') : 'tie');
        out.push({
          tier: p.tier, caseId: p.c.id, a: p.x, b: p.y, judge: jm.id,
          verdict: { ...v.verdict, overall: remap(v.verdict.overall), faithfulness: remap(v.verdict.faithfulness), efficacy: remap(v.verdict.efficacy) },
          judgeCost: cost(jm, v.usage || {}),
        });
      }
      return out;
    });
    for (const r of runs) if (r) judged.push(...r);
  }

  const dir = path.join(ROOT, 'evals/results');
  fs.mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  fs.writeFileSync(path.join(dir, `${stamp}.json`), JSON.stringify({ results, judged }, null, 2));

  const genCost = results.reduce((a, r) => a + (r.cost || 0), 0);
  const judgeCost = judged.reduce((a, j) => a + (j.judgeCost || 0), 0);
  const report = [
    `# PromptFixer model eval — ${new Date().toISOString().slice(0, 16).replace('T', ' ')}`,
    `\n${activeCases.length} cases × ${models.length} models × ${OPTS.reps} reps. `
    + `Generation $${genCost.toFixed(2)}, judging $${judgeCost.toFixed(2)}, total **$${(genCost + judgeCost).toFixed(2)}**.`,
    `\n"format gate" is pass/attempts on the marker contract — a model failing it is disqualified `
    + `regardless of writing quality, because production cannot parse its output.`,
    summarise(results, judged),
  ].join('\n');
  fs.writeFileSync(path.join(dir, `${stamp}.md`), report);
  console.log(report);
  console.log(`\nwritten to evals/results/${stamp}.{json,md}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
