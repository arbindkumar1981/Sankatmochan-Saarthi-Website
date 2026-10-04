import React, { useState } from 'react';
import { useCurriculum } from '../context/CurriculumContext';
import { useWebsite } from '../context/WebsiteContext';
import type { SubjectMeta } from '../types';
import { activeOptions } from '../services/websiteConfig';

const input = 'border rounded-lg p-2 text-sm w-full min-w-0';
const button = 'border rounded-lg px-3 py-2 text-xs font-semibold hover:bg-orange-50';
const newId = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;
export function CurriculumManager() {
  const { allCurriculumSubjects, saveCurriculumSubject } = useCurriculum();
  const { config } = useWebsite();
  const [selected, setSelected] = useState('');
  const [draft, setDraft] = useState<SubjectMeta | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState('');
  const change = (patch: Partial<SubjectMeta>) => setDraft(prev => prev ? { ...prev, ...patch } : null);
  const submit = async () => {
    if (!draft) return;
    setBusy(true); setMessage('');
    try { await saveCurriculumSubject(draft); setDraft({ ...draft, revision: (draft.revision || 0) + 1 }); setSelected(draft.id); setMessage('Curriculum saved. Existing content and student results keep their identities.'); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Save failed.'); }
    finally { setBusy(false); }
  };
  return <section className="space-y-3 border rounded-2xl p-4">
    <h3 className="font-bold">Curriculum — Subjects / Chapters / Topics</h3>
    <input aria-label="Find curriculum subject" className={input} placeholder="Search subjects" value={search} onChange={e => setSearch(e.target.value)} />
    <select aria-label="Choose curriculum subject" className={input} value={selected} onChange={e => { const subject = allCurriculumSubjects.find(x => x.id === e.target.value); setSelected(e.target.value); setDraft(subject ? structuredClone({ ...subject, teacherSubject: subject.teacherSubject || subject.name }) : null); setMessage(''); }}>
      <option value="">Choose an item to replace, delete or restore</option>
      {allCurriculumSubjects.filter(x => `${x.name} ${x.classes.join(' ')} ${x.stream} ${x.board || 'CBSE'}`.toLowerCase().includes(search.toLowerCase())).map(x => <option key={x.id} value={x.id}>{x.board || 'CBSE'} · {x.classes.join(', ')} · {x.stream} · {x.name}{x.deleted ? ' (Deleted)' : ''}</option>)}
    </select>
    <button className={button} onClick={() => { setSelected(''); setDraft({ id: newId('subject'), name: 'New subject', hindiName: '', board: activeOptions(config.boards)[0]?.id || 'CBSE', classes: [activeOptions(config.classes)[0]?.id || 'Class 9'], stream: activeOptions(config.streams)[0]?.id || 'General', icon: 'BookOpen', chapters: [] }); }}>Add subject</button>
    {draft && <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label>Name<input className={input} value={draft.name} onChange={e => change({ name: e.target.value })} /></label>
        <label>Hindi name<input className={input} value={draft.hindiName} onChange={e => change({ hindiName: e.target.value })} /></label>
        <label>Board<select className={input} value={draft.board || 'CBSE'} onChange={e => change({ board: e.target.value })}>{config.boards.map(x => <option key={x.id} value={x.id}>{x.label}{x.deleted ? ' (Deleted)' : ''}</option>)}</select></label>
        <label>Stream<select className={input} value={draft.stream} onChange={e => change({ stream: e.target.value })}>{config.streams.map(x => <option key={x.id} value={x.id}>{x.label}{x.deleted ? ' (Deleted)' : ''}</option>)}</select></label>
        <label>Official subject code<input className={input} value={draft.officialCode || ''} onChange={e => change({ officialCode: e.target.value })} /></label>
      </div>
      <fieldset><legend>Classes</legend><div className="flex flex-wrap gap-3">{config.classes.map(x => <label key={x.id} className="flex gap-1 text-sm"><input type="checkbox" checked={draft.classes.includes(x.id)} onChange={e => change({ classes: e.target.checked ? [...draft.classes, x.id] : draft.classes.filter(v => v !== x.id) })} />{x.label}</label>)}</div></fieldset>
      <button className={button} onClick={() => change({ deleted: !draft.deleted })}>{draft.deleted ? 'Restore subject' : 'Delete subject'}</button>
      {draft.chapters.map(ch => <div key={ch.id} className={`border rounded-xl p-3 space-y-2 ${ch.deleted ? 'bg-stone-100' : ''}`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2"><label>Chapter title<input className={input} value={ch.title} onChange={e => change({ chapters: draft.chapters.map(x => x.id === ch.id ? { ...x, title: e.target.value } : x) })} /></label><label>Hindi chapter title<input className={input} value={ch.hindiTitle} onChange={e => change({ chapters: draft.chapters.map(x => x.id === ch.id ? { ...x, hindiTitle: e.target.value } : x) })} /></label><label>Chapter number<input className={input} type="number" min={1} value={ch.chapterNumber} onChange={e => change({ chapters: draft.chapters.map(x => x.id === ch.id ? { ...x, chapterNumber: Number(e.target.value) } : x) })} /></label></div>
        <button className={button} onClick={() => change({ chapters: draft.chapters.map(x => x.id === ch.id ? { ...x, deleted: !x.deleted } : x) })}>{ch.deleted ? 'Restore chapter' : 'Delete chapter'}</button>
        {ch.topics.map(topic => <div key={topic.id} className="grid grid-cols-1 sm:grid-cols-3 gap-2 border-t pt-2">
          <label>Topic<input className={input} value={topic.title} onChange={e => change({ chapters: draft.chapters.map(x => x.id === ch.id ? { ...x, topics: x.topics.map(t => t.id === topic.id ? { ...t, title: e.target.value } : t) } : x) })} /></label>
          <label>Hindi topic<input className={input} value={topic.hindiTitle} onChange={e => change({ chapters: draft.chapters.map(x => x.id === ch.id ? { ...x, topics: x.topics.map(t => t.id === topic.id ? { ...t, hindiTitle: e.target.value } : t) } : x) })} /></label>
          <button className={button} onClick={() => change({ chapters: draft.chapters.map(x => x.id === ch.id ? { ...x, topics: x.topics.map(t => t.id === topic.id ? { ...t, deleted: !t.deleted } : t) } : x) })}>{topic.deleted ? 'Restore topic' : 'Delete topic'}</button>
        </div>)}
        <button className={button} onClick={() => change({ chapters: draft.chapters.map(x => x.id === ch.id ? { ...x, topics: [...x.topics, { id: newId('topic'), title: 'New topic', hindiTitle: '', order: x.topics.length + 1 }] } : x) })}>Add topic</button>
      </div>)}
      <button className={button} onClick={() => change({ chapters: [...draft.chapters, { id: newId('chapter'), title: 'New chapter', hindiTitle: '', chapterNumber: draft.chapters.length + 1, topics: [] }] })}>Add chapter</button>
      <p className="text-xs text-stone-600">Delete hides items and preserves their content/history. Save applies the changes; Restore makes them visible again.</p>
      <button className={`${button} bg-orange-600 text-white`} disabled={busy} onClick={submit}>{busy ? 'Saving…' : 'Save curriculum changes'}</button>
    </div>}
    {message && <p role="status" className="text-sm border rounded-lg p-3">{message}</p>}
  </section>;
}
