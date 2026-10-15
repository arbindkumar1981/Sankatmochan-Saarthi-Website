import { useEffect, useState } from 'react';
import { collection, documentId, limit, onSnapshot, orderBy, query, startAfter, where, type QueryConstraint } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';

type AuditEvent = { id: string; category?: string; operation?: string; actorType?: string; actorRef?: string; targetRef?: string; occurredAt?: string; changedFields?: string[]; source?: string; method?: string; action?: string; createdAt?: string };
const categories = ['content', 'curriculum', 'settings', 'users', 'access', 'assessment', 'progress', 'notices', 'enquiries', 'cloud_control', 'other'];

export function AdminAuditViewer() {
  const { user, isAdmin } = useAuth();
  const [records, setEvents] = useState<AuditEvent[]>([]);
  const [recordKey, setRecordKey] = useState('');
  const [error, setError] = useState('');
  const [category, setCategory] = useState('');
  const [operation, setOperation] = useState('');
  const [actor, setActor] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [legacy, setLegacy] = useState(false);
  const [cursor, setCursor] = useState<[string, string] | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const viewKey = JSON.stringify([user?.uid, category, operation, actor, from, to, cursor, legacy]);
  const events = recordKey === viewKey ? records : [];
  useEffect(() => { setCursor(null); }, [category, operation, actor, from, to, legacy, user]);
  useEffect(() => {
    setEvents([]); setError(''); setHasMore(false);
    if (!user || !isAdmin || user.isAnonymous) return;
    if (from && to && from > to) { setError('Choose an end date on or after the start date.'); return; }
    const clauses: QueryConstraint[] = [];
    if (!legacy) {
      if (category) clauses.push(where('category', '==', category));
      if (operation) clauses.push(where('operation', '==', operation));
      if (actor) clauses.push(where('actorRef', '==', actor));
      if (from) clauses.push(where('occurredAt', '>=', `${from}T00:00:00.000Z`));
      if (to) clauses.push(where('occurredAt', '<=', `${to}T23:59:59.999Z`));
    }
    clauses.push(orderBy(legacy ? 'createdAt' : 'occurredAt', 'desc'), orderBy(documentId(), 'desc'), limit(51));
    if (cursor) clauses.push(startAfter(...cursor));
    let active = true;
    const unsubscribe = onSnapshot(query(collection(db, legacy ? 'admin_audit_logs' : 'admin_audit_events'), ...clauses), snapshot => {
      if (!active) return;
      setEvents(snapshot.docs.slice(0, 50).map(item => ({ id: item.id, ...item.data() })));
      setRecordKey(viewKey);
      setHasMore(snapshot.docs.length > 50); setError('');
    }, () => { if (active) { setEvents([]); setError('Audit history could not be loaded. Check administrator access and deployed indexes.'); } });
    return () => { active = false; unsubscribe(); };
  }, [user, isAdmin, category, operation, actor, from, to, cursor, legacy, viewKey]);
  if (!user || !isAdmin || user.isAnonymous) return null;
  const last = events[events.length - 1];
  const field = 'mt-1 w-full rounded border p-2';
  return <section className="rounded-xl border bg-white p-4 space-y-3" aria-label="Admin audit history">
    <h3 className="font-bold">Administration audit history</h3>
    <p className="text-xs text-stone-600">Server-recorded changes to content, curriculum, users, settings and other records. Actor and target references protect personal information. This view cannot modify audit events.</p>
    <label className="flex gap-2 text-xs"><input type="checkbox" checked={legacy} onChange={event => setLegacy(event.target.checked)} />Historical website settings events (legacy client records)</label>
    {legacy ? <p className="text-xs text-amber-800">Legacy events cover website settings only; their actor information is not server-verified.</p> : <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
      <label className="text-xs">Category<select aria-label="Audit category" value={category} onChange={event => setCategory(event.target.value)} className={field}><option value="">All categories</option>{categories.map(value => <option key={value} value={value}>{value}</option>)}</select></label>
      <label className="text-xs">Operation<select aria-label="Audit operation" value={operation} onChange={event => setOperation(event.target.value)} className={field}><option value="">All operations</option>{['create', 'update', 'delete', 'mutation', 'failed'].map(value => <option key={value}>{value}</option>)}</select></label>
      <label className="text-xs">Actor reference<input aria-label="Audit actor reference" maxLength={64} value={actor} onChange={event => setActor(event.target.value)} className={field} /></label>
      <label className="text-xs">From (UTC)<input type="date" aria-label="Audit from date" value={from} onChange={event => setFrom(event.target.value)} className={field} /></label>
      <label className="text-xs">To (UTC)<input type="date" aria-label="Audit to date" value={to} onChange={event => setTo(event.target.value)} className={field} /></label>
    </div>}
    {error && <p role="alert" className="text-xs text-red-700">{error}</p>}
    <div className="max-h-96 overflow-auto"><table className="w-full min-w-[700px] text-left text-xs"><thead><tr>{['Time (UTC)', 'Category / Operation', 'Actor reference', 'Target / Fields'].map(value => <th key={value} className="p-2">{value}</th>)}</tr></thead><tbody>
      {events.map(event => <tr key={event.id} className="border-t"><td className="p-2">{event.occurredAt || event.createdAt || '—'}</td><td className="p-2">{event.category || event.action || '—'} / {event.operation || 'legacy'}<span className="block text-stone-500">{event.source || 'Legacy client record'}</span></td><td className="p-2"><button type="button" title="Filter by this actor reference" onClick={() => { if (event.actorRef) setActor(event.actorRef); }} className="font-mono">{event.actorRef?.slice(0, 12) || 'Unavailable'}</button><span className="block">{event.actorType}</span></td><td className="p-2"><span className="font-mono">{event.targetRef?.slice(0, 12) || '—'}</span><span className="block">{event.changedFields?.join(', ') || event.method || '—'}</span></td></tr>)}
      {!events.length && !error && <tr><td colSpan={4} className="p-3 text-stone-500">No matching events. An empty history does not prove that server audit capture is active.</td></tr>}
    </tbody></table></div>
    <div className="flex gap-2"><button type="button" disabled={!cursor} className="rounded border px-3 py-2 text-xs" onClick={() => setCursor(null)}>First page</button><button type="button" disabled={!hasMore || !last} className="rounded border px-3 py-2 text-xs" onClick={() => last && setCursor([legacy ? last.createdAt || '' : last.occurredAt || '', last.id])}>Next page</button></div>
  </section>;
}
