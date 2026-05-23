export const extendedThoughtSeedQuestions = [
  'What tools have people used to extend thought?',
  'When does a tool become part of thinking?',
  'How have computers changed the shape of thought?',
  'What is brain augmentation trying to solve?',
] as const;

const extendedThoughtScopeTerms = [
  'ai',
  'augment',
  'augmentation',
  'brain',
  'cognition',
  'cognitive',
  'computer',
  'computers',
  'extended',
  'intelligence',
  'internet',
  'language model',
  'machine',
  'machines',
  'memory',
  'mind',
  'note',
  'notes',
  'notebook',
  'notebooks',
  'think',
  'thinking',
  'thought',
  'tool',
  'tools',
  'writing',
] as const;

export const extendedThoughtBoundaryMessage =
  'This MVP only has one topic loaded: tools, machines, and ideas that extend thought. In a full Continuum, your question should be valid. For now, try asking it through that lens.';

export function isExtendedThoughtSeedQuestion(value: string): value is typeof extendedThoughtSeedQuestions[number] {
  return extendedThoughtSeedQuestions.some((question) => question === value);
}

export function isExtendedThoughtQuestionInScope(value: string): boolean {
  const normalized = normalizePublicQuestion(value);
  if (!normalized) return false;
  if (isExtendedThoughtSeedQuestion(value.trim())) return true;
  const tokens = new Set(normalized.split(/[^a-z0-9]+/).filter(Boolean));

  return extendedThoughtScopeTerms.some((term) =>
    term.includes(' ') ? normalized.includes(term) : tokens.has(term),
  );
}

export function publicQuestionId(question: string): string {
  return `query:${normalizePublicQuestion(question)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')}`;
}

function normalizePublicQuestion(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}
