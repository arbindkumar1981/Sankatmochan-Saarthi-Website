import type { SubjectMeta, BoardType, ClassGrade, StreamType } from '../types';

export function validateSubject(subject: SubjectMeta): SubjectMeta {
  const ids = new Set<string>();
  const identity = (id: string) => {
    // Earlier bundled catalogue IDs contain "class 9" through "class 12".
    // Keep those identities editable without permitting arbitrary spaced IDs.
    const legacyCatalogueId = typeof id === 'string' && id.length <= 128 && /^cbse-class (9|10|11|12)-[a-z0-9_-]+$/.test(id);
    if (typeof id !== 'string' || (!/^[a-zA-Z0-9_-]{1,128}$/.test(id) && !legacyCatalogueId) || ids.has(id)) throw new Error('Invalid or duplicate curriculum identity.');
    ids.add(id);
  };
  identity(subject.id);
  if (typeof subject.name !== 'string' || !subject.name.trim() || subject.name.length > 160 || typeof subject.hindiName !== 'string' || subject.hindiName.length > 160 || !subject.classes?.length || subject.classes.length > 100 || typeof subject.stream !== 'string') throw new Error('Subject name, class and stream are required.');
  if (!Array.isArray(subject.chapters) || subject.chapters.length > 200) throw new Error('Invalid chapter list.');
  for (const chapter of subject.chapters) {
    identity(chapter.id);
    if (!chapter.title?.trim() || chapter.title.length > 300 || typeof chapter.hindiTitle !== 'string' || !Number.isInteger(chapter.chapterNumber) || chapter.chapterNumber < 1 || !Array.isArray(chapter.topics) || chapter.topics.length > 200) throw new Error('Invalid chapter.');
    for (const topic of chapter.topics) {
      identity(topic.id);
      if (!topic.title?.trim() || topic.title.length > 300 || typeof topic.hindiTitle !== 'string' || !Number.isInteger(topic.order) || topic.order < 1) throw new Error('Invalid topic.');
      if (topic.materialIds !== undefined && (!Array.isArray(topic.materialIds) || topic.materialIds.length > 1000 || new Set(topic.materialIds).size !== topic.materialIds.length || topic.materialIds.some(id => typeof id !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(id)))) throw new Error('Invalid linked material identities.');
    }
  }
  if (new TextEncoder().encode(JSON.stringify(subject)).length > 700000) throw new Error('Subject is too large.');
  return subject;
}

export type ManagedCollection = 'learning_contents' | 'youtube_videos' | 'tests' | 'notices';
export function validateAdminRecord(collection: ManagedCollection, record: Record<string, any>) {
  if (!record.id || !/^[a-zA-Z0-9_-]{1,128}$/.test(record.id) || !record.title?.trim() || record.title.length > 300) throw new Error('A valid title and identity are required.');
  if (collection === 'notices') {
    if (!record.message?.trim() || !['motivational', 'academic', 'urgent'].includes(record.category)) throw new Error('Notice message and category are required.');
  } else {
    if (!record.board || !record.classGrade || !record.subjectId || (collection !== 'tests' && !record.chapterId)) throw new Error('Choose board, class, subject and chapter.');
    if (typeof record.approved !== 'boolean' || typeof record.published !== 'boolean') throw new Error('Invalid publishing setting.');
    if (record.published && !record.approved) throw new Error('Approve the item before publishing.');
  }
  if (collection === 'learning_contents' && (!Number.isInteger(record.version) || record.version < 1)) throw new Error('Content version must be a positive whole number.');
  if (collection === 'youtube_videos' && !/^[a-zA-Z0-9_-]{11}$/.test(record.youtubeId || '')) throw new Error('Use the 11-character YouTube video ID.');
  if (collection === 'tests') {
    if (!Array.isArray(record.questions) || !record.questions.length || record.questions.length > 200) throw new Error('Add at least one question.');
    const ids = new Set<string>();
    for (const question of record.questions) {
      if (!question.id || ids.has(question.id) || !question.questionText?.trim() || !Array.isArray(question.options) || question.options.length < 2 || question.options.length > 10 || question.options.some((x: unknown) => typeof x !== 'string' || !x.trim()) || !Number.isInteger(question.correctIndex) || question.correctIndex < 0 || question.correctIndex >= question.options.length || !Number.isFinite(question.marks) || question.marks <= 0) throw new Error('Check each question, options, correct answer and marks.');
      ids.add(question.id);
    }
    const marks = record.questions.reduce((sum: number, q: any) => sum + q.marks, 0);
    if (record.totalMarks !== marks || !Number.isFinite(record.passingMarks) || record.passingMarks < 0 || record.passingMarks > marks || !Number.isFinite(record.durationMinutes) || record.durationMinutes <= 0) throw new Error('Total marks must equal question marks. Check passing marks and duration.');
  }
  for (const [key, value] of Object.entries(record)) {
    if (typeof value === 'string' && value.length > 200000) throw new Error(`${key} is too long.`);
    if (['attachmentUrl', 'thumbnail'].includes(key) && value && (typeof value !== 'string' || !/^https:\/\//.test(value))) throw new Error('Use HTTPS image/file URLs.');
  }
  if (new TextEncoder().encode(JSON.stringify(record)).length > 700000) throw new Error('Content is too large. Upload a study file instead.');
  return record;
}

export function activeSubject(subject: SubjectMeta): SubjectMeta {
  return { ...subject, teacherSubject: subject.teacherSubject || subject.name, chapters: subject.chapters.filter(x => !x.deleted).map(ch => ({ ...ch, topics: ch.topics.filter(x => !x.deleted) })) };
}

export function subjectsForSelection(subjects: SubjectMeta[], board: BoardType, grade: ClassGrade, stream: StreamType, allStreams = false) {
  return subjects.filter(s => !s.deleted && (s.board || 'CBSE') === board && s.classes.includes(grade) &&
    (allStreams || !['Class 11', 'Class 12'].includes(grade) || s.stream === stream)).map(activeSubject);
}

export function mergeCurriculum(seed: SubjectMeta[], documents: { id: string; data: Record<string, any> }[]) {
  const overrides = new Map(documents.filter(d => d.data.kind === 'subject').map(d => [d.id, d.data]));
  const merged = seed.map(subject => {
    const override = overrides.get(subject.id);
    if (!override) return subject;
    const saved = override.subject as SubjectMeta | undefined;
    return {
      ...subject, ...saved,
      deleted: override.deleted === true || saved?.deleted === true,
      teacherSubject: saved?.teacherSubject || subject.name,
      chapters: saved && (override.chaptersExplicit === true || saved.chapters?.length) ? saved.chapters : subject.chapters
    };
  });
  const ids = new Set(seed.map(s => s.id));
  for (const [id, data] of overrides) if (!ids.has(id) && data.subject) merged.push({ ...data.subject, deleted: data.deleted === true || data.subject.deleted === true });
  return merged;
}

export function archiveRecord(collection: ManagedCollection, record: Record<string, any>) {
  if (record.deleted) return record;
  const archiveState = collection === 'notices' ? { active: record.active } : { approved: record.approved, published: record.published };
  return { ...record, archiveState, deleted: true, ...(collection === 'notices' ? { active: false } : { approved: false, published: false }) };
}
export function restoreRecord(collection: ManagedCollection, record: Record<string, any>) {
  return { ...record, ...(record.archiveState || (collection === 'notices' ? { active: true } : { approved: false, published: false })), deleted: false };
}

export function assetVisibility(collection: ManagedCollection, record: Record<string, any>) {
  return { kind: 'asset_visibility', collection, assetId: record.id, deleted: record.deleted === true,
    hidden: record.deleted === true || (collection === 'notices' ? !record.active : !record.approved || !record.published) };
}
export async function assetMarker(collection: ManagedCollection, id: string) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`${collection}/${id}`));
  return 'asset-' + Array.from(new Uint8Array(bytes)).map(x => x.toString(16).padStart(2, '0')).join('');
}
