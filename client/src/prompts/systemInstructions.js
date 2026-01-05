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
3. Provide 0-3 refinement questions explicitly targeting remaining gaps.
   - If the prompt is high-quality and complete, return an empty array: []
   - ONLY ask if there is a critical missing piece of context.
   - Output questions inside [QUESTIONS_START] and [QUESTIONS_END].
4. State which framework you used: [FRAMEWORK]FRAMEWORK_NAME[/FRAMEWORK] (use exactly: RACE, MINIMAL, RISEN, ARIA, COVAR, or CRAFT)
`;

// Always uses intelligent framework selection (SMART mode)
// The framework parameter is kept for backwards compatibility but ignored
export const getSystemInstruction = (framework, isRefining = false) => {
  const frameworkContext = `INTELLIGENT FRAMEWORK SELECTION

You must analyze each request and select the most appropriate framework. Apply the selected framework's structure to your output.

## Available Frameworks (6 total)

### 1. RACE (Quick/Simple)
Use when: Short requests (under 15 words) with a single clear action. Summaries, definitions, translations, simple explanations.
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
Use when: Marketing content, creative writing, persuasion, blogs, emails, social media, audience-focused content where AUDIENCE is a key factor.
${frameworks['COVAR'].applicationGuide}

### 6. CRAFT (General Purpose)
Use when: Tasks that don't fit other categories. Planning, organization, communication, instructions, personal writing, miscellaneous requests.
${frameworks['CRAFT'].applicationGuide}

## Selection Rules

**Priority Order (check in this EXACT order):**

1. **SHORT + CLEAR → RACE**
   If input is under 15 words AND has a single clear action → RACE
   (Check this FIRST, regardless of topic keywords)

2. **ALREADY STRUCTURED → MINIMAL**
   If input has role definition, formatting, or specific constraints → MINIMAL
   (Use if 2+ of these apply: starts with "You are...", has headers/bullets, specifies output format, 50+ words with details)

3. **TECHNICAL → RISEN**
   If request involves code, data, logic, APIs, algorithms → RISEN

4. **ANALYTICAL → ARIA**
   If request involves analysis, comparison, research, evaluation, decision-making → ARIA

5. **AUDIENCE-FOCUSED → COVAR**
   If request involves marketing, persuasion, OR explicitly mentions an audience to target → COVAR

6. **EVERYTHING ELSE → CRAFT**
   General tasks, planning, communication, organization, instructions, personal writing → CRAFT
   This is the default for anything that doesn't match above categories.

## Critical: Proportionality

- A 5-word request should NOT produce a 500-word prompt
- Short input → short output. Long input → can be longer output.
- Do NOT add structure for structure's sake

## Your Task
1. Count the words in the user's request
2. Check the priority order top-to-bottom
3. Select the FIRST matching framework
4. Apply that framework's structure
5. Report which framework you used`;

  let finalPrompt = corePrompt.replace('{{FRAMEWORK_CONTEXT}}', frameworkContext);

  const outputRules = isRefining ? OUTPUT_FORMAT_REFINEMENT : OUTPUT_FORMAT_INITIAL;
  finalPrompt += `\n\n${outputRules}`;

  return finalPrompt;
};
