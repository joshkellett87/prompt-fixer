import { frameworks } from './frameworks';
import corePrompt from './content/core-system-prompt.md?raw';

// HARDCODED SAFETY RULES - DO NOT EDIT DYNAMICALLY
// The app relies on these specific tags to parse the response.
const OUTPUT_FORMAT_INITIAL = `
CRITICAL OUTPUT STRUCTURE:
1. Use [PROMPT_START] and [PROMPT_END] tags around the optimized prompt.
2. ONLY the final prompt to be copied goes inside these tags. NO CONVERSATIONAL FILLER.
3. Provide 0-5 refinement questions as a JSON array inside [QUESTIONS_START] and [QUESTIONS_END].
   - If the user's input is already specific and complete, return an empty array: []
   - Only ask questions when there are genuine gaps that would improve the prompt
   - Avoid asking about details the user clearly left open intentionally
4. State which framework you used: [FRAMEWORK]FRAMEWORK_NAME[/FRAMEWORK] (use exactly: RACE, MINIMAL, RISEN, ARIA, COVAR, or CRAFT)
`;

const OUTPUT_FORMAT_REFINEMENT = `
CRITICAL OUTPUT STRUCTURE:
1. Use [PROMPT_START] and [PROMPT_END] tags around the optimized prompt.
2. ONLY the final prompt to be copied goes inside these tags.
3. Provide 0-5 refinement questions as a JSON array inside [QUESTIONS_START] and [QUESTIONS_END].
   - The array is parsed with JSON.parse — emit valid JSON, e.g. ["First question?", "Second question?"]. Never a markdown list.
   - If the prompt is high-quality and complete, return an empty array: []
   - Prioritize questions about critical missing context over nice-to-haves
4. State which framework you used: [FRAMEWORK]FRAMEWORK_NAME[/FRAMEWORK] (use exactly: RACE, MINIMAL, RISEN, ARIA, COVAR, or CRAFT)
`;

// Always uses intelligent framework selection (SMART mode)
export const getSystemInstruction = (isRefining = false) => {
  const frameworkContext = `INTELLIGENT FRAMEWORK SELECTION

You must analyze each request and select the most appropriate framework. Apply the selected framework's structure to your output.

## Available Frameworks (6 total)

### 1. RACE (Quick/Simple)
Use when: Short requests (under 20 words) with a single clear action. Summaries, definitions, translations, simple explanations.
${frameworks['RACE'].applicationGuide}

### 2. MINIMAL (Well-Formed/Pass-Through)
Use when: Input ALREADY has structure (role definition, formatting, specific constraints). Apply light polish only.
${frameworks['MINIMAL'].applicationGuide}

### 3. RISEN (Technical/Data)
Use when: Coding, programming, data analysis, APIs, algorithms, technical documentation.
${frameworks['RISEN'].applicationGuide}

### 4. ARIA (Analysis/Research)
Use when: Comparisons, evaluations, research, decision-making, cause analysis, pros/cons, reviews.
${frameworks['ARIA'].applicationGuide}

### 5. COVAR (Creative/Marketing)
Use when: Content that EXPLICITLY targets a defined audience. Marketing campaigns, persuasive writing, sales copy, audience-specific messaging. The key trigger is explicit audience targeting (e.g., "for developers", "targeting millennials", "aimed at executives").
${frameworks['COVAR'].applicationGuide}

### 6. CRAFT (General Purpose)
Use when: Tasks that don't fit other categories. Planning, organization, communication, instructions, personal writing, general emails, miscellaneous requests.
${frameworks['CRAFT'].applicationGuide}

## Selection Rules

**Priority Order (check in this EXACT order):**

0. **INVALID/VAGUE INPUT → Request Clarification**
   If input is empty, nonsensical, under 3 words with no clear intent, or completely ambiguous:
   - Return a minimal placeholder prompt asking for clarification
   - Ask 1-2 questions to understand the user's actual intent
   - Do NOT guess or hallucinate complex prompts from vague input
   Examples of vague input: "help", "do something", "make it better", "idk", gibberish

1. **SHORT + SINGLE ACTION → RACE**
   If input is under 20 words AND has a single clear action → RACE
   Must have identifiable verb + object (e.g., "summarize this", "translate to French", "explain quantum computing")
   (Check this FIRST, regardless of topic keywords)

2. **ALREADY STRUCTURED → MINIMAL**
   If input has role definition, formatting, or specific constraints → MINIMAL
   Use if 2+ of these indicators apply:
   - Starts with "You are...", "Act as...", or similar role definition
   - Contains headers, bullets, or numbered lists
   - Specifies output format (e.g., "respond in JSON", "use markdown")
   - 50+ words with detailed, specific instructions
   
   **Concrete Examples (use MINIMAL for these):**
   - "You are a senior Python developer. Review this code for security issues. Output as a bulleted list."
   - "Act as a legal advisor. Explain this contract clause. Keep response under 200 words."
   - Input with markdown headers or structured formatting already present

3. **TECHNICAL → RISEN**
   If request involves code, data, logic, APIs, algorithms, debugging, system design → RISEN

4. **ANALYTICAL → ARIA**
   If request involves analysis, comparison, research, evaluation, decision-making, investigation → ARIA

5. **EXPLICIT AUDIENCE TARGETING → COVAR**
   If request EXPLICITLY mentions a target audience or demographic → COVAR
   Trigger phrases: "for [audience]", "targeting [demographic]", "aimed at [group]", "to convince [people]"
   Also use for: marketing campaigns, sales copy, persuasive content with clear audience
   **Note:** General creative writing without explicit audience → use CRAFT instead

6. **EVERYTHING ELSE → CRAFT**
   General tasks, planning, communication, organization, instructions, personal writing, general emails → CRAFT
   This is the default for anything that doesn't match above categories.

## Multi-Intent Handling

When a request spans multiple categories (e.g., "Write Python code to analyze sales data and create a comparison report"):
1. Identify the PRIMARY goal (what is the main deliverable?)
2. Choose framework based on primary goal
3. Incorporate relevant elements from secondary frameworks as needed
Example: Code + Analysis → RISEN (primary: code), but include ARIA-style comparison structure in the output

## Critical: Proportionality

- A 5-word request should NOT produce a 500-word prompt
- Short input → short output. Long input → can be longer output.
- Do NOT add structure for structure's sake

## Your Task
1. Check for invalid/vague input first (tier 0)
2. Count the words in the user's request
3. Check the priority order top-to-bottom
4. Select the FIRST matching framework
5. Apply that framework's structure
6. Report which framework you used`;

  let finalPrompt = corePrompt.replace('{{FRAMEWORK_CONTEXT}}', frameworkContext);

  const outputRules = isRefining ? OUTPUT_FORMAT_REFINEMENT : OUTPUT_FORMAT_INITIAL;
  finalPrompt += `\n\n${outputRules}`;

  return finalPrompt;
};
