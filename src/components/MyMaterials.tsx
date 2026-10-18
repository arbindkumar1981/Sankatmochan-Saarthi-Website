import React, { useEffect, useState, lazy, Suspense } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import type { SavedMaterial } from '../services/savedMaterials';
import { SavedMaterialView } from './SavedMaterialView';
import { recordsForIdentity } from '../services/requestScope';
import { ProtectedMaterial } from './ProtectedMaterial';

const StudyPdfReader = lazy(() => import('./StudyPdfReader').then(module => ({ default: module.StudyPdfReader })));
export function MyMaterials() {
  const { user } = useAuth();
  const identity = user && !user.isAnonymous ? user.uid : '';
  const [snapshot, setSnapshot] = useState<{owner: string; items: SavedMaterial[]}>({owner: '', items: []});
  const items = recordsForIdentity(snapshot.owner, identity, snapshot.items);
  const [selected, setSelected] = useState<string>('');
  const [error, setError] = useState('');
  useEffect(() => {
    setSnapshot({owner: identity, items: []}); setSelected(''); setError('');
    if (!identity) return;
    let active = true;
    const unsubscribe = onSnapshot(collection(db, 'users', identity, 'saved_materials'), result => {
      if (active) setSnapshot({owner: identity, items: result.docs.map(d => ({ ...d.data(), id: d.id }) as SavedMaterial).sort((a, b) => b.savedAt.localeCompare(a.savedAt))});
    }, () => { if (active) setError('Unable to load your saved material. Please try again.'); });
    return () => { active = false; unsubscribe(); };
  }, [identity]);
  const active = items.find(item => item.id === selected);
  return <div className="flex-1 min-w-0 bg-white p-5 border rounded-2xl"><h2 className="text-xl font-bold mb-4">My Dashboard — Saved Materials</h2><ProtectedMaterial>
    {error && <p role="alert">{error}</p>}
    {!error && !items.length && <p>Use “Save to My Dashboard” in Learning Hub to keep material here.</p>}
    <div className="flex flex-wrap gap-2 mb-4">{items.map(item => <button key={item.id} className="border rounded-xl p-3 text-left" onClick={() => setSelected(item.id)}>{item.title}</button>)}</div>
    {active && <SavedMaterialView material={active} />}
  </ProtectedMaterial>{active?.contentId && <Suspense fallback={<p role="status">Opening PDF reader…</p>}><StudyPdfReader key={active.id} contentId={active.contentId} /></Suspense>}</div>;
}
