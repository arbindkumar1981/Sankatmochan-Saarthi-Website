import { parseGeneratedFlashcards, parseGeneratedMindmap } from './generatedLearning';
import { parseGeneratedQuestions } from './testAssessment';

export const TEACHER_ASSETS = ['DETAILED_NOTES', 'REVISION_NOTES', 'DEFINITIONS_FORMULAE', 'MIND_MAP', 'FLASHCARDS', 'COMPETENCY', 'CASE_BASED', 'TEST'] as const;
export type TeacherAssetType = typeof TEACHER_ASSETS[number];
export interface TeacherArtifact {
  asset_type: TeacherAssetType; topic_id: string; language: string; content: string;
  provenance: Array<{ source: string; verification_status?: string; source_url?: string; evidence_fingerprint?: string; knowledge_id?: string }>;
}
export function validateTeacherArtifact(value: unknown, expected?: { asset_type: string; topic_id: string; language: string }): TeacherArtifact {
  const data = value as TeacherArtifact;
  if (!data || !TEACHER_ASSETS.includes(data.asset_type) || typeof data.topic_id !== 'string' || !data.topic_id ||
      typeof data.language !== 'string' || !data.language || typeof data.content !== 'string' || data.content.trim().length < 20 || data.content.length > 190000 ||
      !Array.isArray(data.provenance) || !data.provenance.length || data.provenance.length > 20 ||
      data.provenance.some(source => !source || typeof source.source !== 'string' || !source.source.trim() || source.source.length > 1000) ||
      (expected && (data.asset_type !== expected.asset_type || data.topic_id !== expected.topic_id || data.language !== expected.language))) {
    throw new Error('Teacher returned incomplete or mismatched learning material. Please try again.');
  }
  if (data.asset_type === 'FLASHCARDS') parseGeneratedFlashcards(data.content);
  if (data.asset_type === 'MIND_MAP') parseGeneratedMindmap(data.content);
  if (data.asset_type === 'TEST') parseGeneratedQuestions(data.content);
  return { asset_type: data.asset_type, topic_id: data.topic_id, language: data.language, content: data.content,
    provenance: data.provenance.map(source => ({ source: source.source,
      ...Object.fromEntries(['verification_status', 'source_url', 'evidence_fingerprint', 'knowledge_id'].flatMap(key => {
        const value = source[key as keyof typeof source];
        return typeof value === 'string' && value.length <= 2000 ? [[key, value]] : [];
      })) })) };
}

// Stored inside the existing owner-private body field; no rules/schema migration.
// This is a personal study copy, never an administrator-approved KB publication.
const PREFIX = 'SAARTHI_STUDY_COPY_V1\n';
export function encodeTeacherArtifact(value: TeacherArtifact): string {
  const body = PREFIX + JSON.stringify(validateTeacherArtifact(value));
  if (body.length > 200000) throw new Error('Material is too large to save.');
  return body;
}
export function readTeacherArtifact(body: string): TeacherArtifact | undefined {
  if (!body.startsWith(PREFIX)) return undefined;
  try { return validateTeacherArtifact(JSON.parse(body.slice(PREFIX.length))); } catch { return undefined; }
}
export function teacherArtifactText(artifact: TeacherArtifact): string {
  if (artifact.asset_type === 'FLASHCARDS') return parseGeneratedFlashcards(artifact.content).map(card => `${card.question}\n${card.answer}`).join('\n\n');
  if (artifact.asset_type === 'MIND_MAP') return parseGeneratedMindmap(artifact.content).map(node => `${node.label}\n${node.description}\n${node.children?.join(' → ') || ''}`).join('\n\n');
  if (artifact.asset_type === 'TEST') return parseGeneratedQuestions(artifact.content).map((question, index) => `${index + 1}. ${question.questionText}\n${question.options?.map((option, i) => `${i + 1}. ${option}`).join('\n')}\nAnswer: ${Number(question.correctIndex) + 1}\n${question.explanation}`).join('\n\n');
  return artifact.content;
}
