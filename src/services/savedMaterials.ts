export interface SavedMaterial { id: string; title: string; body: string; curriculum: string; savedAt: string; contentId?: string }
// Older catalogue labels appended Hindi translations to their English names.
const catalogueName = (value: string) => value.replace(/\s*\([^()]*[\u0900-\u097f][^()]*\)\s*$/, '').trim().normalize('NFKC');
export function matchesMaterialSelection(content: { subjectId: string; subjectName: string; chapterId: string; chapterTitle: string }, subject: { id: string; name: string; teacherSubject?: string }, chapter?: { id: string; title: string }) {
  if (content.subjectId === subject.id) {
    if (!chapter || content.chapterId === chapter.id) return true;
    if (catalogueName(content.chapterTitle) === content.chapterTitle.trim().normalize('NFKC')) return false;
  }
  // Existing published records predate the 2026 catalogue IDs. Reuse only
  // their exact subject/chapter names; callers still enforce board/class/status.
  return Boolean(chapter && catalogueName(content.subjectName) === catalogueName(subject.teacherSubject || subject.name) && catalogueName(content.chapterTitle) === catalogueName(chapter.title));
}
export function prepareSavedMaterial(material: SavedMaterial): SavedMaterial {
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(material.id) || !material.title.trim() || material.title.length > 300 || (!material.body.trim() && !material.contentId) || material.body.length > 200000 || material.curriculum.length > 1000 || material.savedAt.length > 40 || (material.contentId !== undefined && !/^[a-zA-Z0-9_-]{1,128}$/.test(material.contentId))) throw new Error('Material is empty or too large to save.');
  return { id: material.id, title: material.title, body: material.body, curriculum: material.curriculum, savedAt: material.savedAt, ...(material.contentId ? { contentId: material.contentId } : {}) };
}
