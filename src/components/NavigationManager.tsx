import { useWebsite } from '../context/WebsiteContext';
import { WebsiteText } from '../context/WebsiteContext';
import { useState } from 'react';
import { DEFAULT_WEBSITE_CONFIG, managedNavigation, type WebsiteConfig, type WebsiteOption, type WebsitePage } from '../services/websiteConfig';
import { DEFAULT_ICONS, NAVIGATION_ICONS, PROTECTED_NAVIGATION, moveMenuItem, type NavigationIcon } from '../services/navigationAppearance';
import { MenuIcon } from './MenuIcon';

const field = 'w-full min-w-0 border rounded-lg p-2 text-sm bg-white';
const button = 'border rounded-lg px-3 py-2 text-xs font-semibold hover:bg-orange-50 disabled:opacity-40';
export function NavigationManager({ draft, update }: { draft: WebsiteConfig; update: (patch: Partial<WebsiteConfig>) => void }) {
  const { text: websiteText } = useWebsite();
  const [group, setGroup] = useState<'navigation' | 'modules' | 'pages'>('navigation');
  const [search, setSearch] = useState('');
  const [removed, setRemoved] = useState(false);
  const [editing, setEditing] = useState('');
  const rows: (WebsiteOption | WebsitePage)[] = group === 'navigation' ? managedNavigation(draft.navigation) : draft[group];
  const patch = (itemId: string, changes: object) => update({ [group]: rows.map(row => row.id === itemId ? { ...row, ...changes } : row) });
  const title = (row: WebsiteOption | WebsitePage) => 'label' in row ? row.label : row.title;
  const add = () => {
    const itemId = `${group === 'pages' ? 'page' : 'resource'}-${crypto.randomUUID()}`;
    if (group === 'navigation') { setGroup('pages'); update({ pages: [...draft.pages, { id: itemId, title: 'New page', hindiTitle: '', body: '', hindiBody: '', icon: 'info' }] }); }
    else if (group === 'pages') update({ pages: [...draft.pages, { id: itemId, title: 'New page', hindiTitle: '', body: '', hindiBody: '', icon: 'info' }] });
    else update({ modules: [...draft.modules, { id: itemId, label: 'New learning resource', hindiLabel: '', icon: 'file' }] });
    setEditing(itemId); setRemoved(false); setSearch('');
  };
  return <div className="space-y-4">
    <div className="flex flex-wrap gap-2" aria-label={websiteText("Menu groups")}>
      {([['navigation', 'Main navigation'], ['modules', 'Learning menu'], ['pages', 'Custom pages']] as const).map(([key, label]) => <button key={key} className={`${button} ${group === key ? 'bg-orange-100' : ''}`} aria-pressed={group === key} onClick={() => { setGroup(key); setEditing(''); setSearch(''); }}>{websiteText(label)}</button>)}
    </div>
    <p className="text-sm text-stone-600"><WebsiteText original={"Edit names and icons, arrange the order, or remove items from the website. Removed items stay available in Restore. New navigation items open custom pages."} /></p>
    <div className="flex flex-wrap gap-2 items-center">
      <input className={`${field} sm:max-w-xs`} aria-label={websiteText("Search menu controls")} placeholder={websiteText("Find a menu item")} value={search} onChange={e => setSearch(e.target.value)} />
      <button className={button} aria-pressed={removed} onClick={() => { setRemoved(!removed); setEditing(''); }}>{removed ? <WebsiteText original={"Show active items"} /> : <WebsiteText original={"Removed items / Restore"} />}</button>
      <button className={`${button} bg-orange-600 text-white`} onClick={add}>{group === 'modules' ? <WebsiteText original={"Add learning resource"} /> : <WebsiteText original={"Add navigation page"} />}</button>
    </div>
    {!rows.some(row => Boolean(row.deleted) === removed && title(row).toLowerCase().includes(search.toLowerCase())) && <p className="text-sm text-stone-500"><WebsiteText original={"No matching items."} /></p>}
    {rows.map((row, index) => {
      if (Boolean(row.deleted) !== removed || !title(row).toLowerCase().includes(search.toLowerCase())) return null;
      const protectedItem = group === 'navigation' && PROTECTED_NAVIGATION.includes(row.id);
      const original = group === 'pages' ? undefined : DEFAULT_WEBSITE_CONFIG[group].find(x => x.id === row.id);
      return <article key={row.id} className="border rounded-xl p-3 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0"><MenuIcon icon={row.icon} itemId={row.id} className="w-5 h-5 shrink-0 text-orange-700" /><div><h4 className="font-semibold break-words">{title(row)}</h4><p className="text-xs text-stone-500">{group === 'pages' ? <WebsiteText original={"Custom website page"} /> : protectedItem ? <WebsiteText original={"Protected access"} /> : group === 'modules' ? <WebsiteText original={"Learning resource"} /> : <WebsiteText original={"Website section"} />}</p></div></div>
          <div className="flex flex-wrap gap-2">
            <button className={button} aria-label={`Move ${title(row)} up`} disabled={index === 0} onClick={() => update({ [group]: moveMenuItem(rows, index, -1) })}><WebsiteText original={"↑ Up"} /></button>
            <button className={button} aria-label={`Move ${title(row)} down`} disabled={index === rows.length - 1} onClick={() => update({ [group]: moveMenuItem(rows, index, 1) })}><WebsiteText original={"↓ Down"} /></button>
            <button className={button} onClick={() => setEditing(editing === row.id ? '' : row.id)}>{editing === row.id ? <WebsiteText original={"Close editor"} /> : <WebsiteText original={"Edit / Replace"} />}</button>
            <button className={button} disabled={protectedItem} title={protectedItem ? 'Dashboard and Admin access remain available' : undefined} onClick={() => patch(row.id, { deleted: !row.deleted })}>{row.deleted ? <WebsiteText original={"Restore"} /> : <WebsiteText original={"Remove"} />}</button>
          </div>
        </div>
        {editing === row.id && <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t pt-3">
          <label className="text-sm"><WebsiteText original={"Name"} /><input className={field} aria-label={`Menu name ${row.id}`} maxLength={160} value={title(row)} onChange={e => patch(row.id, 'label' in row ? { label: e.target.value } : { title: e.target.value })} /></label>
          <label className="text-sm"><WebsiteText original={"Hindi name"} /><input className={field} maxLength={160} value={'label' in row ? row.hindiLabel : row.hindiTitle} onChange={e => patch(row.id, 'label' in row ? { hindiLabel: e.target.value } : { hindiTitle: e.target.value })} /></label>
          <label className="text-sm"><WebsiteText original={"Replace icon"} /><select className={field} aria-label={`Menu icon ${row.id}`} value={row.icon || DEFAULT_ICONS[row.id] || 'info'} onChange={e => patch(row.id, { icon: e.target.value as NavigationIcon })}>{NAVIGATION_ICONS.map(icon => <option key={icon} value={icon}>{icon.charAt(0).toUpperCase() + icon.slice(1)}</option>)}</select></label>
          <div className="flex items-end gap-2"><button className={button} onClick={() => patch(row.id, { icon: DEFAULT_ICONS[row.id] || 'info' })}><WebsiteText original={"Restore original icon"} /></button>{original && <button className={button} onClick={() => patch(row.id, { label: original.label, hindiLabel: original.hindiLabel, icon: DEFAULT_ICONS[row.id] || 'info', subtitle: '', hindiSubtitle: '' })}><WebsiteText original={"Restore original names"} /></button>}</div>
          {'label' in row && group === 'navigation' && <>
            <label className="text-sm"><WebsiteText original={"Description"} /><input className={field} maxLength={160} value={row.subtitle ?? ''} onChange={e => patch(row.id, { subtitle: e.target.value })} /></label>
            <label className="text-sm"><WebsiteText original={"Hindi description"} /><input className={field} maxLength={160} value={row.hindiSubtitle ?? ''} onChange={e => patch(row.id, { hindiSubtitle: e.target.value })} /></label>
          </>}
          {'body' in row && <><label className="text-sm sm:col-span-2"><WebsiteText original={"Page content"} /><textarea className={field} rows={5} maxLength={20000} value={row.body} onChange={e => patch(row.id, { body: e.target.value })} /></label><label className="text-sm sm:col-span-2"><WebsiteText original={"Hindi page content"} /><textarea className={field} rows={5} maxLength={20000} value={row.hindiBody} onChange={e => patch(row.id, { hindiBody: e.target.value })} /></label></>}
        </div>}
      </article>;
    })}
    <p className="text-xs text-stone-500"><WebsiteText original={"Save website changes to apply these edits. Admin visibility remains restricted to administrators."} /></p>
  </div>;
}
