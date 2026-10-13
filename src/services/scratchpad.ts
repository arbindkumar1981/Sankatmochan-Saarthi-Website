export function readScratchpad(storage: Pick<Storage, 'getItem'>, key: string): string[] {
  try {
    const value = JSON.parse(storage.getItem(key) || '[]');
    if (!Array.isArray(value)) return [];
    return value.filter(note => typeof note === 'string' && note.trim() && note.length <= 5000).slice(0, 100);
  } catch { return []; }
}
export const scratchpadKey = (uid?: string) => `saarthi_video_notes_v1:${uid || 'guest'}`;
