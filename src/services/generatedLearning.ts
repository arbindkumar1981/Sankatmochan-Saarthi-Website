import type { FlashcardItem, LearningContent } from '../types';

function parse(content: string) {
  const clean = content.trim().replace(/^<think>[\s\S]*?<\/think>\s*/i, '').replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  try { return JSON.parse(clean); } catch { throw new Error('Generated learning material is not valid structured JSON. Please try again.'); }
}

export function parseGeneratedFlashcards(content: string): FlashcardItem[] {
  const value = parse(content);
  const cards = Array.isArray(value) ? value : value?.flashcards || value?.flashcardItems;
  if (!Array.isArray(cards) || !cards.length || cards.length > 100) throw new Error('Generate between 1 and 100 flashcards.');
  return cards.map((card, index) => {
    if (!card || typeof card.question !== 'string' || !card.question.trim() || typeof card.answer !== 'string' || !card.answer.trim() || card.question.length > 5000 || card.answer.length > 10000) throw new Error('Each flashcard needs a question and answer.');
    return { id: `generated-card-${index + 1}`, question: card.question, answer: card.answer,
      ...(typeof card.questionHindi === 'string' ? { questionHindi: card.questionHindi } : {}),
      ...(typeof card.answerHindi === 'string' ? { answerHindi: card.answerHindi } : {}),
      ...(typeof card.hint === 'string' ? { hint: card.hint } : {}) };
  });
}

export function parseGeneratedMindmap(content: string): NonNullable<LearningContent['mindmapNodes']> {
  const value = parse(content);
  const nodes = Array.isArray(value) ? value : value?.nodes || value?.mindmapNodes;
  if (!Array.isArray(nodes) || !nodes.length || nodes.length > 100) throw new Error('Generate between 1 and 100 mind-map nodes.');
  const ids = new Set<string>();
  for (const node of nodes) {
    if (!node || typeof node.id !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(node.id) || ids.has(node.id) || typeof node.label !== 'string' || !node.label.trim() || node.label.length > 300 || typeof node.description !== 'string' || node.description.length > 5000 || (node.children !== undefined && (!Array.isArray(node.children) || node.children.length > 100 || node.children.some((id: unknown) => typeof id !== 'string')))) throw new Error('Generated mind-map nodes are incomplete or duplicated.');
    ids.add(node.id);
  }
  for (const node of nodes) if ((node.children || []).some((id: string) => !ids.has(id) || id === node.id)) throw new Error('Generated mind-map connections reference an invalid node.');
  return nodes.map(node => ({ id: node.id, label: node.label, description: node.description, children: [...(node.children || [])] }));
}
