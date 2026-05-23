export const extendedThoughtSeedQuestions = [
  'What tools have people used to extend thought?',
  'When does a tool become part of thinking?',
  'How have computers changed the shape of thought?',
  'What is brain augmentation trying to solve?',
] as const;

export function isExtendedThoughtSeedQuestion(value: string): value is typeof extendedThoughtSeedQuestions[number] {
  return extendedThoughtSeedQuestions.some((question) => question === value);
}

export function publicQuestionId(question: string): string {
  return `query:${question
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')}`;
}
