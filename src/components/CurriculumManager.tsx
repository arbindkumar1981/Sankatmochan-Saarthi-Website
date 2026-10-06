import { useState } from 'react';
import { useCurriculum } from '../context/CurriculumContext';
import { useWebsite } from '../context/WebsiteContext';
import type { SubjectMeta, ChapterMeta, TopicMeta, ClassGrade } from '../types';
import { editableUploadedSubject } from '../services/uploadedTopics';

const input = 'border rounded-lg p-2 text-sm w-full min-w-0 bg-white';
const button = 'border rounded-lg px-3 py-2 text-xs font-semibold hover:bg-orange-50 disabled:opacity-40';
const newId = (prefix: string) => `${prefix}-${crypto.randomUUID()}`;
export function CurriculumManager() {
  const { allCurriculumSubjects, learningContents, deletedAssetIds, saveCurriculumSubject, selectedSubject, selectedBoard, selectedClass, selectedStream } = useCurriculum();
  const { config } = useWebsite();
  const load = (subject: SubjectMeta) => editableUploadedSubject({ ...subject, teacherSubject: subject.teacherSubject || subject.name }, learningContents, deletedAssetIds);
  const initial = allCurriculumSubjects.find(s => s.id === selectedSubject?.id) || allCurriculumSubjects[0];
  const [draft, setDraft] = useState<SubjectMeta | null>(() => initial ? load(initial) : null);
  const [section, setSection] = useState<'subjects' | 'chapters' | 'topics'>('subjects');
  const [chapterId, setChapterId] = useState(initial?.chapters[0]?.id || '');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [search, setSearch] = useState('');
  const [adminClass, setAdminClass] = useState<ClassGrade>(selectedClass);
  const classSubjects = allCurriculumSubjects.filter(subject => subject.classes.includes(adminClass));
  const change = (patch: Partial<SubjectMeta>) => setDraft(prev => prev ? { ...prev, ...patch } : null);
  const chapter = draft?.chapters.find(ch => ch.id === chapterId) || draft?.chapters[0];
  const changeChapter = (patch: Partial<ChapterMeta>) => { if (chapter && draft) change({ chapters: draft.chapters.map(ch => ch.id === chapter.id ? { ...ch, ...patch } : ch) }); };
  const changeTopic = (topicId: string, patch: Partial<TopicMeta>) => { if (chapter) changeChapter({ topics: chapter.topics.map(topic => topic.id === topicId ? { ...topic, ...patch } : topic) }); };
  const addSubject = () => { setDraft({ id: newId('subject'), name: 'New subject', hindiName: '', board: selectedBoard, classes: [adminClass], stream: selectedStream, icon: 'BookOpen', chapters: [] }); setSection('subjects'); setChapterId(''); setMessage(''); };
  const addChapter = () => { if (!draft) return; const id = newId('chapter'); change({ chapters: [...draft.chapters, { id, title: 'New chapter', hindiTitle: '', chapterNumber: Math.max(0, ...draft.chapters.map(ch => ch.chapterNumber)) + 1, topics: [] }] }); setChapterId(id); setSection('chapters'); };
  const addTopic = () => { if (!chapter) return; changeChapter({ topics: [...chapter.topics, { id: newId('topic'), title: 'New topic', hindiTitle: '', order: Math.max(0, ...chapter.topics.map(t => t.order)) + 1 }] }); setSection('topics'); };
  const submit = async () => {
    if (!draft) return;
    setBusy(true); setMessage('');
    try { await saveCurriculumSubject(draft); setDraft({ ...draft, revision: (draft.revision || 0) + 1 }); setMessage('Saved. Subject, chapter and topic controls are updated on the student portal.'); }
    catch (error) { setMessage(error instanceof Error ? error.message : 'Save failed.'); }
    finally { setBusy(false); }
  };
  return <section className="space-y-4 border rounded-2xl p-4">
    <h3 className="font-bold text-lg">Subjects, Chapters & Topics — Control Panel</h3>
    <p className="text-sm text-stone-600">Add, edit or replace names, remove from the student menu, and restore. Uploaded-note topics are included. Save applies your changes.</p>
    <fieldset disabled={busy} className="space-y-4">
      <div className="flex flex-wrap gap-2">{(['subjects', 'chapters', 'topics'] as const).map(key => <button className={`${button} ${section === key ? 'bg-orange-100' : ''}`} key={key} aria-pressed={section === key} onClick={() => setSection(key)}>{key.charAt(0).toUpperCase() + key.slice(1)}</button>)}</div>
      <p className="text-sm font-semibold">Class → Subject → Chapter → Topic</p>
      <div className="grid sm:grid-cols-3 gap-3">
        <label className="text-sm">Class<select aria-label="Choose curriculum class" className={input} value={adminClass} onChange={e => { const grade = e.target.value as ClassGrade; setAdminClass(grade); setSearch(''); const subject = allCurriculumSubjects.find(s => s.classes.includes(grade) && !s.deleted) || allCurriculumSubjects.find(s => s.classes.includes(grade)); setDraft(subject ? load(subject) : null); setChapterId(subject?.chapters[0]?.id || ''); setMessage(''); }}>{config.classes.map(x => <option key={x.id} value={x.id}>{x.label}{x.deleted ? ' (Removed)' : ''}</option>)}</select></label>
        <label className="text-sm">Find subject<input aria-label="Find curriculum subject" className={input} placeholder="Search by subject, class or stream" value={search} onChange={e => setSearch(e.target.value)} /></label>
        <label className="text-sm">Subject<select aria-label="Choose curriculum subject" className={input} value={draft?.id || ''} onChange={e => { const subject = allCurriculumSubjects.find(x => x.id === e.target.value); setDraft(subject ? load(subject) : null); setChapterId(subject?.chapters[0]?.id || ''); setMessage(''); }}>
          {!classSubjects.some(s => s.id === draft?.id) && <option value={draft?.id || ''}>{draft?.name || 'Choose subject / Add subject'}</option>}
          {classSubjects.filter(x => x.id === draft?.id || `${x.name} ${x.stream} ${x.board || 'CBSE'}`.toLowerCase().includes(search.toLowerCase())).map(x => <option key={x.id} value={x.id}>{x.board || 'CBSE'} · {x.stream} · {x.name}{x.deleted ? ' (Removed)' : ''}</option>)}
        </select></label>
      </div>
      <div className="flex flex-wrap gap-2">
        <button className={button} onClick={addSubject}>Add subject</button>
        <button className={button} disabled={!draft || draft.deleted} onClick={addChapter}>Add chapter</button>
        <button className={button} disabled={!chapter || chapter.deleted || draft?.deleted} onClick={addTopic}>Add topic</button>
        {draft && <button className={button} onClick={() => setSection('subjects')}>Edit subject</button>}
        {draft && <button className={button} onClick={() => change({ deleted: !draft.deleted })}>{draft.deleted ? 'Restore subject' : 'Remove subject'}</button>}
      </div>
      {draft && <>
        <p className="text-sm font-semibold">{draft.board || 'CBSE'} · {draft.classes.join(', ')} · {draft.stream} · {draft.name}{draft.deleted ? ' — Removed' : ''}</p>
        {section === 'subjects' && <div className="space-y-3">
          <h4 className="font-bold">Edit / Replace subject</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label>Name<input aria-label="Subject name" className={input} maxLength={160} value={draft.name} onChange={e => change({ name: e.target.value })} /></label>
            <label>Hindi name<input className={input} maxLength={160} value={draft.hindiName} onChange={e => change({ hindiName: e.target.value })} /></label>
            <label>Board<select className={input} value={draft.board || 'CBSE'} onChange={e => change({ board: e.target.value })}>{config.boards.map(x => <option key={x.id} value={x.id}>{x.label}{x.deleted ? ' (Removed)' : ''}</option>)}</select></label>
            <label>Stream<select className={input} value={draft.stream} onChange={e => change({ stream: e.target.value })}>{config.streams.map(x => <option key={x.id} value={x.id}>{x.label}{x.deleted ? ' (Removed)' : ''}</option>)}</select></label>
            <label>Official subject code<input className={input} value={draft.officialCode || ''} onChange={e => change({ officialCode: e.target.value })} /></label>
          </div>
          <fieldset><legend>Classes</legend><div className="flex flex-wrap gap-3">{config.classes.map(x => <label key={x.id} className="flex gap-1 text-sm"><input type="checkbox" checked={draft.classes.includes(x.id)} onChange={e => change({ classes: e.target.checked ? [...draft.classes, x.id] : draft.classes.filter(v => v !== x.id) })} />{x.label}</label>)}</div></fieldset>
        </div>}
        {section !== 'subjects' && <div className="space-y-3">
          <label>Chapter<select aria-label="Choose curriculum chapter" className={input} value={chapter?.id || ''} onChange={e => setChapterId(e.target.value)}>{!draft.chapters.length && <option value="">Add a chapter first</option>}{draft.chapters.map(ch => <option key={ch.id} value={ch.id}>{ch.chapterNumber}. {ch.title}{ch.deleted ? ' (Removed)' : ''}</option>)}</select></label>
          {chapter && <>
            <div className="flex flex-wrap items-center justify-between gap-2"><h4 className="font-bold">{section === 'chapters' ? 'Edit / Replace chapter' : `Topics in ${chapter.title}`}</h4><div className="flex gap-2"><button className={button} onClick={() => setSection('chapters')}>Edit chapter</button><button className={button} onClick={() => changeChapter({ deleted: !chapter.deleted })}>{chapter.deleted ? 'Restore chapter' : 'Remove chapter'}</button></div></div>
            {section === 'chapters' && <div className="grid sm:grid-cols-2 gap-3"><label>Chapter title<input className={input} maxLength={300} value={chapter.title} onChange={e => changeChapter({ title: e.target.value })} /></label><label>Hindi chapter title<input className={input} maxLength={300} value={chapter.hindiTitle} onChange={e => changeChapter({ hindiTitle: e.target.value })} /></label><label>Chapter number<input className={input} type="number" min={1} value={chapter.chapterNumber} onChange={e => changeChapter({ chapterNumber: Number(e.target.value) })} /></label></div>}
            {section === 'topics' && <>
              {!chapter.topics.length && <p className="text-sm text-stone-500">No topics yet. Use Add topic above.</p>}
              {chapter.topics.map(topic => <article key={topic.id} className={`border rounded-xl p-3 space-y-2 ${topic.deleted ? 'bg-stone-100' : ''}`}>
                <div className="flex flex-wrap justify-between gap-2"><h5 className="font-semibold">{topic.title}{topic.deleted ? ' — Removed' : ''}</h5><div className="flex gap-2"><button className={button} onClick={e => e.currentTarget.closest('article')?.querySelector<HTMLInputElement>('input')?.focus()}>Edit topic</button><button className={button} onClick={() => changeTopic(topic.id, { deleted: !topic.deleted })}>{topic.deleted ? 'Restore topic' : 'Remove topic'}</button></div></div>
                <p className="text-xs text-stone-500">Edit / Replace topic{topic.materialIds?.length ? ' · Linked to uploaded notes' : ''}</p>
                <div className="grid sm:grid-cols-2 gap-2"><label>Topic name<input aria-label={`Topic name ${topic.id}`} className={input} maxLength={300} value={topic.title} onChange={e => changeTopic(topic.id, { title: e.target.value })} /></label><label>Hindi topic name<input className={input} maxLength={300} value={topic.hindiTitle} onChange={e => changeTopic(topic.id, { hindiTitle: e.target.value })} /></label></div>
              </article>)}
            </>}
          </>}
        </div>}
        <div className="flex flex-wrap gap-2 sticky bottom-0 bg-white border-t p-3"><button className={`${button} bg-orange-600 text-white`} onClick={submit}>Save curriculum changes</button><button className={button} onClick={() => { const current = allCurriculumSubjects.find(s => s.id === draft.id); if (current) { setDraft(load(current)); setMessage('Saved subject reloaded.'); } else { setDraft(initial ? load(initial) : null); } }}>Cancel / Reload saved subject</button></div>
      </>}
    </fieldset>
    {message && <p role="status" className="text-sm border rounded-lg p-3">{message}</p>}
  </section>;
}
