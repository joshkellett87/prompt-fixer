export const frameworks = {
  'CO-STAR': {
    label: 'Context, Objective, Style, Tone, Audience, Response',
    description: 'Best for business, marketing, and creative writing. High focus on persona and audience.',
    useCase: 'Professional & Creative',
    selectionCriteria: ['marketing', 'creative', 'persuasion', 'audience-aware', 'writing', 'blog', 'social media', 'email'],
    applicationGuide: `
### [C] Context - What is the background situation?
### [O] Objective - What is the specific, measurable goal?
### [S] Style - What writing style? (Formal, casual, technical, journalistic)
### [T] Tone - What emotional register? (Authoritative, empathetic, witty)
### [A] Audience - Who is this for? (Experts, beginners, stakeholders)
### [R] Response - What is the exact format? (Markdown, JSON, Email)
`
  },
  'RISEN': {
    label: 'Role, Instruction, Structure, Examples, Nuance',
    description: 'Best for technical tasks, coding, and logical analysis. High focus on data formats.',
    useCase: 'Technical & Data',
    selectionCriteria: ['coding', 'programming', 'data analysis', 'technical', 'json', 'xml', 'script', 'logic', 'math'],
    applicationGuide: `
### [R] Role - Acting as who? (Senior Engineer, Data Scientist)
### [I] Instruction - What specific commands to execute?
### [S] Structure - How should the output be organized? (Table, Code block, List)
### [E] Examples - Provide a few-shot example of the desired output.
### [N] Nuance - What constraints or edge cases must be handled?
`
  },
  'RACE': {
    label: 'Role, Action, Context, Expectation',
    description: 'A streamlined framework for quick summaries, email drafts, or simple utility requests.',
    useCase: 'Quick Tasks',
    selectionCriteria: ['summary', 'simple', 'quick', 'brief', 'explanation', 'definition'],
    applicationGuide: `
### [R] Role - Who is performing the task?
### [A] Action - What specific action to take?
### [C] Context - Why is this needed? What is the user's intent?
### [E] Expectation - What does the final result look like?
`
  }
};
