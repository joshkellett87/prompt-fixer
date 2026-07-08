export const frameworks = {
  'MINIMAL': {
    label: 'Light Touch, Preserve Intent',
    description: 'For prompts that already have structure (role, formatting, constraints). Preserves existing structure with light polish only.',
    useCase: 'Well-Formed Prompts',
    applicationGuide: `
### MINIMAL Framework - Preserve, Don't Transform
Use when the input ALREADY has structure: a defined role, clear formatting, or specific constraints.

**Do:**
- Fix grammar, spelling, and clarity issues
- Improve word choice for precision
- Add missing punctuation or formatting
- Clarify ambiguous phrasing (if any)

**Do NOT:**
- Add a role if one already exists
- Add verbose success criteria
- Restructure into framework headers
- Expand brevity that was intentional
- Add placeholders for details left deliberately open

**Output:** The original prompt, lightly polished. If the input is already excellent, return it nearly unchanged.
`
  },
  'RACE': {
    label: 'Role, Action, Context, Expectation',
    description: 'For short, clear requests (under 15 words) that need light structuring. Adds brief role and expected output format.',
    useCase: 'Quick Tasks',
    applicationGuide: `
### RACE Framework - Quick & Focused
Use for short requests that are clear but lack structure. Keep output brief and proportional.

### [R] Role - Who is performing the task? (One sentence max, or skip if obvious)
### [A] Action - What specific action to take? (One clear verb)
### [C] Context - Why is this needed? (Brief, only if adds value)
### [E] Expectation - What does the final result look like? (Length, format)

**Output should be 1-4 sentences.** Do not over-engineer simple requests.
`
  },
  'RISEN': {
    label: 'Role, Instruction, Structure, Examples, Nuance',
    description: 'For technical tasks: coding, data analysis, APIs, algorithms. Emphasizes precision and clear output structure.',
    useCase: 'Technical & Data',
    applicationGuide: `
### RISEN Framework - Technical Precision
Use for coding, programming, data tasks, and technical documentation.

### [R] Role - Acting as who? (Senior Engineer, Data Scientist, Security Analyst)
### [I] Instruction - What specific commands to execute? Be precise and unambiguous.
### [S] Structure - How should the output be organized? (Table, Code block, List, JSON schema)
### [E] Examples (when helpful) - For pattern-based or transformation tasks, include 1-2 input→output pairs. **Skip for straightforward implementation** where the expected output is obvious (e.g., "write a function that calculates X").
### [N] Nuance - What constraints, edge cases, or reasoning approach? For complex logic, include "Think through your approach step-by-step before writing code."
`
  },
  'ARIA': {
    label: 'Angle, Research, Investigation, Assessment',
    description: 'For analytical and research tasks: comparisons, evaluations, decision-making, cause analysis.',
    useCase: 'Analysis & Research',
    applicationGuide: `
### ARIA Framework - Analytical Depth
Use for research, analysis, comparison, evaluation, and decision-making tasks.

### [A] Angle - What perspective or lens to analyze from? (Business impact, technical feasibility, user experience, cost-benefit, ethical considerations)
### [R] Research - What information needs to be gathered? What sources or data are relevant? What's the scope?
### [I] Investigation - What specific questions must be answered? What criteria for evaluation? What comparisons to make?
### [A] Assessment - How to evaluate and conclude? What format for findings? (Pros/cons list, recommendation with rationale, ranked options, decision matrix)

**Key principle:** Structured analysis over opinion. Evidence before conclusions.
`
  },
  'COVAR': {
    label: 'Context, Objective, Voice, Audience, Response',
    description: 'For creative and marketing content: blogs, emails, social media, persuasive writing. Focus on audience and voice.',
    useCase: 'Professional & Creative',
    applicationGuide: `
### COVAR Framework - Audience-Centered Content
Use for marketing, creative writing, persuasion, and audience-aware content.

### [C] Context - What is the background situation or problem?
### [O] Objective - What is the specific, measurable goal?
### [V] Voice - What personality, style, and tone? (formal/casual, authoritative/friendly, technical/accessible, witty/serious)
### [A] Audience - Who is this for? Define their expertise level, concerns, and what they care about.
### [R] Response - What format, length, and constraints? (Markdown, 500 words max, include CTA, bullet points)
`
  },
  'CRAFT': {
    label: 'Context, Role, Action, Format, Target',
    description: 'General-purpose framework for tasks that don\'t fit specialized categories. Planning, communication, organization, instructions.',
    useCase: 'General Tasks',
    applicationGuide: `
### CRAFT Framework - General Purpose
The default framework for tasks that don't fit specialized categories: planning, communication, organization, general instructions, personal writing, and miscellaneous requests.

### [C] Context - What is the situation or background? What does the AI need to know?
### [R] Role - Who should the AI act as? (Optional - only include if it adds value)
### [A] Action - What specific task needs to be accomplished? Be clear and direct.
### [F] Format - How should the output be structured? (Length, format, sections)
### [T] Target - What does success look like? What's the goal or desired outcome?

**Key principle:** Practical and flexible. Add structure where helpful, but don't force unnecessary components. If the user's intent is clear, keep the prompt lean.
`
  }
};
