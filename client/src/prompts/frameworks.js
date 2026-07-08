export const frameworks = {
  'CO-STAR': {
    label: 'Context, Objective, Style, Tone, Audience, Response',
    description: 'Best for business, marketing, and creative writing. High focus on persona and audience.',
    useCase: 'Professional & Creative',
    selectionCriteria: ['marketing', 'creative', 'persuasion', 'audience-aware', 'writing', 'blog', 'social media', 'email', 'content', 'copy', 'brand'],
    applicationGuide: `
### [C] Context - What is the background situation or problem?
### [O] Objective - What is the specific, measurable goal?
### [S] Style - What writing style? (Formal, casual, technical, journalistic, conversational)
### [T] Tone - What emotional register? (Authoritative, empathetic, witty, urgent, friendly)
### [A] Audience - Who is this for? Define their expertise level, concerns, and what they care about.
### [R] Response - What format, length, and constraints? (Markdown, 500 words max, include CTA, bullet points)
`
  },
  'RISEN': {
    label: 'Role, Instructions, Steps, End-goal, Narrowing',
    description: 'Best for technical tasks, coding, and logical analysis. Emphasizes precise, step-based instructions and tight scope.',
    useCase: 'Technical & Data',
    selectionCriteria: ['coding', 'programming', 'data analysis', 'technical', 'json', 'xml', 'script', 'logic', 'math', 'algorithm', 'function', 'api', 'database'],
    applicationGuide: `
### [R] Role - Acting as who? (Senior Engineer, Data Scientist, Security Analyst)
### [I] Instructions - What specific task to perform? Be precise and unambiguous.
### [S] Steps - The ordered steps to follow to complete the task. Where 1-2 concrete input→output examples would lock in the pattern, include them (few-shot is the single biggest lever for format reliability).
### [E] End-goal - What does success look like? Define the desired outcome and output format (Table, Code block, JSON schema, etc.).
### [N] Narrowing - Constraints, edge cases, and scope limits that focus the response. Only add explicit "reason step-by-step" cues when the task needs genuine multi-step decomposition.
`
  },
  'RACE': {
    label: 'Role, Action, Context, Expectation',
    description: 'A streamlined framework for quick summaries, simple queries, or utility requests where full structure would be overkill.',
    useCase: 'Quick Tasks',
    selectionCriteria: ['summary', 'simple', 'quick', 'brief', 'explanation', 'definition', 'translate', 'convert'],
    applicationGuide: `
### [R] Role - Who is performing the task? (Keep brief)
### [A] Action - What specific action to take? (One clear verb)
### [C] Context - Why is this needed? What is the user's situation?
### [E] Expectation - What does the final result look like? (Length, format)
`
  }
};
