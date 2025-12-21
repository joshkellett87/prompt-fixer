import { frameworks } from './frameworks';
import corePrompt from './content/core-system-prompt.md?raw';

// HARDCODED SAFETY RULES - DO NOT EDIT DYNAMICALLY
// The app relies on these specific tags to parse the response.
const OUTPUT_FORMAT_INITIAL = `
CRITICAL OUTPUT STRUCTURE:
1. Use [PROMPT_START] and [PROMPT_END] tags around the optimized prompt.
2. ONLY the final prompt to be copied goes inside these tags. NO CONVERSATIONAL FILLER.
3. Provide 3-5 refinement questions as a JSON array inside [QUESTIONS_START] and [QUESTIONS_END].
`;

const OUTPUT_FORMAT_REFINEMENT = `
CRITICAL OUTPUT STRUCTURE:
1. Use [PROMPT_START] and [PROMPT_END] tags around the optimized prompt.
2. ONLY the final prompt to be copied goes inside these tags.
3. Provide 0-3 refinement questions explicitly targeting remaining gaps.
   - If the prompt is high-quality and complete, return an empty array: []
   - ONLY ask if there is a critical missing piece of context.
   - Output questions inside [QUESTIONS_START] and [QUESTIONS_END].
`;

export const getSystemInstruction = (framework, isRefining = false) => {
  const isSmart = framework === 'SMART';
  
  let frameworkContext = '';

  if (isSmart) {
    frameworkContext = `SMART MODE: AUTO-SELECT STRATEGY
You must analyze the request and choose the best framework:

1. **CO-STAR** (Creative/Marketing)
   - Use for: Content creation, persuasion, audience-focused tasks.
   - Structure:
   ${frameworks['CO-STAR'].applicationGuide}

2. **RISEN** (Technical/Logical)
   - Use for: Coding, data analysis, complex instructions.
   - Structure:
   ${frameworks['RISEN'].applicationGuide}

3. **RACE** (Quick/Simple)
   - Use for: Summaries, simple queries, definitions.
   - Structure:
   ${frameworks['RACE'].applicationGuide}

INSTRUCTIONS:
1. Silently select the best fit.
2. Apply that framework's structure to your output.
3. Do NOT explain your choice.`;
  } else {
    // Specific framework selected
    const fw = frameworks[framework];
    frameworkContext = `ACTIVE FRAMEWORK: ${framework} (${fw.label})
    
    GUIDE:
    ${fw.applicationGuide}
    
    INSTRUCTIONS:
    Apply this structure strictly to the optimized prompt.`;
  }

  // Replace placeholder in markdown with actual logic
  let finalPrompt = corePrompt.replace('{{FRAMEWORK_CONTEXT}}', frameworkContext);
  
  // Append strict parsing rules based on phase
  const outputRules = isRefining ? OUTPUT_FORMAT_REFINEMENT : OUTPUT_FORMAT_INITIAL;
  finalPrompt += `\n\n${outputRules}`;

  return finalPrompt;
};
