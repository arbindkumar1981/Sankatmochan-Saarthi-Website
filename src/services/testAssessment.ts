import type { EvaluationTest, SubjectMeta, TestQuestion } from '../types';

export function mapLegacyTest(test: EvaluationTest, legacy: SubjectMeta[], current: SubjectMeta[]): EvaluationTest {
  if (current.some(s => s.id === test.subjectId)) return test;
  const source = legacy.find(s => s.id === test.subjectId && s.classes.includes(test.classGrade));
  if (!source || test.board !== 'CBSE') return test;
  if (!source.officialCode) return test;
  const targets = current.filter(s => (s.board || 'CBSE') === test.board && s.classes.includes(test.classGrade) && s.officialCode === source.officialCode && s.stream === source.stream);
  if (targets.length !== 1) return test;
  const target = targets[0];
  const chapter = source.chapters.find(c => c.id === test.chapterId);
  const chapterTitle = (title?: string) => title?.replace(/\s*\([^)]*[\u0900-\u097f][^)]*\)/g, '').trim().toLowerCase();
  const chapters = target.chapters.filter(c => chapterTitle(c.title) === chapterTitle(chapter?.title) && !c.deleted);
  if (test.chapterId && chapters.length !== 1) return test;
  // Topic-specific legacy tests need an exact topic match as well.
  const topic = chapter?.topics.find(t => t.id === test.topicId);
  const topics = chapters[0]?.topics.filter(t => t.title === topic?.title && !t.deleted) || [];
  if (test.topicId && topics.length !== 1) return test;
  return { ...test, subjectId: target.id, chapterId: chapters[0]?.id, topicId: topics[0]?.id };
}

export function parseGeneratedQuestions(content: string): TestQuestion[] {
  const clean = content.trim().replace(/^<think>[\s\S]*?<\/think>\s*/i, '').replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  let value;
  try { value = JSON.parse(clean); } catch { throw new Error('Generated questions were incomplete or invalid. Please generate the test again.'); }
  const questions = Array.isArray(value) ? value : value.questions;
  if (!Array.isArray(questions) || !questions.length || questions.length > 50) throw new Error('Generated test has no valid questions. Please generate it again.');
  return questions.map((q, i) => {
    if (typeof q.questionText !== 'string' || !q.questionText.trim() || !Array.isArray(q.options) || q.options.length < 2 || q.options.length > 6 || q.options.some((o: unknown) => typeof o !== 'string' || !o.trim()) || !Number.isInteger(q.correctIndex) || q.correctIndex < 0 || q.correctIndex >= q.options.length || typeof q.explanation !== 'string' || !q.explanation.trim() || !Number.isFinite(q.marks) || q.marks <= 0 || q.marks > 10) throw new Error('Generated test contains an invalid question or answer key. Please generate it again.');
    return { id: `q${i + 1}`, questionText: q.questionText, options: q.options, correctIndex: q.correctIndex, explanation: q.explanation, marks: q.marks, ...(typeof q.questionHindi === 'string' ? { questionHindi: q.questionHindi } : {}), ...(typeof q.competencyTag === 'string' ? { competencyTag: q.competencyTag } : {}) };
  });
}
