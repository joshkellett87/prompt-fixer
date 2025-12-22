import { frameworks } from './frameworks';
import corePrompt from './content/core-system-prompt.md?raw';

// HARDCODED SAFETY RULES - DO NOT EDIT DYNAMICALLY
// The app relies on these specific tags to parse the response.
const OUTPUT_FORMAT_INITIAL = `
CRITICAL OUTPUT STRUCTURE:
1. Use [PROMPT_START] and [PROMPT_END] tags around the optimized prompt.
2. ONLY the final prompt to be copied goes inside these tags. NO CONVERSATIONAL FILLER.
3. Provide 3-5 refinement questions as a JSON array inside [QUESTIONS_START] and [QUESTIONS_END].
4. State which framework you used: [FRAMEWORK]FRAMEWORK_NAME[/FRAMEWORK] (use exactly: CO-STAR, RISEN, or RACE)
`;

const OUTPUT_FORMAT_REFINEMENT = `
CRITICAL OUTPUT STRUCTURE:
1. Use [PROMPT_START] and [PROMPT_END] tags around the optimized prompt.
2. ONLY the final prompt to be copied goes inside these tags.
3. Provide 0-3 refinement questions explicitly targeting remaining gaps.
   - If the prompt is high-quality and complete, return an empty array: []
   - ONLY ask if there is a critical missing piece of context.
   - Output questions inside [QUESTIONS_START] and [QUESTIONS_END].
4. State which framework you used: [FRAMEWORK]FRAMEWORK_NAME[/FRAMEWORK]
`;

// Always uses intelligent framework selection (SMART mode)
// The framework parameter is kept for backwards compatibility but ignored
export const getSystemInstruction = (framework, isRefining = false) => {
  const frameworkContext = `INTELLIGENT FRAMEWORK SELECTION

You must analyze each request and select the most appropriate framework. Apply the selected framework's structure to your output.

## Available Frameworks

### 1. CO-STAR (Creative/Marketing/Audience-Focused)
Use when: Content creation, persuasion, marketing, audience-aware writing, emails, blogs, social media.
${frameworks['CO-STAR'].applicationGuide}

### 2. RISEN (Technical/Logical/Data)
Use when: Coding, programming, data analysis, APIs, algorithms, technical documentation.
${frameworks['RISEN'].applicationGuide}

### 3. RACE (Quick/Simple/Utility)
Use when: Simple queries, quick summaries, definitions, translations, or requests under 15 words with clear intent.
${frameworks['RACE'].applicationGuide}

## Selection Rules

**Priority Order (when multiple could apply):**
1. If request involves code, data, logic, or technical output → RISEN
2. If request involves audience, persuasion, marketing, or creative content → CO-STAR
3. If request is simple (under 15 words) with a single clear action → RACE
4. When genuinely uncertain between CO-STAR and RISEN → default to CO-STAR (more versatile)

**Proportionality Override:**
- If the input is a simple factual question or trivial request, apply the framework's PRINCIPLES but do NOT generate verbose headers. Keep output proportional to input.

## Your Task
1. Analyze the user's request
2. Select the best framework using the rules above
3. Apply that framework's structure to your optimized prompt
4. Report which framework you used (see output format)`;

  let finalPrompt = corePrompt.replace('{{FRAMEWORK_CONTEXT}}', frameworkContext);

  const outputRules = isRefining ? OUTPUT_FORMAT_REFINEMENT : OUTPUT_FORMAT_INITIAL;
  finalPrompt += `\n\n${outputRules}`;

  return finalPrompt;
};
