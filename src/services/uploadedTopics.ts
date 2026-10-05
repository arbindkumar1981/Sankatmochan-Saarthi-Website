import type { BoardType, ClassGrade, LearningContent, SubjectMeta, TopicMeta } from '../types';
import { matchesMaterialSelection } from './savedMaterials';

const normalized = (title: string) => title.trim().normalize('NFKC').toLocaleLowerCase();

export function uploadedTopic(content: LearningContent): TopicMeta | null {
  const title = (content.topicTitle || (content.storagePath || content.attachmentUrl ? content.title : '')).trim();
  if (!title) return null;
  return { id: content.topicId || `material-${content.id}`, title, hindiTitle: content.topicTitle ? content.topicTitle : content.hindiTitle || title, order: 0 };
}

export function withUploadedTopics(subjects: SubjectMeta[], contents: (LearningContent & { deleted?: boolean })[], board: BoardType, grade: ClassGrade, hidden: Set<string>): SubjectMeta[] {
  const published = contents.filter(c => c.board === board && c.classGrade === grade && c.approved && c.published && !c.deleted && c.status !== 'ARCHIVED' && !hidden.has(`learning_contents/${c.id}`));
  return subjects.map(subject => ({ ...subject, chapters: subject.chapters.map(chapter => {
    const topics = [...chapter.topics];
    for (const content of published) {
      if (!matchesMaterialSelection(content, subject, chapter)) continue;
      const topic = uploadedTopic(content);
      if (!topic || topics.some(t => normalized(t.title) === normalized(topic.title))) continue;
      if (topics.some(t => t.id === topic.id)) topic.id = `material-${content.id}`;
      topics.push({ ...topic, order: topics.length + 1 });
    }
    return { ...chapter, topics };
  }) }));
}

export function matchesUploadedTopic(content: LearningContent, topic: TopicMeta): boolean {
  const uploaded = uploadedTopic(content);
  return Boolean(uploaded && (topic.id === `material-${content.id}` || normalized(uploaded.title) === normalized(topic.title))) || (!content.topicTitle && content.topicId === topic.id);
}
