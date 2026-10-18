import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { adminRead, type TopicProgressPage } from '../services/adminApi';

export function TopicMasteryDashboard({ authorized = false }: { authorized?: boolean } = {}) {
  const { user, isAdmin } = useAuth();
  const permitted = isAdmin || authorized;
  const [filters, setFilters] = useState({ student: '', subject: '', board: '', class_level: '' });
  const [search, setSearch] = useState('');
  const [page, setPage] = useState<TopicProgressPage | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [pageKey, setPageKey] = useState('');
  const viewKey = `${user?.uid || ''}:${search}:${refresh}`;
  useEffect(() => {
    const controller = new AbortController();
    setPage(null); setError('');
    if (!user || !permitted || user.isAnonymous) return () => controller.abort();
    setLoading(true);
    adminRead<TopicProgressPage>(`/topic-mastery?${search}`, controller.signal)
      .then(result => { if (!controller.signal.aborted) { setPage(result); setPageKey(viewKey); } })
      .catch(() => { if (!controller.signal.aborted) setError('Topic mastery is unavailable. Please retry or contact support.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [search, user, permitted, refresh, viewKey]);
  if (!user || !permitted || user.isAnonymous) return null;
  const score = (value: number | null) => value === null ? 'Not measured' : `${value}%`;
  return <section className="space-y-3 rounded-xl border bg-white p-4" aria-label="Topic mastery dashboard">
    <h3 className="font-bold">Topic-wise student mastery</h3>
    <p className="text-xs text-stone-600">Mastery uses existing academic progress records on a scale of 0–100; the target is 80%. Average test score is a separate assessment metric. Missing mastery stays “Not measured”. The academic student directory is separate from website accounts.</p>
    <form className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5" onSubmit={event => { event.preventDefault(); setSearch(new URLSearchParams(filters).toString()); setRefresh(value => value + 1); }}>
      {([['student', 'Student name or academic ID'], ['subject', 'Subject'], ['board', 'Board code'], ['class_level', 'Class']] as const).map(([key, label]) => <label key={key} className="text-xs">{label}<input aria-label={`Mastery ${label}`} className="mt-1 w-full rounded border p-2" maxLength={key === 'board' || key === 'class_level' ? 40 : 128} value={filters[key]} onChange={event => setFilters(previous => ({ ...previous, [key]: event.target.value }))} /></label>)}
      <button type="submit" className="self-end rounded border p-2 text-sm" disabled={loading}>Apply filters / Refresh</button>
    </form>
    {loading && <p role="status" className="text-sm">Loading topic progress…</p>}
    {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
    {page && pageKey === viewKey && <><div className="overflow-auto"><table className="w-full min-w-[850px] text-left text-xs"><thead><tr>{['Student', 'Curriculum / Topic', 'Mastery / Target', 'Calculated', 'Average test score', 'Tests', 'Learning activity'].map(label => <th key={label} className="p-2">{label}</th>)}</tr></thead><tbody>
      {page.rows.map(row => <tr key={`${row.student_id}:${row.topic_id}`} className="border-t"><td className="p-2">{row.student_name}<span className="block text-stone-500">{row.student_id}</span></td><td className="p-2">{row.board} · {row.class_level} · {row.subject_name}<span className="block">{row.chapter_title} / {row.topic_title}</span></td><td className="p-2">{score(row.mastery)}<span className="block">{row.mastered === null ? 'No mastery record' : row.mastered ? 'Target reached' : 'Keep practising'}</span></td><td className="p-2">{row.calculated_at?.slice(0, 10) || '—'}</td><td className="p-2">{score(row.average_test_score)}</td><td className="p-2">{row.test_attempts}</td><td className="p-2">Notes: {row.notes_viewed ? 'Viewed' : 'Not recorded'}<br />Practice: {row.practice_started ? 'Started' : 'Not recorded'}</td></tr>)}
      {!page.rows.length && <tr><td className="p-3" colSpan={7}>No recorded academic progress matches these filters.</td></tr>}
    </tbody></table></div>{page.next && <button type="button" className="rounded border px-3 py-2 text-sm" onClick={() => { const parameters = new URLSearchParams(search); Object.entries(page.next!).forEach(([key, value]) => parameters.set(key, value)); setSearch(parameters.toString()); }}>Next page</button>}</>}
  </section>;
}
