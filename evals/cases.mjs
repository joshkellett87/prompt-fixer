// Eval cases with gold labels.
//
// Every field here exists so a check can be argued against core-system-prompt.md
// rather than against taste. If you disagree with a score, the fix is either the
// gold label or the spec — not the scoring code.
//
//   tier                   drives the Proportionality band (spec §5 Output Length Guidelines).
//                          Derived from input word count, but stated explicitly so a
//                          borderline case can't silently drift between bands.
//   wellFormed             input already has role/format/constraints. Spec §5 says the
//                          output must then be SHORTER OR EQUAL to the input.
//   goldFramework          expected selection. null = refinement path, where the model
//                          legitimately re-picks and accuracy isn't scored.
//   placeholdersAcceptable false means the input is self-contained or deliberately open,
//                          so injecting [INSERT X] violates spec §3 Step 3.
//   mustPreserve           proper nouns, numbers and explicit constraints that spec §1
//                          (Entity + Constraint Checklists) requires to survive.
//   kind                   gates the conditional-pattern checks (spec §2/§6/§7):
//                          'creative'|'coding' → accuracy safeguards are over-application
//                          'research'          → accuracy safeguards are appropriate
//                          'general'           → neither way

export const cases = [
  // ─── RACE: short, clear, single action (under ~20 words) ───────────────────
  {
    id: 'race-summarize',
    input: 'summarize this article',
    tier: 'simple', wellFormed: false, goldFramework: 'RACE',
    placeholdersAcceptable: true,   // genuinely needs the article pasted in
    mustPreserve: [], kind: 'general',
  },
  {
    // The 6-word case that exposed the length-vs-spec confusion. Spec §5 hard rule:
    // "A 5-word request should NOT produce a 500-word prompt."
    id: 'race-coffee',
    input: 'write a blog post about coffee',
    // Short creative task with no stated audience sits genuinely between RACE
    // (under 20 words, single action) and CRAFT (general/miscellaneous).
    tier: 'simple', wellFormed: false, goldFramework: ['RACE', 'CRAFT'],
    placeholdersAcceptable: false,  // topic is deliberately open; don't invent an angle
    mustPreserve: ['coffee'], kind: 'creative',
  },
  {
    id: 'race-translate',
    input: 'translate my email into French',
    tier: 'simple', wellFormed: false, goldFramework: 'RACE',
    placeholdersAcceptable: true,
    mustPreserve: ['French'], kind: 'general',
  },

  // ─── MINIMAL: already structured, light polish only ────────────────────────
  {
    id: 'minimal-go-review',
    input: 'You are a senior Go reviewer. Review the diff below for data races only. Output a markdown table with columns: file, line, severity, fix.',
    tier: 'standard', wellFormed: true, goldFramework: 'MINIMAL',
    placeholdersAcceptable: false,
    mustPreserve: ['Go', 'markdown table', 'data races'], kind: 'coding',
  },
  {
    // Long and well-formed: the strictest proportionality case in the set.
    // Spec §5 requires output SHORTER OR EQUAL to input despite the length.
    id: 'minimal-long-brief',
    input: 'You are an experienced technical writer working on developer documentation. Rewrite the API reference section below so that each endpoint follows the same structure: a one-line summary, the HTTP method and path, a parameters table with name/type/required/description, a request example in curl, a response example in JSON, and a list of possible error codes. Keep the existing tone, which is direct and second-person. Do not add marketing language. Preserve every endpoint currently documented; do not merge or drop any. Target roughly 200 words per endpoint.',
    tier: 'complex', wellFormed: true, goldFramework: 'MINIMAL',
    placeholdersAcceptable: false,
    mustPreserve: ['curl', 'JSON', '200 words', 'second-person'], kind: 'coding',
  },
  {
    id: 'minimal-short-structured',
    input: 'Act as a copy editor. Fix grammar and punctuation only. Return the corrected text with no commentary.',
    tier: 'quick', wellFormed: true, goldFramework: 'MINIMAL',
    placeholdersAcceptable: false,
    mustPreserve: ['grammar', 'no commentary'], kind: 'general',
  },

  // ─── RISEN: technical / data ───────────────────────────────────────────────
  {
    id: 'risen-debounce',
    input: 'help me write a function that debounces api calls in javascript, needs to handle the trailing edge and be cancellable',
    tier: 'standard', wellFormed: false, goldFramework: 'RISEN',
    placeholdersAcceptable: false,
    mustPreserve: ['javascript', 'trailing edge', 'cancellable'], kind: 'coding',
  },
  {
    id: 'risen-sql',
    input: 'I have a Postgres table called orders with 40 million rows and queries filtering on customer_id and created_at are slow. Work out what indexes I need and explain the tradeoffs on write throughput.',
    tier: 'complex', wellFormed: false, goldFramework: 'RISEN',
    placeholdersAcceptable: false,
    mustPreserve: ['Postgres', 'orders', 'customer_id', 'created_at', '40 million'], kind: 'coding',
  },
  {
    id: 'risen-parser',
    input: 'write a parser for our log format',
    tier: 'simple', wellFormed: false, goldFramework: ['RISEN', 'RACE'],  // technical but only 7 words
    placeholdersAcceptable: true,   // the log format genuinely is missing and required
    mustPreserve: [], kind: 'coding',
  },

  // ─── ARIA: analysis / research ─────────────────────────────────────────────
  {
    id: 'aria-db-compare',
    input: 'compare Postgres and DynamoDB for a multi-tenant SaaS backend and tell me which to pick',
    tier: 'quick', wellFormed: false, goldFramework: 'ARIA',
    placeholdersAcceptable: false,
    mustPreserve: ['Postgres', 'DynamoDB', 'multi-tenant'], kind: 'research',
  },
  {
    id: 'aria-churn',
    input: 'our churn went up 4 percent last quarter and nobody knows why. I want a proper analysis of the likely causes, what data we would need to confirm each one, and which to investigate first given we only have two analysts.',
    tier: 'complex', wellFormed: false, goldFramework: 'ARIA',
    placeholdersAcceptable: false,
    mustPreserve: ['4 percent', 'two analysts'], kind: 'research',
  },
  {
    id: 'aria-buildbuy',
    input: 'evaluate whether we should build or buy an internal feature flag system',
    tier: 'quick', wellFormed: false, goldFramework: 'ARIA',
    placeholdersAcceptable: false,
    mustPreserve: ['feature flag'], kind: 'research',
  },

  // ─── COVAR: creative with EXPLICIT audience targeting ──────────────────────
  {
    id: 'covar-devtool-email',
    input: 'write a launch email for our new CLI tool aimed at backend developers who are already using Docker',
    tier: 'quick', wellFormed: false, goldFramework: 'COVAR',
    placeholdersAcceptable: false,
    mustPreserve: ['CLI', 'backend developers', 'Docker'], kind: 'creative',
  },
  {
    id: 'covar-landing',
    input: 'landing page copy for an accounting app, targeting sole traders in the UK who currently do their books in a spreadsheet and dread tax season',
    tier: 'standard', wellFormed: false, goldFramework: 'COVAR',
    placeholdersAcceptable: false,
    mustPreserve: ['sole traders', 'UK', 'spreadsheet'], kind: 'creative',
  },
  {
    id: 'covar-exec-post',
    input: 'LinkedIn post about our Series A, written for enterprise CTOs, 200 words max, confident but not boastful',
    tier: 'quick', wellFormed: false, goldFramework: 'COVAR',
    placeholdersAcceptable: false,
    mustPreserve: ['LinkedIn', 'Series A', 'CTOs', '200 words'], kind: 'creative',
  },

  // ─── CRAFT: general purpose ────────────────────────────────────────────────
  {
    id: 'craft-migration-email',
    input: 'I need to write a comprehensive internal announcement email to our engineering organization about a major migration from a monolithic Rails application to services, covering the rationale, the phased timeline over the next three quarters, what individual teams need to do to prepare, how on-call rotations change during the transition, and the rollback plan if any phase fails. It should sound confident but not dismissive of the real disruption this creates.',
    tier: 'complex', wellFormed: false, goldFramework: 'CRAFT',
    placeholdersAcceptable: false,
    mustPreserve: ['Rails', 'three quarters', 'on-call', 'rollback'], kind: 'general',
  },
  {
    id: 'craft-offsite',
    input: 'plan a two day team offsite for 12 people',
    tier: 'simple', wellFormed: false, goldFramework: ['CRAFT', 'RACE'],  // planning, but only 9 words
    placeholdersAcceptable: false,
    mustPreserve: ['two day', '12'], kind: 'general',
  },
  {
    id: 'craft-wedding-speech',
    input: 'help me write a best man speech for my brother Tom, he is marrying Priya in September, keep it warm and funny but nothing embarrassing',
    tier: 'standard', wellFormed: false, goldFramework: 'CRAFT',
    placeholdersAcceptable: false,
    mustPreserve: ['Tom', 'Priya', 'September'], kind: 'creative',
  },

  // ─── Refinement path: getSystemInstruction(true) ───────────────────────────
  // goldFramework is null — the model re-selects here and that isn't scored.
  // These exist mainly to exercise the questions-JSON contract and to confirm the
  // Additive Principle (spec §1): refinement answers must be integrated WITHOUT
  // dropping anything already in the base prompt.
  {
    id: 'refine-coffee',
    isRefinement: true,
    base: 'You are an experienced barista and writer. Write a 900-word blog post about single-origin coffee.',
    original: 'write a blog post about coffee',
    answers: 'Audience: home brewers new to pour-over. Tone: warm, practical.',
    tier: 'standard', wellFormed: false, goldFramework: null,
    placeholdersAcceptable: false,
    mustPreserve: ['900', 'pour-over', 'barista'], kind: 'creative',
  },
  {
    id: 'refine-sql',
    isRefinement: true,
    base: 'You are a senior database engineer. Recommend indexes for a slow Postgres query on the orders table.',
    original: 'my postgres queries are slow',
    answers: 'The table has 40 million rows. Writes are heavy — about 2000 inserts per second. Read latency matters more than write latency.',
    tier: 'standard', wellFormed: false, goldFramework: null,
    placeholdersAcceptable: false,
    mustPreserve: ['Postgres', 'orders', '40 million', '2000'], kind: 'coding',
  },
  {
    id: 'refine-email',
    isRefinement: true,
    base: 'Write a launch email for our new CLI tool aimed at backend developers.',
    original: 'launch email for our cli',
    answers: 'It should mention the free tier. Keep it under 150 words. Do not use exclamation marks.',
    tier: 'quick', wellFormed: false, goldFramework: null,
    placeholdersAcceptable: false,
    mustPreserve: ['CLI', 'free tier', '150 words'], kind: 'creative',
  },
  {
    id: 'refine-empty-answers',
    // Deliberately thin answers. Spec says respect deliberate openness — this should
    // not trigger a wholesale rewrite or a pile of new placeholders.
    isRefinement: true,
    base: 'Act as a copy editor. Fix grammar and punctuation only. Return the corrected text with no commentary.',
    original: 'fix my grammar',
    answers: 'British English please.',
    tier: 'quick', wellFormed: true, goldFramework: null,
    placeholdersAcceptable: false,
    mustPreserve: ['British', 'no commentary'], kind: 'general',
  },
];

// Mirrors App.jsx generatePrompt(): the refinement path sends a composed block, the
// initial path sends "Original Intent: ...". Kept here so the eval sends byte-identical
// payloads to production rather than an approximation of them.
export const buildUserMessage = (c) =>
  c.isRefinement
    ? `## Current Optimized Prompt (BASE):\n${c.base}\n\n## Original Intent:\n${c.original}\n\n## User's Refinement Answers:\n${c.answers}\n\n## Task: Integrate answers while preserving all existing content. Enhance the prompt structure without losing any details.`
    : `Original Intent: ${c.input}`;

// The text whose length the Proportionality bands are measured against. For refinement
// that's the base prompt being enhanced, not the framing boilerplate around it.
export const referenceText = (c) => (c.isRefinement ? c.base : c.input);
