import React, { useState } from 'react';
import { useWebsite } from '../context/WebsiteContext';
import { DEFAULT_WEBSITE_CONFIG, safeImageUrl, type WebsiteConfig, type WebsiteOption } from '../services/websiteConfig';
import { WEBSITE_TEXT_CATALOGUE } from '../data/websiteTextCatalogue';
import { useAuth } from '../context/AuthContext';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../services/firebase';
import { NavigationManager } from './NavigationManager';
import { AdminAuditViewer } from './AdminAuditViewer';

const field = 'w-full min-w-0 border rounded-lg p-2 text-sm bg-white';
const button = 'border rounded-lg px-3 py-2 text-xs font-semibold hover:bg-orange-50 disabled:opacity-50';
const focusEditor = (event: React.MouseEvent<HTMLButtonElement>) => {
  const editor = event.currentTarget.parentElement?.parentElement?.querySelector<HTMLInputElement | HTMLTextAreaElement>('input:not([type=file]), textarea');
  editor?.focus();
  editor?.select();
};
const id = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;

export function WebsiteSettingsManager() {
  const { config, revision, syncError, save } = useWebsite();
  const { user, isAdmin } = useAuth();
  const [draft, setDraft] = useState<WebsiteConfig>(() => structuredClone(config));
  const [baseRevision, setBaseRevision] = useState(revision);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [search, setSearch] = useState('');
  const [section, setSection] = useState('menus');
  const update = (patch: Partial<WebsiteConfig>) => setDraft(prev => ({ ...prev, ...patch }));
  const submit = async () => {
    setBusy(true); setMessage('');
    try { await save(draft, baseRevision); setBaseRevision(baseRevision + 1); setMessage('Saved. Changes are available to all website visitors.'); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Save failed.'); }
    finally { setBusy(false); }
  };
  const imageFile = async (file: File | undefined, key: 'logoUrl' | 'babaImageUrl') => {
    if (!file) return;
    setBusy(true); setMessage('');
    try {
      if (!user || user.isAnonymous || !isAdmin) throw new Error('Administrator login is required.');
      if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 5 * 1024 * 1024) throw new Error('Choose a PNG, JPG or WebP image up to 5 MB.');
      const fileRef = ref(storage, `learning-materials/${user.uid}/website-${crypto.randomUUID()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`);
      await uploadBytes(fileRef, file, { contentType: file.type });
      update({ [key]: await getDownloadURL(fileRef) }); setMessage('Image uploaded. Save website changes to apply it.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Upload failed.'); }
    finally { setBusy(false); }
  };
  const lists = ['boards', 'classes', 'streams'] as const;
  const listEditor = (key: typeof lists[number]) => {
    const rows = draft[key];
    const singular = key === 'classes' ? 'class' : key.slice(0, -1);
    const change = (rowId: string, patch: Partial<WebsiteOption>) => update({ [key]: rows.map(row => row.id === rowId ? { ...row, ...patch } : row) });
    return <div className="space-y-3">
      <p className="text-sm text-stone-600">Replace labels without changing saved student/content identities. Delete hides an option; Restore brings it back.</p>
      {rows.map(row => <div key={row.id} className={`grid grid-cols-1 sm:grid-cols-3 gap-2 border rounded-xl p-3 ${row.deleted ? 'bg-stone-100' : ''}`}>
        <label className="text-xs">Name<input aria-label={`${key} ${row.id} name`} className={field} value={row.label} onChange={e => change(row.id, { label: e.target.value })} /></label>
        <label className="text-xs">Hindi name<input aria-label={`${key} ${row.id} Hindi name`} className={field} value={row.hindiLabel} onChange={e => change(row.id, { hindiLabel: e.target.value })} /></label>
        <div className="flex flex-wrap items-center gap-2"><button className={button} onClick={focusEditor}>Edit</button><button className={button} onClick={() => change(row.id, { deleted: !row.deleted })}>{row.deleted ? 'Restore / Add back' : 'Delete'}</button></div>
      </div>)}
      <button className={button} onClick={() => update({ [key]: [...rows, { id: id(singular), label: `New ${singular}`, hindiLabel: '' }] })}>Add {singular}</button>
      {key === 'classes' && <p className="text-xs text-stone-600">New classes can hold admin-published material. AI teaching currently supports Classes IX–XII. Removing an option hides that class from student navigation; restore it here when ready.</p>}
      {key === 'boards' && <p className="text-xs text-stone-600">Add subjects for a new board in Curriculum Manager. AI generation currently supports CBSE.</p>}
    </div>;
  };
  return <section className="space-y-4">
    <h3 className="text-lg font-bold">Website & Menu Controls</h3>
    <div className="flex flex-wrap gap-2">{[['menus', 'Navigation & Icons'], ['branding', 'Name, Logo & Banner'], ['boards', 'Boards'], ['classes', 'Classes'], ['streams', 'Streams'], ['quotes', 'Quotes'], ['text', 'Website Text'], ['audit', 'Change History']].map(([key,label]) => <button key={key} className={`${button} ${section === key ? 'bg-orange-100' : ''}`} aria-pressed={section === key} onClick={() => setSection(key)}>{label}</button>)}</div>
    {section === 'audit' && <AdminAuditViewer />}
    {section === 'menus' && <fieldset disabled={busy}><NavigationManager draft={draft} update={update} /></fieldset>}
    {section === 'branding' && <div className="space-y-3">
      <label className="block text-sm">Website name<input className={field} value={draft.name} maxLength={120} onChange={e => update({ name: e.target.value })} /></label>
      {(['logoUrl', 'babaImageUrl'] as const).map(key => <div key={key} className="border rounded-xl p-3 space-y-2">
        <label className="block text-sm">{key === 'logoUrl' ? 'Website logo' : 'Banner / Baba image'} URL<input className={field} value={draft[key]} onChange={e => update({ [key]: e.target.value })} /></label>
        <label className="block text-sm">Upload replacement image<input className={field} type="file" accept="image/png,image/jpeg,image/webp" disabled={busy} onChange={e => { imageFile(e.target.files?.[0], key); e.currentTarget.value = ''; }} /></label>
        {draft[key] && safeImageUrl(draft[key]) && <img src={draft[key]} alt="Image preview" className="h-24 max-w-full object-contain" />}
        <div className="flex gap-2"><button className={button} onClick={focusEditor}>Edit / Replace image</button><button className={button} onClick={() => update({ [key]: '' })}>Delete image</button><button className={button} onClick={() => update({ [key]: DEFAULT_WEBSITE_CONFIG[key] })}>Restore original</button></div>
      </div>)}
      <label className="flex gap-2"><input type="checkbox" checked={draft.logoVisible} onChange={e => update({ logoVisible: e.target.checked })} /> Show website logo</label>
      <label className="flex gap-2"><input type="checkbox" checked={draft.bannerVisible} onChange={e => update({ bannerVisible: e.target.checked })} /> Show top banner</label>
    </div>}
    {lists.includes(section as typeof lists[number]) && listEditor(section as typeof lists[number])}
    {section === 'quotes' && <div className="space-y-3">{draft.quotes.map(q => <div key={q.id} className="border rounded-xl p-3 space-y-2">
      <label>English quote<textarea className={field} value={q.en} onChange={e => update({ quotes: draft.quotes.map(x => x.id === q.id ? { ...x, en: e.target.value } : x) })} /></label>
      <label>Hindi quote<textarea className={field} value={q.hi} onChange={e => update({ quotes: draft.quotes.map(x => x.id === q.id ? { ...x, hi: e.target.value } : x) })} /></label>
      <div className="flex gap-2"><button className={button} onClick={focusEditor}>Edit quote</button><button className={button} onClick={() => update({ quotes: draft.quotes.map(x => x.id === q.id ? { ...x, deleted: !x.deleted } : x) })}>{q.deleted ? 'Restore' : 'Delete'}</button></div>
    </div>)}<button className={button} onClick={() => update({ quotes: [...draft.quotes, { id: id('quote'), en: '', hi: '' }] })}>Add quote</button></div>}
    {section === 'text' && <div className="space-y-3">
      <p className="text-sm">Edit headings, instructions, contact details, About text, footer and button labels. Student names, scores and live learning content use their own managers.</p>
      <input aria-label="Find website text" className={field} placeholder="Search website text" value={search} onChange={e => setSearch(e.target.value)} />
      {WEBSITE_TEXT_CATALOGUE.filter(x => `${x.section} ${x.text}`.toLowerCase().includes(search.toLowerCase())).map(item => <div key={item.text} className="border rounded-xl p-3 space-y-2">
        <div className="text-xs text-stone-500">{item.section}</div><p className="text-sm whitespace-pre-wrap">{item.text}</p>
        <textarea aria-label={`Replace ${item.text.slice(0, 80)}`} className={field} value={draft.copy[item.text]?.replacement ?? item.text} onChange={e => update({ copy: { ...draft.copy, [item.text]: { replacement: e.target.value, deleted: draft.copy[item.text]?.deleted || false } } })} />
        <div className="flex gap-2"><button className={button} onClick={focusEditor}>Edit text</button><button className={button} onClick={() => update({ copy: { ...draft.copy, [item.text]: { replacement: draft.copy[item.text]?.replacement ?? item.text, deleted: !draft.copy[item.text]?.deleted } } })}>{draft.copy[item.text]?.deleted ? 'Restore text' : 'Delete text'}</button><button className={button} onClick={() => { const copy = { ...draft.copy }; delete copy[item.text]; update({ copy }); }}>Restore original</button></div>
      </div>)}
    </div>}
    {(message || syncError) && <p role="status" className="border rounded-xl p-3 text-sm whitespace-pre-wrap">{message || syncError}</p>}
    {revision !== baseRevision && <p className="text-sm text-amber-800">Saved settings changed since this editor opened. Reload before editing further.</p>}
    <div className="flex flex-wrap gap-2 sticky bottom-0 bg-white border-t p-3"><button className={`${button} bg-orange-600 text-white`} disabled={busy} onClick={submit}>{busy ? 'Saving…' : 'Save website changes'}</button><button className={button} disabled={busy} onClick={() => { if (window.confirm('Discard unsaved edits and load saved settings?')) { setDraft(structuredClone(config)); setBaseRevision(revision); setMessage(''); } }}>Reload saved settings</button></div>
  </section>;
}

