import React, { useState } from 'react';
import { doc, runTransaction } from 'firebase/firestore';
import { useCurriculum } from '../context/CurriculumContext';
import { useAuth } from '../context/AuthContext';
import { db } from '../services/firebase';
import { uploadBrandedStudyFile } from '../services/studyFileUpload';
import { useWebsite } from '../context/WebsiteContext';
import { validateAdminRecord, archiveRecord, restoreRecord, assetVisibility, assetMarker, type ManagedCollection } from '../services/adminValidation';
import { catalogueMaterialScopes, EMPTY_MATERIAL_SCOPE, MATERIAL_SCOPE_KEYS, changeMaterialScope, matchesMaterialScope, materialScopeOptions, type MaterialScope } from '../services/materialScope';

const scopeLabels = { board: 'Board', classGrade: 'Class', stream: 'Stream', subjectId: 'Subject', chapterId: 'Chapter', topicTitle: 'Topic', subtopicTitle: 'Subtopic', contentType: 'Learning module' };

const style = 'w-full min-w-0 border rounded-lg p-2 text-sm bg-white';
const button = 'border rounded-lg px-3 py-2 text-xs font-semibold hover:bg-orange-50';
const labels: Record<string, string> = { bodyText: 'Learning material', bodyHindi: 'Hindi learning material', hindiTitle: 'Hindi title', questionText: 'Question', correctIndex: 'Correct option (0 = first option)', youtubeId: 'YouTube video ID', durationMinutes: 'Duration in minutes', totalMarks: 'Total marks', passingMarks: 'Passing marks', title: 'Title', published: 'Published', approved: 'Approved', active: 'Visible', category: 'Category', blessingQuote: 'Blessing quote', channelTitle: 'Channel', hindiMessage: 'Hindi message' };
const immutable = new Set(['id', 'canonicalKey', 'board', 'classGrade', 'stream', 'subjectId', 'chapterId', 'topicId', 'contentType', 'createdAt', 'authorUid', 'createdBy', 'storagePath', 'sourceKnowledgeUnitId', 'generatedAt', 'validatedAt', 'reuseCount', 'replacementContentId', 'archivedAt', 'updatedAt', 'status', 'deleted', 'archiveState']);
const editable: Record<ManagedCollection, string[]> = {
  learning_contents: ['title', 'hindiTitle', 'bodyText', 'bodyHindi', 'approved', 'published', 'attachmentUrl', 'attachmentName', 'flashcardItems', 'formulaItems', 'pyqItems', 'caseStudyItem', 'mindmapNodes'],
  youtube_videos: ['title', 'hindiTitle', 'youtubeId', 'channelTitle', 'duration', 'description', 'thumbnail', 'approved', 'published'],
  tests: ['title', 'hindiTitle', 'durationMinutes', 'totalMarks', 'passingMarks', 'questions', 'approved', 'published'],
  notices: ['title', 'hindiTitle', 'message', 'hindiMessage', 'category', 'blessingQuote', 'active']
};

const rowTemplate = (label: string): any => {
  const id = `item-${crypto.randomUUID()}`;
  if (label === 'questions') return { id, questionText: '', options: ['', '', '', ''], correctIndex: 0, explanation: '', marks: 1 };
  if (label === 'flashcardItems') return { id, question: '', answer: '' };
  if (label === 'formulaItems') return { id, name: '', formula: '', definition: '' };
  if (label === 'pyqItems') return { id, year: '', marks: 1, question: '', solution: '' };
  if (label === 'mindmapNodes') return { id, label: '', description: '', children: [] };
  return '';
};

function Fields({ value, onChange, label }: { value: any; onChange: (next: any) => void; label: string }) {
  if (Array.isArray(value)) return <fieldset className="border rounded-xl p-3 space-y-2"><legend className="text-sm font-semibold">{label}</legend>{value.map((entry, index) => <div key={entry?.id || index} className="border-b pb-2 space-y-2"><Fields value={entry} onChange={next => onChange(value.map((x, i) => i === index ? next : x))} label={`${label} ${index + 1}`} /><button type="button" className={button} onClick={() => onChange(value.filter((_, i) => i !== index))}>Remove row</button></div>)}<button type="button" className={button} onClick={() => { const template = value.length ? structuredClone(value[value.length - 1]) : rowTemplate(label); if (template && typeof template === 'object' && !Array.isArray(template) && 'id' in template) template.id = `item-${crypto.randomUUID()}`; onChange([...value, template]); }}>Add row</button></fieldset>;
  if (value && typeof value === 'object') return <fieldset className="border rounded-xl p-3 space-y-2"><legend>{label}</legend>{Object.entries(value).filter(([key]) => !immutable.has(key)).map(([key, entry]) => <Fields key={key} value={entry} label={labels[key] || key} onChange={next => onChange({ ...value, [key]: next })} />)}</fieldset>;
  if (typeof value === 'boolean') return <label className="flex gap-2 text-sm"><input type="checkbox" checked={value} onChange={e => onChange(e.target.checked)} />{label}</label>;
  if (typeof value === 'number') return <label className="block text-sm">{label}<input type="number" className={style} value={value} onChange={e => onChange(Number(e.target.value))} /></label>;
  return <label className="block text-sm">{label}<textarea className={style} rows={typeof value === 'string' && value.length > 200 ? 5 : 2} value={value ?? ''} onChange={e => onChange(e.target.value)} /></label>;
}

export function ManagedRecords({ collection, onScopeChange }: { collection: ManagedCollection; onScopeChange?: (scope: MaterialScope) => void }) {
  const { config } = useWebsite();
  const { learningContents, youtubeVideos, evaluationTests, notices, deletedAssetIds, allCurriculumSubjects } = useCurriculum();
  const { user, isAdmin } = useAuth();
  const rows: any[] = ({ learning_contents: learningContents, youtube_videos: youtubeVideos, tests: evaluationTests, notices })[collection];
  const scopeRecords = [...rows, ...catalogueMaterialScopes(allCurriculumSubjects), ...config.boards.filter(x=>!x.deleted).flatMap(board=>config.classes.filter(x=>!x.deleted).flatMap(grade=>config.streams.filter(x=>!x.deleted).map(stream=>({board:board.id,classGrade:grade.id,stream:stream.id})))), ...config.modules.filter(module => !module.deleted).map(module => ({ contentType: module.id }))];
  const [draft, setDraft] = useState<Record<string, any> | null>(null);
  const [search, setSearch] = useState('');
  const [scope, setScope] = useState(EMPTY_MATERIAL_SCOPE);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const persist = async (item: Record<string, any>, deleted: boolean) => {
    setBusy(true); setMessage('');
    try {
      if (!user || user.isAnonymous || !isAdmin) throw new Error('Administrator login is required.');
      if (!deleted) validateAdminRecord(collection, item);
      else if (!/^[a-zA-Z0-9_-]{1,128}$/.test(item.id)) throw new Error('Invalid item identity.');
      const clean = JSON.parse(JSON.stringify(deleted ? archiveRecord(collection, item) : item));
      if (collection === 'youtube_videos' && (!clean.thumbnail || (clean.youtubeId !== rows.find(x=>x.id===clean.id)?.youtubeId && clean.thumbnail === rows.find(x=>x.id===clean.id)?.thumbnail))) clean.thumbnail = `https://img.youtube.com/vi/${clean.youtubeId}/hqdefault.jpg`;
      clean.deleted = deleted; clean.updatedAt = new Date().toISOString();
      // Public tombstones prevent bundled seed items from reappearing after deletion.
      const marker = await assetMarker(collection, clean.id);
      await runTransaction(db, async transaction => {
        const reference = doc(db, collection, clean.id);
        const current = await transaction.get(reference);
        if (current.exists() && current.data()?.updatedAt !== item.updatedAt) throw new Error('Another admin updated this item. Cancel and reopen it before saving.');
        transaction.set(reference, clean);
        transaction.set(doc(db, 'curriculum_nodes', marker), assetVisibility(collection, clean));
      });
      setMessage(deleted ? 'Deleted from the website. Restore is available.' : 'Saved successfully.'); setDraft(null);
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Save failed.'); }
    finally { setBusy(false); }
  };
  const uploadAttachment = async (file?: File) => {
    if (!file || !draft) return;
    setBusy(true); setMessage('');
    try {
      if (!user || user.isAnonymous || !isAdmin) throw new Error('Administrator login is required.');
      if (!/\.(pdf|docx|pptx|png|jpg|jpeg|webp|txt)$/i.test(file.name) || file.size > 50 * 1024 * 1024) throw new Error('Choose a supported study file up to 50 MB.');
      const attachment = await uploadBrandedStudyFile(file, user.uid, config, setMessage);
      setDraft({ ...draft, ...attachment });
      setMessage('Branded PDF ready for students. Original preserved privately. Save replacement to apply it.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Upload failed.'); }
    finally { setBusy(false); }
  };
  return <section className="space-y-3 border rounded-xl p-4">
    <h4 className="font-bold">Edit / Remove / Restore existing items</h4>
    {collection === 'learning_contents' && <div className="space-y-3">
      <p className="text-sm">Board → Class → Stream → Subject → Chapter → Topic → Subtopic → Learning module. Removed materials remain in their original selection for Restore.</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">{MATERIAL_SCOPE_KEYS.map(key => <label key={key} className="text-sm">{scopeLabels[key]}<select aria-label={`Filter materials by ${scopeLabels[key]}`} className={style} value={scope[key]} onChange={e => { const next = changeMaterialScope(scope, key, e.target.value); setScope(next); onScopeChange?.(next); setDraft(null); }}><option value="">All — {scopeLabels[key]}</option>{materialScopeOptions(key === 'contentType' ? config.modules.filter(module => !module.deleted).map(module => ({ contentType: module.id })) : scopeRecords, key === 'contentType' ? EMPTY_MATERIAL_SCOPE : scope,key).map(value => {
        const label = key === 'subjectId' ? allCurriculumSubjects.find(s=>s.id===value)?.name || rows.find(r=>r.subjectId===value)?.subjectName || value : key === 'chapterId' ? allCurriculumSubjects.flatMap(s=>s.chapters).find(ch=>ch.id===value)?.title || rows.find(r=>r.chapterId===value)?.chapterTitle || value : key === 'contentType' ? config.modules.find(m=>m.id===value)?.label || value : value;
        return <option key={value} value={value}>{label}</option>;
      })}</select></label>)}</div>
    </div>}
    <input aria-label={`Search ${collection}`} className={style} value={search} placeholder="Find item" onChange={e => setSearch(e.target.value)} />
    {rows.filter(x => (collection !== 'learning_contents' || matchesMaterialScope(x, scope)) && `${x.title} ${x.classGrade || ''} ${x.subjectId || ''} ${x.topicTitle || ''} ${x.subtopicTitle || ''}`.toLowerCase().includes(search.toLowerCase())).map(item => {
      const deleted = item.deleted || deletedAssetIds.has(`${collection}/${item.id}`);
      return <div key={item.id} className="flex flex-wrap justify-between gap-2 border rounded-xl p-3"><div className="text-sm"><b>{item.title}</b><div className="text-xs text-stone-500">{item.classGrade} · {item.stream} · {item.subjectName || item.subjectId}{collection === 'learning_contents' && <div>{item.chapterTitle || item.chapterId} · {item.topicTitle || 'Full chapter'}{item.subtopicTitle ? ` · ${item.subtopicTitle}` : ''} · {config.modules.find(m=>m.id===item.contentType)?.label || item.contentType}</div>}{deleted ? ' · Deleted' : ''}</div></div><div className="flex gap-2"><button className={button} disabled={busy || deleted} onClick={() => setDraft(structuredClone(item))}>Replace / Edit</button><button className={button} disabled={busy} onClick={() => { if (deleted) persist(restoreRecord(collection, item), false); else if (window.confirm('Delete this item from the website? It can be restored; student results are preserved.')) persist(item, true); }}>{deleted ? 'Restore' : 'Delete'}</button></div></div>;
    })}
    {draft && <div className="bg-orange-50 border rounded-xl p-4 space-y-3"><h4 className="font-bold">Replace {draft.title}</h4><p className="text-xs">Curriculum identity stays fixed to preserve saved content and results. Use Add New Content for a different selection.</p>{collection === 'learning_contents' && <label className="block text-sm">Upload replacement study file<input className={style} type="file" accept=".pdf,.docx,.pptx,.png,.jpg,.jpeg,.webp,.txt" disabled={busy} onChange={e=>{uploadAttachment(e.target.files?.[0]);e.currentTarget.value='';}}/></label>}{editable[collection].filter(key => draft[key] !== undefined || ['hindiTitle', 'bodyHindi', 'hindiMessage', 'blessingQuote'].includes(key)).map(key => <Fields key={key} value={draft[key]} label={labels[key] || key} onChange={next => setDraft({ ...draft, [key]: next })} />)}<div className="flex gap-2"><button className={`${button} bg-orange-600 text-white`} disabled={busy} onClick={() => persist(draft, false)}>Save replacement</button><button className={button} disabled={busy} onClick={() => setDraft(null)}>Cancel</button></div></div>}
    {message && <p role="status" className="text-sm border rounded-lg p-3">{message}</p>}
  </section>;
}

