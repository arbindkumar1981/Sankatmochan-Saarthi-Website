import { useEffect, useRef, useState } from 'react';
import type { SubjectMeta } from '../types';
import { useAuth } from '../context/AuthContext';
import { ManagedNote, NotePage, noteFile, notesRequest } from '../services/managedNotes';

const input = 'border rounded p-2 w-full min-w-0 bg-white';
const button = 'border rounded px-3 py-2 text-sm disabled:opacity-40';
const empty = (): ManagedNote => ({ id: crypto.randomUUID(), title: '', board: '', classGrade: '', stream: 'General', subjectId: '', chapterId: '', topicId: '', body: '', version: 0, source: 'admin_uploaded', published: false, deleted: false, updatedAt: '', updatedBy: '' });

export function NotesManagement({ student = false }: { student?: boolean }) {
  const { user } = useAuth();
  const identity = useRef(user);
  identity.current = user;
  const [catalogue, setCatalogue] = useState<SubjectMeta[]>([]);
  const [page, setPage] = useState<NotePage>({ rows: [], next: null });
  const [draft, setDraft] = useState<ManagedNote | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [scope, setScope] = useState({ grade: '', stream: '', subject: '', chapter: '', topic: '' });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [preview, setPreview] = useState<ManagedNote | null>(null);
  const [history, setHistory] = useState<ManagedNote[]>([]);
  const [historyPage, setHistoryPage] = useState<{ id: string; token: string } | null>(null);
  const [pending, setPending] = useState<{ id: string; at: string }[]>([]);
  const [blob, setBlob] = useState<string | null>(null);
  const [pdf, setPdf] = useState(false);
  const [attachmentText, setAttachmentText] = useState('');
  useEffect(() => { return () => { if (blob) URL.revokeObjectURL(blob); }; }, [blob]);
  useEffect(() => {
    let active = true;
    setPage({ rows: [], next: null }); setDraft(null); setPreview(null); setHistory([]); setHistoryPage(null); setPending([]); setBlob(null); setAttachmentText('');
    if (user && !user.isAnonymous) Promise.all([notesRequest<SubjectMeta[]>('/curriculum'), notesRequest<NotePage>(student ? '' : '?admin=true')])
      .then(([subjects, rows]) => { if (active) { setCatalogue(subjects); setPage(rows); } })
      .catch(error => { if (active) setMessage(error.message); });
    return () => { active = false; };
  }, [user, student]);
  async function operation(action: () => Promise<void>) {
    setBusy(true); setMessage('');
    try { await action(); } catch (error) { setMessage(error instanceof Error ? error.message : 'Notes operation failed.'); }
    finally { setBusy(false); }
  }
  const refresh = async () => setPage(await notesRequest<NotePage>(student ? '' : '?admin=true'));
  const subjects = catalogue.filter(s => (!scope.grade || s.classes.includes(scope.grade)) && (!scope.stream || s.stream === scope.stream));
  const chapters = subjects.find(s => s.id === scope.subject)?.chapters || [];
  const visible = page.rows.filter(n => (!search || n.title.toLowerCase().includes(search.toLowerCase())) &&
    (!scope.grade || n.classGrade === scope.grade) && (!scope.stream || n.stream === scope.stream) &&
    (!scope.subject || n.subjectId === scope.subject) && (!scope.chapter || n.chapterId === scope.chapter) &&
    (!scope.topic || n.topicId === scope.topic) && (status === 'all' || (status === 'deleted' ? n.deleted : !n.deleted && (status === 'published' ? n.published : !n.published))));
  const draftSubjects = catalogue.filter(s => draft && (s.board || 'CBSE') === draft.board && s.classes.includes(draft.classGrade) && (!['Class 11', 'Class 12'].includes(draft.classGrade) || s.stream === draft.stream));
  const subject = draftSubjects.find(s => s.id === draft?.subjectId);
  const chapter = subject?.chapters.find(c => c.id === draft?.chapterId);
  const label = (id: string) => catalogue.find(s => s.id === id)?.name || id;
  const change = (patch: Partial<ManagedNote>) => setDraft(current => current ? { ...current, ...patch } : null);
  async function save() {
    if (!draft) return;
    const attachment = file ? await noteFile(file) : {};
    await notesRequest(`/${draft.id}`, { action: 'save', version: draft.version, title: draft.title, board: draft.board, classGrade: draft.classGrade, stream: draft.stream,
      subjectId: draft.subjectId, chapterId: draft.chapterId, topicId: draft.topicId, body: draft.body, ...attachment }, value => setMessage(`Uploading ${value}% — validating and saving…`));
    await refresh(); setDraft(null); setFile(null); setMessage('Saved as draft. Review before publishing.');
  }
  async function transition(note: ManagedNote, action: string) {
    if (action === 'delete' && !window.confirm(`Move “${note.title}” to deleted notes? Files and history will be retained.`)) return;
    await notesRequest(`/${note.id}`, { action, version: note.version }); await refresh(); setMessage('Updated.');
  }
  async function show(note: ManagedNote, historical = false) {
    const viewer = user;
    setPreview(note); setBlob(null); setAttachmentText(''); setHistory([]);
    if (note.storagePath || note.hasAttachment) {
      const data = await notesRequest<Blob>(`/${note.id}/file${historical ? `?version=${note.version}` : ''}`, undefined, undefined, true);
      if (note.fileType === 'application/pdf') { setPdf(true); setBlob(URL.createObjectURL(data)); }
      else if (note.fileType?.includes('wordprocessingml')) {
        const { default: JSZip } = await import('jszip');
        const zip = await JSZip.loadAsync(await data.arrayBuffer());
        const xml = await zip.file('word/document.xml')?.async('string');
        const document = new DOMParser().parseFromString(xml || '', 'application/xml');
        if (identity.current !== viewer) return;
        setAttachmentText(Array.from(document.getElementsByTagName('w:p')).map(p => p.textContent).join('\n'));
        setPdf(false); setBlob(URL.createObjectURL(data));
      } else { const text = await data.text(); if (identity.current !== viewer) return; setAttachmentText(text); setPdf(false); setBlob(URL.createObjectURL(data)); }
    }
  }
  if (!user || user.isAnonymous) return <p>Registered account sign-in required for notes.</p>;
  return <section className="space-y-4 p-3 bg-white rounded-xl" aria-label={student ? 'Published notes' : 'Notes Management'}>
    <h2 className="text-xl font-bold">{student ? 'Published Notes' : 'Notes Management'}</h2>
    <p>Class → Stream → Subject → Chapter → Topic. Admin-uploaded notes are separate from Teacher Agent assets.</p>
    <div role="status" aria-live="polite">{message}</div>
    <div className="grid gap-2 sm:grid-cols-3">
      <label>Search this page<input className={input} value={search} onChange={e => setSearch(e.target.value)} /></label>
      <label>Class<select className={input} value={scope.grade} onChange={e => setScope({ grade: e.target.value, stream: '', subject: '', chapter: '', topic: '' })}><option value="">All</option>{[...new Set(catalogue.flatMap(s => s.classes))].map(v => <option key={v}>{v}</option>)}</select></label>
      <label>Stream<select className={input} value={scope.stream} onChange={e => setScope({ ...scope, stream: e.target.value, subject: '', chapter: '', topic: '' })}><option value="">All / lower-class general</option>{[...new Set(subjects.map(s => s.stream))].map(v => <option key={v}>{v}</option>)}</select></label>
      <label>Subject<select className={input} value={scope.subject} onChange={e => setScope({ ...scope, subject: e.target.value, chapter: '', topic: '' })}><option value="">All</option>{subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
      <label>Chapter<select className={input} value={scope.chapter} onChange={e => setScope({ ...scope, chapter: e.target.value, topic: '' })}><option value="">All</option>{chapters.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}</select></label>
      <label>Topic<select className={input} value={scope.topic} onChange={e => setScope({ ...scope, topic: e.target.value })}><option value="">All / chapter-wide</option>{chapters.find(c => c.id === scope.chapter)?.topics.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}</select></label>
      {!student && <label>Status<select className={input} value={status} onChange={e => setStatus(e.target.value)}>{['all', 'draft', 'published', 'deleted'].map(v => <option key={v}>{v}</option>)}</select></label>}
    </div>
    <button disabled={busy} className={button} onClick={() => operation(refresh)}>Reload first page</button>
    {!student && <button disabled={busy} className={button} onClick={() => { setDraft(empty()); setFile(null); }}>Upload / Create notes</button>}
    <div className="overflow-auto"><table className="w-full text-sm"><caption>Notes on this page; use Next page for more records</caption><thead><tr>{['Title', 'Class / Stream', 'Subject / Chapter / Topic', 'Type', 'Status / Version', 'Updated by / time', 'Actions'].map(x => <th className="p-2 text-left" key={x}>{x}</th>)}</tr></thead><tbody>{visible.map(n => <tr key={n.id} className="border-t">
      <td>{n.title}</td><td>{n.classGrade} / {n.stream}</td><td>{label(n.subjectId)} / {catalogue.find(s => s.id === n.subjectId)?.chapters.find(c => c.id === n.chapterId)?.title} / {n.topicId || 'Chapter-wide'}</td><td>{n.fileType || 'Typed text'}</td><td>{n.deleted ? 'Deleted' : n.published ? 'Published' : 'Draft'} / {n.version}</td><td>{n.updatedBy} / {n.updatedAt}</td>
      <td className="flex flex-wrap gap-2"><button disabled={busy || n.deleted} className={button} onClick={() => operation(() => show(n))}>Preview</button>{!student && <>
        <button disabled={busy || n.deleted} className={button} onClick={() => { setDraft(n); setFile(null); }}>Edit / Replace</button>
        {!n.deleted && <button disabled={busy} className={button} onClick={() => operation(() => transition(n, n.published ? 'unpublish' : 'publish'))}>{n.published ? 'Unpublish' : 'Publish'}</button>}
        <button disabled={busy} className={button} onClick={() => operation(() => transition(n, n.deleted ? 'restore' : 'delete'))}>{n.deleted ? 'Restore to draft' : 'Soft Delete'}</button>
        <button disabled={busy} className={button} onClick={() => operation(async () => { const data = await notesRequest<{ versions: ManagedNote[]; next: string | null }>(`/${n.id}/versions`); setHistory(data.versions); setHistoryPage(data.next ? { id: n.id, token: data.next } : null); setMessage('Version history loaded.'); })}>History</button>
      </>}</td></tr>)}</tbody></table></div>
    {page.next && <button disabled={busy} className={button} onClick={() => operation(async () => setPage(await notesRequest<NotePage>(`?admin=${!student}&after=${encodeURIComponent(page.next!)}`)))}>Next page</button>}
    {draft && !student && <form className="grid gap-3 border p-3 rounded" onSubmit={e => { e.preventDefault(); void operation(save); }}>
      <h3 className="font-bold">{draft.version ? 'Edit / versioned replacement' : 'Create draft'}</h3>
      <p className="text-xs break-all">Upload recovery reference: {draft.id}. Keep this reference if an upload is interrupted.</p>
      <label>Title<input required maxLength={300} className={input} value={draft.title} onChange={e => change({ title: e.target.value })} /></label>
      <label>Board<select required className={input} value={draft.board} onChange={e => change({ board: e.target.value, classGrade: '', subjectId: '', chapterId: '', topicId: '' })}><option value="">Choose</option>{[...new Set(catalogue.map(s => s.board || 'CBSE'))].map(v => <option key={v}>{v}</option>)}</select></label>
      <label>Class<select required className={input} value={draft.classGrade} onChange={e => change({ classGrade: e.target.value, stream: 'General', subjectId: '', chapterId: '', topicId: '' })}><option value="">Choose</option>{[...new Set(catalogue.filter(s => (s.board || 'CBSE') === draft.board).flatMap(s => s.classes))].map(v => <option key={v}>{v}</option>)}</select></label>
      <label>Stream<select className={input} disabled={!['Class 11', 'Class 12'].includes(draft.classGrade)} value={draft.stream} onChange={e => change({ stream: e.target.value, subjectId: '', chapterId: '', topicId: '' })}>{[...new Set(['General', ...catalogue.filter(s => s.classes.includes(draft.classGrade)).map(s => s.stream)])].map(v => <option key={v}>{v}</option>)}</select></label>
      <label>Subject<select required className={input} value={draft.subjectId} onChange={e => change({ subjectId: e.target.value, chapterId: '', topicId: '' })}><option value="">Choose</option>{draftSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
      <label>Chapter<select required className={input} value={draft.chapterId} onChange={e => change({ chapterId: e.target.value, topicId: '' })}><option value="">Choose</option>{subject?.chapters.filter(c => !c.deleted).map(c => <option key={c.id} value={c.id}>{c.title}</option>)}</select></label>
      <label>Topic<select className={input} value={draft.topicId} onChange={e => change({ topicId: e.target.value })}><option value="">Chapter-wide (optional)</option>{chapter?.topics.filter(t => !t.deleted).map(t => <option key={t.id} value={t.id}>{t.title}</option>)}</select></label>
      <label>Typed text / Markdown (displayed as safe text)<textarea className={input} rows={10} maxLength={200000} value={draft.body} onChange={e => change({ body: e.target.value })} /></label>
      <label>{draft.storagePath ? `Replace ${draft.fileName} (original retained)` : 'Upload PDF / DOCX / Markdown / text'}<input className={input} type="file" accept=".pdf,.docx,.md,.txt" onChange={e => setFile(e.target.files?.[0] || null)} /></label>
      <pre className="whitespace-pre-wrap break-words border p-2" aria-label="Draft text preview">{draft.body}</pre>
      <div><button disabled={busy} className={button}>Save draft</button><button type="button" disabled={busy} className={button} onClick={() => setDraft(null)}>Cancel</button><button type="button" disabled={busy} className={button} onClick={() => operation(async () => setPending(await notesRequest(`/${draft.id}/pending`)))}>Check interrupted uploads</button></div>
      {pending.map(item => <div key={item.id}>Interrupted upload {item.at}<button type="button" className={button} disabled={busy} onClick={() => operation(async () => { await notesRequest(`/${draft.id}/recover/${item.id}`, {}); setPending([]); setDraft(null); await refresh(); setMessage('Recovered as draft; review before publishing.'); })}>Recover as draft</button></div>)}
    </form>}
    {preview && <section aria-label="Notes preview" className="border p-3"><h3>{preview.title}</h3><pre className="whitespace-pre-wrap break-words">{preview.body}</pre>{attachmentText && <pre className="whitespace-pre-wrap break-words">{attachmentText}</pre>}{blob && <><a href={blob} download={preview.fileName || 'notes'}>Download attachment</a>{pdf && <iframe title="PDF notes preview" sandbox="" src={blob} className="w-full h-96" />}</>}<button className={button} onClick={() => { setPreview(null); setBlob(null); }}>Close preview</button></section>}
    {history.length > 0 && <section aria-label="Note history"><h3>Immutable version history</h3>{history.map(n => <details key={n.version}><summary>Version {n.version} — {n.updatedAt} — {n.updatedBy} — {n.fileName || 'text'}</summary><pre className="whitespace-pre-wrap">{n.body}</pre><button className={button} disabled={busy} onClick={() => operation(() => show(n, true))}>Preview this version</button></details>)}</section>}
    {historyPage && <button disabled={busy} className={button} onClick={() => operation(async () => { const data = await notesRequest<{ versions: ManagedNote[]; next: string | null }>(`/${historyPage.id}/versions?page_token=${encodeURIComponent(historyPage.token)}`); setHistory(rows => [...rows, ...data.versions]); setHistoryPage(data.next ? { id: historyPage.id, token: data.next } : null); })}>Older versions</button>}
  </section>;
}

/** Delegated editors use this entry without acquiring legacy administrator authority. */
export function NotesWorkspace() {
  const { user } = useAuth();
  const [manage, setManage] = useState(false);
  const [editing, setEditing] = useState(false);
  useEffect(() => {
    let active = true; setManage(false); setEditing(false);
    if (user && !user.isAnonymous) notesRequest<{ manage: boolean }>('/access').then(result => { if (active) setManage(result.manage); }).catch(() => {});
    return () => { active = false; };
  }, [user]);
  return <>{manage && <button className={button} onClick={() => setEditing(value => !value)}>{editing ? 'View published notes' : 'Notes Management'}</button>}<NotesManagement key={`${user?.uid}-${editing}`} student={!editing} /></>;
}
