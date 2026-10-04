export interface SavedMaterial { id: string; title: string; body: string; curriculum: string; savedAt: string }
export function matchesMaterialSelection(content: { subjectId: string; subjectName: string; chapterId: string; chapterTitle: string }, subject: { id: string; name: string; teacherSubject?: string }, chapter?: { id: string; title: string }) {
  if (content.subjectId === subject.id) return !chapter || content.chapterId === chapter.id;
  // Existing published records predate the 2026 catalogue IDs. Reuse only
  // their exact subject/chapter names; callers still enforce board/class/status.
  return Boolean(chapter && content.subjectName === (subject.teacherSubject || subject.name) && content.chapterTitle === chapter.title);
}
export function prepareSavedMaterial(material: SavedMaterial): SavedMaterial {
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(material.id) || !material.title.trim() || material.title.length > 300 || !material.body.trim() || material.body.length > 200000 || material.curriculum.length > 1000 || material.savedAt.length > 40) throw new Error('Material is empty or too large to save.');
  return { id: material.id, title: material.title, body: material.body, curriculum: material.curriculum, savedAt: material.savedAt };
}
