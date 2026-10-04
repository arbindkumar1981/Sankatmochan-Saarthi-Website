export interface SavedMaterial { id: string; title: string; body: string; curriculum: string; savedAt: string }
export function prepareSavedMaterial(material: SavedMaterial): SavedMaterial {
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(material.id) || !material.title.trim() || material.title.length > 300 || !material.body.trim() || material.body.length > 200000 || material.curriculum.length > 1000 || material.savedAt.length > 40) throw new Error('Material is empty or too large to save.');
  return { id: material.id, title: material.title, body: material.body, curriculum: material.curriculum, savedAt: material.savedAt };
}
