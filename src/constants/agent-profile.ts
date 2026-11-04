export type AgentSkillDefinition = {
  id: string
  name: string
  description: string
  instruction: string
}

export const AGENT_SKILLS: AgentSkillDefinition[] = [
  {
    id: 'obsidian-markdown',
    name: 'Obsidian Markdown Rules',
    description: 'Prefer wikilinks and keep note formatting consistent.',
    instruction:
      'Prefer Obsidian markdown conventions, including [[wikilinks]], and preserve note formatting when editing.',
  },
  {
    id: 'link-first-thinking',
    name: 'Link-First Knowledge Mapping',
    description: 'Suggest related notes before creating isolated content.',
    instruction:
      'Before drafting standalone content, suggest related notes and backlink opportunities when helpful.',
  },
  {
    id: 'safe-file-ops',
    name: 'Safe File Operations',
    description: 'Prefer reversible edits and avoid destructive actions.',
    instruction:
      'Use minimal reversible file edits and ask for confirmation before destructive file operations.',
  },
  {
    id: 'architectural-thinking',
    name: 'Architectural Thinking',
    description: 'Prioritize maintainability and avoid hidden technical debt.',
    instruction:
      'Prefer maintainable, non-breaking solutions and avoid introducing hidden technical debt.',
  },
]

export const AGENT_SKILL_INSTRUCTION_MAP = new Map(
  AGENT_SKILLS.map((skill) => [skill.id, skill.instruction]),
)
