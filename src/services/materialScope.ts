import type { SubjectMeta } from '../types';

// Catalogue entries supply choices even before a material has been uploaded.
export function catalogueMaterialScopes(subjects: SubjectMeta[]): Record<string, unknown>[] {
  return subjects.filter(subject => !subject.deleted).flatMap(subject => subject.classes.flatMap(classGrade => {
    const base = { board: subject.board || 'CBSE', classGrade, stream: subject.stream, subjectId: subject.id };
    return [base, ...subject.chapters.filter(chapter => !chapter.deleted).flatMap(chapter => {
      const chapterScope = { ...base, chapterId: chapter.id };
      return [chapterScope, ...chapter.topics.filter(topic => !topic.deleted).map(topic => ({ ...chapterScope, topicTitle: topic.title }))];
    })];
  }));
}

export type MaterialScope = { board: string; classGrade: string; stream: string; subjectId: string; chapterId: string; topicTitle: string; subtopicTitle: string; contentType: string };
export const EMPTY_MATERIAL_SCOPE: MaterialScope = { board: '', classGrade: '', stream: '', subjectId: '', chapterId: '', topicTitle: '', subtopicTitle: '', contentType: '' };
export const MATERIAL_SCOPE_KEYS = Object.keys(EMPTY_MATERIAL_SCOPE) as (keyof MaterialScope)[];
export function matchesMaterialScope(record: Record<string, unknown>, scope: MaterialScope) {
  return MATERIAL_SCOPE_KEYS.every(key => !scope[key] || record[key] === scope[key]);
}
export function changeMaterialScope(scope: MaterialScope, key: keyof MaterialScope, value: string): MaterialScope {
  const next = { ...scope, [key]: value };
  for (const lower of MATERIAL_SCOPE_KEYS.slice(MATERIAL_SCOPE_KEYS.indexOf(key) + 1)) next[lower] = '';
  return next;
}
export function materialScopeOptions(records: Record<string, unknown>[], scope: MaterialScope, key: keyof MaterialScope): string[] {
  const parents = MATERIAL_SCOPE_KEYS.slice(0, MATERIAL_SCOPE_KEYS.indexOf(key));
  return [...new Set(records.filter(record => parents.every(parent => !scope[parent] || record[parent] === scope[parent])).map(record => record[key]).filter((value): value is string => typeof value === 'string' && !!value))].sort((a,b) => a.localeCompare(b));
}
