import React, { useEffect, useState } from 'react';
import { auth } from '../services/firebase';
import { controlApi as api } from '../services/controlApi';
import { type CmsEntry, CMS_ROUTES } from '../services/publishedCms';
import { CmsMediaLibrary } from './CmsMediaLibrary';
import { draftDiff } from '../services/cmsDiff';
import { MenuIcon } from './MenuIcon';

type Entry = CmsEntry;
type Draft = { revision: number; entries: Entry[]; publishedEntries: Entry[]; state: string };
export function ControlCenter() {
  const [draft, setDraft] = useState<Draft>();
  const [capabilities, setCapabilities] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState('');
  const [preview, setPreview] = useState(false);
  const [restoreRevision, setRestoreRevision] = useState('');
  const [history, setHistory] = useState<Draft[]>([]);
  const [historyNext, setHistoryNext] = useState<number | null>(null);
  const load = async () => {
    setBusy(true); setError('');
    try { const session = await api<{ capabilities: string[] }>('/session'); setCapabilities(session.capabilities); if (session.capabilities.includes('cms.read')) setDraft(await api<Draft>('/cms')); }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to load.'); } finally { setBusy(false); }
  };
  useEffect(() => { void load(); return auth.onAuthStateChanged(() => { setDraft(undefined); setCapabilities([]); }); }, []);
  const change = async (action: string) => {
    if (!draft) return;
    setBusy(true); setError('');
    try { setDraft(await api<Draft>('/cms', { revision: draft.revision, action, ...(action === 'save' ? { entries: draft.entries } : {}), ...(action === 'rollback' ? { restoreRevision: Number(restoreRevision) } : {}) })); }
    catch (e) { setError(e instanceof Error ? e.message : 'Unable to save.'); } finally { setBusy(false); }
  };
  const update = (id: string, value: Partial<Entry>) => setDraft(old => old && ({ ...old, entries: old.entries.map(entry => entry.id === id ? { ...entry, ...value } : entry) }));
  return <section className="admin-console space-y-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:p-8" aria-label="Master Admin Control Center">
    <header><p className="text-sm text-slate-500">Administration / Website CMS</p><h2 className="text-2xl font-bold">Master Admin Control Center</h2><p>Versioned presentation drafts · independent approvals · secure publication</p></header>
    {error && <p role="alert" className="rounded bg-red-50 p-3 text-red-800">{error}</p>}
    <button type="button" disabled={busy} onClick={() => void load()}>Reload latest version</button>
    {busy && <p role="status">Working…</p>}
    {draft && <><div className="flex flex-wrap items-center gap-4"><span>Revision {draft.revision} · {draft.state}</span><label>Search structure <input value={query} onChange={e => setQuery(e.target.value)} className="rounded border p-2" /></label><button type="button" onClick={() => setPreview(!preview)}>{preview ? 'Edit draft' : 'Preview draft'}</button></div>
    {!draft.entries.length && <p>No presentation overrides. Existing website defaults remain available.</p>}
    <div className="grid gap-4 md:grid-cols-2">{draft.entries.filter(entry => `${entry.title} ${entry.route}`.toLowerCase().includes(query.toLowerCase())).sort((a,b) => a.order-b.order).map(entry => <article key={entry.id} className="space-y-3 rounded-xl border bg-white p-4">
      <h3 className="flex items-center gap-2 font-semibold"><MenuIcon icon={entry.icon} className="h-5 w-5" />{entry.title}</h3>
      {preview ? <p>{entry.description}</p> : <fieldset disabled={busy || !capabilities.includes('cms.edit')} className="grid gap-2">
      <label>Component<select value={entry.kind} onChange={e => update(entry.id, {kind: e.target.value as Entry['kind']})}>{['menu','page','section','banner','card'].map(kind => <option key={kind}>{kind}</option>)}</select></label>
      <label>Language<select value={entry.locale} onChange={e => update(entry.id, {locale: e.target.value as Entry['locale']})}><option value="en">English</option><option value="hi">Hindi</option></select></label>
      <label>Parent<select value={entry.parent || ''} onChange={e => update(entry.id, {parent: e.target.value || null})}><option value="">Root</option>{draft.entries.filter(row => row.id !== entry.id).map(row => <option key={row.id} value={row.id}>{row.title}</option>)}</select></label>
      <label>Replace image (PNG)<input type="file" accept="image/png" onChange={e => { const file=e.target.files?.[0]; if (!file) return; if (file.size>2*1024*1024 || file.type!=='image/png') {setError('Choose a PNG smaller than 2 MB.'); return;} setBusy(true); void file.arrayBuffer().then(buffer => api<{mediaId: string}>('/media', {fileBase64: btoa(Array.from(new Uint8Array(buffer), byte => String.fromCharCode(byte)).join(''))})).then(result => update(entry.id, {mediaId: result.mediaId})).catch(() => setError('Image upload unavailable.')).finally(() => setBusy(false)); }} /></label>
      <label><input type="checkbox" checked={entry.archived || false} onChange={e => update(entry.id, {archived: e.target.checked})} /> Archived (recover by clearing this checkbox)</label>
      <label>Title<input className="block w-full rounded border p-2" maxLength={120} value={entry.title} onChange={e => update(entry.id, { title: e.target.value })} /></label>
      <label>Description<textarea className="block w-full rounded border p-2" maxLength={2000} value={entry.description} onChange={e => update(entry.id, { description: e.target.value })} /></label>
      <label>Route<select value={entry.route} onChange={e => update(entry.id, { route: e.target.value })}>{CMS_ROUTES.map(route => <option key={route}>{route}</option>)}</select></label>
      <label>Icon<select value={entry.icon} onChange={e => update(entry.id, { icon: e.target.value as Entry['icon'] })}>{['info','book','home'].map(icon => <option key={icon}>{icon}</option>)}</select></label>
      <label>Order<input type="number" min={0} max={10000} value={entry.order} onChange={e => update(entry.id, { order: Number(e.target.value) })} /></label>
      <label><input type="checkbox" checked={entry.visible} onChange={e => update(entry.id, { visible: e.target.checked })} /> Visible</label></fieldset>}
    </article>)}</div>
    <div className="flex flex-wrap gap-3"><button disabled={busy || !capabilities.includes('cms.edit')} onClick={() => setDraft({ ...draft, entries: [...draft.entries, { id: `item-${crypto.randomUUID()}`, parent: null, kind: 'section', route: 'learning', icon: 'book', title: 'New section', description: '', locale: 'en', visible: true, order: draft.entries.length }] })}>Add section</button><button disabled={busy || !capabilities.includes('cms.edit')} onClick={() => void change('save')}>Save draft</button><button disabled={busy || !capabilities.includes('cms.publish')} onClick={() => void change('approve')}>Approve draft</button><button disabled={busy || !capabilities.includes('cms.publish') || draft.state !== 'approved'} onClick={() => { if (window.confirm('Publish this approved revision for website readers?')) void change('publish'); }}>Publish approved revision</button></div>
    <label>Historical published revision <input type="number" min={1} value={restoreRevision} onChange={e => setRestoreRevision(e.target.value)} /></label><button disabled={busy || !capabilities.includes('cms.publish') || !restoreRevision} onClick={() => { if (window.confirm('Restore this historical published presentation?')) void change('rollback'); }}>Restore publication</button>
    <button disabled={busy} onClick={() => {setBusy(true); void api<{rows: Draft[]; next: number | null}>(`/cms/history${historyNext ? `?before=${historyNext}` : ''}`).then(result => {setHistory(old => historyNext ? [...old,...result.rows] : result.rows); setHistoryNext(result.next);}).catch(() => setError('History unavailable.')).finally(() => setBusy(false));}}>Load {historyNext ? 'older ' : ''}version history</button>
    <ul>{history.map(version => <li key={version.revision}>Revision {version.revision}: {version.state} · {version.entries.length} entries <button onClick={() => setRestoreRevision(String(version.revision))}>Select for rollback</button></li>)}</ul>
    <details className="rounded border bg-white p-4"><summary className="cursor-pointer font-semibold">Draft changes & publication impact</summary><p>{draftDiff(draft.publishedEntries,draft.entries).length} changed entries compared with the current publication.</p><ul>{draftDiff(draft.publishedEntries,draft.entries).map(change=><li className="my-3 rounded border p-3" key={change.id}><strong>{change.after?.title||change.before?.title}: {change.kind}</strong><p>Changed fields: {change.fields.join(', ')}</p><p>Before: {change.before?.description||'No previous description'}</p><p>After: {change.after?.description||'No new description'}</p><p>Visibility: {change.before?.visible?'visible':'hidden/absent'} → {change.after?.visible?'visible':'hidden/absent'}</p></li>)}</ul></details>
    <CmsMediaLibrary entries={draft.entries} canEdit={capabilities.includes('cms.edit')} onSelect={(entryId,mediaId)=>update(entryId,{mediaId})} />
    <p className="text-sm">Core authentication, security and legal routes are protected. This editor cannot change executable code or access permissions.</p></>}
  </section>;
}
