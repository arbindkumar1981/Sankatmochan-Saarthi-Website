import React, { useEffect, useState } from 'react';
import { auth } from '../services/firebase';
import { MenuIcon } from './MenuIcon';

type Entry = { id: string; parent: string | null; kind: string; route: string; icon: 'info' | 'book' | 'home'; title: string; description: string; locale: 'en' | 'hi'; visible: boolean; order: number };
type Draft = { revision: number; entries: Entry[]; publishedEntries: Entry[]; state: string };
async function api<T>(path: string, body?: unknown): Promise<T> {
  const user = auth.currentUser;
  if (!user || user.isAnonymous) throw new Error('Sign in with your individual administrator account.');
  const base = import.meta.env.VITE_SAARTHI_API_URL;
  if (!base) throw new Error('Control Center service is not configured.');
  const token = await user.getIdToken();
  if (auth.currentUser !== user) throw new Error('Account changed. Reload.');
  const response = await fetch(`${base.replace(/\/$/, '')}/v1/control-center${path}`, { method: body ? 'POST' : 'GET', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined, cache: 'no-store', signal: AbortSignal.timeout(30000) });
  if (auth.currentUser !== user) throw new Error('Account changed. Reload.');
  if (!response.ok) throw new Error(response.status === 409 ? 'Version conflict or approval required. Reload to compare; your changes have not been retried.' : response.status === 403 ? 'Your role or multi-factor sign-in does not allow this operation.' : 'Control Center unavailable. Reload to check whether the operation completed.');
  return response.json();
}
export function ControlCenter() {
  const [draft, setDraft] = useState<Draft>();
  const [capabilities, setCapabilities] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [query, setQuery] = useState('');
  const [preview, setPreview] = useState(false);
  const [restoreRevision, setRestoreRevision] = useState('');
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
  return <section className="space-y-5 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:p-8" aria-label="Master Admin Control Center">
    <header><p className="text-sm text-slate-500">Administration / Website CMS</p><h2 className="text-2xl font-bold">Master Admin Control Center</h2><p>Versioned presentation drafts · independent approvals · secure publication</p></header>
    {error && <p role="alert" className="rounded bg-red-50 p-3 text-red-800">{error}</p>}
    <button type="button" disabled={busy} onClick={() => void load()}>Reload latest version</button>
    {busy && <p role="status">Working…</p>}
    {draft && <><div className="flex flex-wrap items-center gap-4"><span>Revision {draft.revision} · {draft.state}</span><label>Search structure <input value={query} onChange={e => setQuery(e.target.value)} className="rounded border p-2" /></label><button type="button" onClick={() => setPreview(!preview)}>{preview ? 'Edit draft' : 'Preview draft'}</button></div>
    {!draft.entries.length && <p>No presentation overrides. Existing website defaults remain available.</p>}
    <div className="grid gap-4 md:grid-cols-2">{draft.entries.filter(entry => `${entry.title} ${entry.route}`.toLowerCase().includes(query.toLowerCase())).sort((a,b) => a.order-b.order).map(entry => <article key={entry.id} className="space-y-3 rounded-xl border bg-white p-4">
      <h3 className="flex items-center gap-2 font-semibold"><MenuIcon icon={entry.icon} className="h-5 w-5" />{entry.title}</h3>
      {preview ? <p>{entry.description}</p> : <fieldset disabled={busy || !capabilities.includes('cms.edit')} className="grid gap-2">
      <label>Title<input className="block w-full rounded border p-2" maxLength={120} value={entry.title} onChange={e => update(entry.id, { title: e.target.value })} /></label>
      <label>Description<textarea className="block w-full rounded border p-2" maxLength={2000} value={entry.description} onChange={e => update(entry.id, { description: e.target.value })} /></label>
      <label>Route<select value={entry.route} onChange={e => update(entry.id, { route: e.target.value })}>{['learning','youtube','notices','evaluation','about','contact'].map(route => <option key={route}>{route}</option>)}</select></label>
      <label>Icon<select value={entry.icon} onChange={e => update(entry.id, { icon: e.target.value as Entry['icon'] })}>{['info','book','home'].map(icon => <option key={icon}>{icon}</option>)}</select></label>
      <label>Order<input type="number" min={0} max={10000} value={entry.order} onChange={e => update(entry.id, { order: Number(e.target.value) })} /></label>
      <label><input type="checkbox" checked={entry.visible} onChange={e => update(entry.id, { visible: e.target.checked })} /> Visible</label></fieldset>}
    </article>)}</div>
    <div className="flex flex-wrap gap-3"><button disabled={busy || !capabilities.includes('cms.edit')} onClick={() => setDraft({ ...draft, entries: [...draft.entries, { id: `item-${crypto.randomUUID()}`, parent: null, kind: 'section', route: 'learning', icon: 'book', title: 'New section', description: '', locale: 'en', visible: true, order: draft.entries.length }] })}>Add section</button><button disabled={busy || !capabilities.includes('cms.edit')} onClick={() => void change('save')}>Save draft</button><button disabled={busy || !capabilities.includes('cms.publish')} onClick={() => void change('approve')}>Approve draft</button><button disabled={busy || !capabilities.includes('cms.publish') || draft.state !== 'approved'} onClick={() => { if (window.confirm('Publish this approved revision for website readers?')) void change('publish'); }}>Publish approved revision</button></div>
    <label>Historical published revision <input type="number" min={1} value={restoreRevision} onChange={e => setRestoreRevision(e.target.value)} /></label><button disabled={busy || !capabilities.includes('cms.publish') || !restoreRevision} onClick={() => { if (window.confirm('Restore this historical published presentation?')) void change('rollback'); }}>Restore publication</button>
    <p className="text-sm">Core authentication, security and legal routes are protected. This editor cannot change executable code or access permissions.</p></>}
  </section>;
}
