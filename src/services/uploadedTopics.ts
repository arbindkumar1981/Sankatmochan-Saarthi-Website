import type { BoardType, ClassGrade, LearningContent, SubjectMeta, TopicMeta } from '../types';
import { matchesMaterialSelection } from './savedMaterials';

const normalized = (title: string) => title.trim().normalize('NFKC').toLocaleLowerCase();
const materialTopicId = (id: string) => {
  const candidate = `material-${id}`;
  if (/^[a-zA-Z0-9_-]{1,128}$/.test(candidate)) return candidate;
  let hash = 2166136261;
  for (const character of id) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  return `material-${id.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 100)}-${(hash >>> 0).toString(16)}`;
};

export function uploadedTopic(content: LearningContent): TopicMeta | null {
  const title = (content.topicTitle || (content.storagePath || content.attachmentUrl ? content.title : '')).trim();
  if (!title) return null;
  return { id: content.topicId || materialTopicId(content.id), title, hindiTitle: content.topicTitle ? content.topicTitle : content.hindiTitle || title, order: 0 };
}

export function withUploadedTopics(subjects: SubjectMeta[], contents: (LearningContent & { deleted?: boolean })[], board: BoardType, grade: ClassGrade, hidden: Set<string>, savedSubjects: SubjectMeta[] = subjects): SubjectMeta[] {
  const published = contents.filter(c => c.board === board && c.classGrade === grade && c.approved && c.published && !c.deleted && c.status !== 'ARCHIVED' && !hidden.has(`learning_contents/${c.id}`));
  return subjects.map(subject => {
    const usedIds = new Set(subject.chapters.flatMap(ch => ch.topics.map(t => t.id)));
    return { ...subject, chapters: subject.chapters.map(chapter => {
    const topics = chapter.topics.map(topic => ({ ...topic, ...(topic.materialIds ? { materialIds: [...topic.materialIds] } : {}) }));
    const savedChapter = savedSubjects.find(s => s.id === subject.id)?.chapters.find(ch => ch.id === chapter.id);
    for (const content of published) {
      if (!matchesMaterialSelection(content, subject, chapter)) continue;
      const topic = uploadedTopic(content);
      if (!topic) continue;
      const savedTopic = savedChapter?.topics.find(t => t.materialIds?.includes(content.id) || normalized(t.title) === normalized(topic.title));
      if (savedTopic?.deleted) continue;
      const existing = topics.find(t => (savedTopic && t.id === savedTopic.id) || t.materialIds?.includes(content.id) || normalized(t.title) === normalized(topic.title));
      if (existing) {
        existing.materialIds = [...new Set([...(existing.materialIds || []), content.id])];
        continue;
      }
      if (usedIds.has(topic.id)) topic.id = materialTopicId(content.id);
      usedIds.add(topic.id);
      topics.push({ ...topic, materialIds: [content.id], order: topics.length + 1 });
    }
    return { ...chapter, topics };
  }) };
  });
}

export function editableUploadedSubject(subject: SubjectMeta, contents: LearningContent[], hidden: Set<string>): SubjectMeta {
  let editable = structuredClone(subject);
  for (const grade of subject.classes) editable = withUploadedTopics([editable], contents, subject.board || 'CBSE', grade, hidden)[0];
  return editable;
}

export function matchesUploadedTopic(content: LearningContent, topic: TopicMeta): boolean {
  if (topic.materialIds?.includes(content.id)) return true;
  const uploaded = uploadedTopic(content);
  return Boolean(uploaded && (topic.id === `material-${content.id}` || normalized(uploaded.title) === normalized(topic.title))) || (!content.topicTitle && content.topicId === topic.id);
}
