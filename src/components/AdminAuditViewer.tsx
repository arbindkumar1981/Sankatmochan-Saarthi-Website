import { useEffect, useMemo, useState } from 'react';
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import { db } from '../services/firebase';

type AuditEvent = { id: string; action?: string; actorUid?: string; target?: string; revision?: number; createdAt?: string };

export function AdminAuditViewer() {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const actions = useMemo(() => [...new Set(events.map(event => event.action).filter((action): action is string => Boolean(action)))].sort(), [events]);
  const filteredEvents = useMemo(() => events.filter(event => (actionFilter === 'all' || event.action === actionFilter) && [event.action, event.actorUid, event.target, event.createdAt].some(value => String(value || '').toLowerCase().includes(search.trim().toLowerCase()))), [events, actionFilter, search]);
  useEffect(() => {
    const q = query(collection(db, 'admin_audit_logs'), orderBy('createdAt', 'desc'), limit(50));
    return onSnapshot(q, snapshot => {
      setEvents(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setError('');
    }, () => setError('Audit records could not be loaded. Verify admin access and Firestore indexes.'));
  }, []);
  return <section className="rounded-xl border bg-white p-4 space-y-3" aria-label="Admin audit history">
    <h3 className="font-bold">Website Change History</h3>
    <p className="text-xs text-stone-600">Latest 50 website settings changes. New events are append-only. Earlier changes and other admin actions are not covered.</p>
    {error && <p role="alert" className="text-xs text-red-700">{error}</p>}
    <div className="flex flex-wrap gap-3">
      <label className="text-xs font-semibold">Search audit records
        <input aria-label="Search audit records" className="mt-1 block rounded-lg border p-2 text-sm" value={search} onChange={event => setSearch(event.target.value)} placeholder="Admin UID, action, target or date" />
      </label>
      <label className="text-xs font-semibold">Action
        <select aria-label="Filter audit action" className="mt-1 block rounded-lg border p-2 text-sm" value={actionFilter} onChange={event => setActionFilter(event.target.value)}>
          <option value="all">All recorded actions</option>
          {actions.map(action => <option key={action} value={action}>{action}</option>)}
        </select>
      </label>
    </div>
    <p className="text-xs text-stone-500">Showing {filteredEvents.length} of {events.length} loaded events (latest 50 only).</p>
    <div className="max-h-80 overflow-auto">
      <table className="w-full min-w-[440px] text-left text-xs">
        <thead><tr><th className="p-2">Time (UTC)</th><th className="p-2">Action</th><th className="p-2">Revision</th><th className="p-2">Admin UID</th></tr></thead>
        <tbody>{filteredEvents.map(event => <tr key={event.id} className="border-t"><td className="p-2">{event.createdAt || '—'}</td><td className="p-2">{event.action || '—'}</td><td className="p-2">{event.revision ?? '—'}</td><td className="p-2 font-mono">{event.actorUid || '—'}</td></tr>)}
          {!filteredEvents.length && <tr><td colSpan={4} className="p-3 text-stone-500">No matching audit events in the latest 50 records.</td></tr>}
        </tbody>
      </table>
    </div>
  </section>;
}
