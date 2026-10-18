import { NAVIGATION_ICONS, type NavigationIcon } from './navigationAppearance';
import type { WebsiteConfig } from './websiteConfig';
export const CMS_ROUTES = ['home','courses','learning','youtube','notices','evaluation','about','contact'] as const;
export type CmsEntry = { id: string; parent: string | null; kind: 'menu'|'page'|'section'|'banner'|'card'; route: string; icon: NavigationIcon; title: string; description: string; locale: 'en'|'hi'; visible: boolean; archived?: boolean; order: number; mediaId?: string | null };
export function parsePublished(value: unknown): CmsEntry[] {
  const rows = (value as {entries?: unknown})?.entries;
  if (!Array.isArray(rows) || rows.length > 200) throw new Error('Invalid published structure.');
  const ids = new Set<string>();
  for (const row of rows) {
    if (!row || typeof row.id !== 'string' || !/^[a-z][a-z0-9_-]{0,63}$/.test(row.id) || ids.has(row.id) || !CMS_ROUTES.includes(row.route) || !NAVIGATION_ICONS.includes(row.icon) || !['menu','page','section','banner','card'].includes(row.kind) || !['en','hi'].includes(row.locale) || typeof row.title !== 'string' || !row.title.trim() || row.title.length > 120 || typeof row.description !== 'string' || row.description.length > 2000 || typeof row.visible !== 'boolean' || !Number.isInteger(row.order) || row.order < 0 || row.order > 10000 || (row.mediaId && !/^[a-f0-9]{32}$/.test(row.mediaId))) throw new Error('Invalid published entry.');
    ids.add(row.id);
  }
  const parents = new Map(rows.map(row => [row.id,row.parent]));
  for (const row of rows) {
    const seen = new Set([row.id]); let parent = row.parent;
    while (parent) { if (!ids.has(parent) || seen.has(parent) || seen.size >= 4) throw new Error('Invalid published hierarchy.'); seen.add(parent); parent = parents.get(parent); }
  }
  return rows;
}
export function effectiveEntries(rows: CmsEntry[]) {
  const byId = new Map(rows.map(row => [row.id,row]));
  return rows.filter(row => { let item: CmsEntry | undefined = row; while (item) {if (!item.visible || item.archived) return false; item = item.parent ? byId.get(item.parent) : undefined;} return true; }).sort((a,b) => a.order-b.order);
}
export function overlayNavigation(config: WebsiteConfig, rows: CmsEntry[]): WebsiteConfig {
  const menus = rows.filter(row => row.kind === 'menu');
  const visible = new Set(effectiveEntries(rows).map(row => row.id));
  const navigation = config.navigation.map(item => {
    const en = menus.find(row => row.route === item.id && row.locale === 'en');
    const hi = menus.find(row => row.route === item.id && row.locale === 'hi');
    return en || hi ? { ...item, label: en?.title || item.label, hindiLabel: hi?.title || item.hindiLabel, icon: en?.icon || hi?.icon, deleted: !(en && visible.has(en.id) || hi && visible.has(hi.id)) } : item;
  });
  navigation.sort((a,b) => (menus.find(row => row.route === a.id)?.order ?? 10000)-(menus.find(row => row.route === b.id)?.order ?? 10000));
  return {...config,navigation};
}
export function cmsMediaUrl(mediaId: string): string {
  const tenant = import.meta.env.VITE_CMS_TENANT_ID || '';
  const base = import.meta.env.VITE_SAARTHI_API_URL || '';
  return `${base.replace(/\/$/, '')}/v1/control-center/published/${encodeURIComponent(tenant)}/media/${encodeURIComponent(mediaId)}`;
}
