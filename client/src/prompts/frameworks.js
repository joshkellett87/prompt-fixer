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
    label: 'Role, Instruction, Structure, Examples, Nuance',
    description: 'Best for technical tasks, coding, and logical analysis. Emphasizes precision and few-shot learning.',
    useCase: 'Technical & Data',
    selectionCriteria: ['coding', 'programming', 'data analysis', 'technical', 'json', 'xml', 'script', 'logic', 'math', 'algorithm', 'function', 'api', 'database'],
    applicationGuide: `
### [R] Role - Acting as who? (Senior Engineer, Data Scientist, Security Analyst)
### [I] Instruction - What specific commands to execute? Be precise and unambiguous.
### [S] Structure - How should the output be organized? (Table, Code block, List, JSON schema)
### [E] Examples - Demonstrate the exact transformation with 1-2 input→output pairs. This is critical for technical tasks—show the AI the pattern you want through few-shot learning.
### [N] Nuance - What constraints, edge cases, or reasoning approach? For complex logic, include "Think through your approach step-by-step before writing code."
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
