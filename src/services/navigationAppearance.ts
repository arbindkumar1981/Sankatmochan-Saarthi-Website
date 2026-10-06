export const NAVIGATION_ICONS = ['book', 'video', 'bell', 'award', 'info', 'phone', 'shield', 'dashboard', 'file', 'bookmark', 'formula', 'mindmap', 'layers', 'history', 'target', 'table', 'test', 'home', 'users', 'settings'] as const;
export type NavigationIcon = typeof NAVIGATION_ICONS[number];
export const PROTECTED_NAVIGATION = ['materials', 'admin'];
export const DEFAULT_ICONS: Record<string, NavigationIcon> = { learning: 'book', youtube: 'video', notices: 'bell', evaluation: 'award', about: 'info', contact: 'phone', materials: 'dashboard', admin: 'shield', recommended_videos: 'video', detailed_notes: 'file', revision_notes: 'bookmark', formulae: 'formula', mindmaps: 'mindmap', flashcards: 'layers', pyqs: 'history', cbqs: 'target', case_studies: 'table', test_yourself: 'test' };
export function moveMenuItem<T>(rows: T[], index: number, direction: -1 | 1): T[] {
  const next = [...rows], target = index + direction;
  if (index < 0 || index >= rows.length || target < 0 || target >= rows.length) return next;
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}
export function validateMenuAppearance(item: { icon?: string; subtitle?: string; hindiSubtitle?: string }) {
  if (item.icon !== undefined && !NAVIGATION_ICONS.includes(item.icon as NavigationIcon)) throw new Error('Choose an icon from the menu icon library.');
  for (const key of ['subtitle', 'hindiSubtitle'] as const) if (item[key] !== undefined && (typeof item[key] !== 'string' || item[key]!.length > 160)) throw new Error('Menu descriptions must be shorter than 160 characters.');
}
