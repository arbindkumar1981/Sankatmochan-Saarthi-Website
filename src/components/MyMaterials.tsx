import React, { useEffect, useState, lazy, Suspense } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from '../context/AuthContext';
import type { SavedMaterial } from '../services/savedMaterials';
import { ProtectedMaterial } from './ProtectedMaterial';

const StudyPdfReader = lazy(() => import('./StudyPdfReader').then(module => ({ default: module.StudyPdfReader })));
export function MyMaterials() {
  const { user } = useAuth();
  const [items, setItems] = useState<SavedMaterial[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [error, setError] = useState('');
  useEffect(() => {
    setItems([]); setSelected(''); setError('');
    if (!user || user.isAnonymous) return;
    return onSnapshot(collection(db, 'users', user.uid, 'saved_materials'), snapshot => {
      setItems(snapshot.docs.map(d => ({ ...d.data(), id: d.id }) as SavedMaterial).sort((a, b) => b.savedAt.localeCompare(a.savedAt)));
    }, () => setError('Unable to load your saved material. Please try again.'));
  }, [user?.uid]);
  const active = items.find(item => item.id === selected);
  return <div className="flex-1 min-w-0 bg-white p-5 border rounded-2xl"><h2 className="text-xl font-bold mb-4">My Dashboard — Saved Materials</h2><ProtectedMaterial>
    {error && <p role="alert">{error}</p>}
    {!error && !items.length && <p>Use “Save to My Dashboard” in Learning Hub to keep material here.</p>}
    <div className="flex flex-wrap gap-2 mb-4">{items.map(item => <button key={item.id} className="border rounded-xl p-3 text-left" onClick={() => setSelected(item.id)}>{item.title}</button>)}</div>
    {active && <article><h3 className="text-xl font-bold">{active.title}</h3><p className="text-sm text-stone-500 mb-4">{active.curriculum}</p>{!active.contentId && <div className="whitespace-pre-wrap break-words leading-relaxed">{active.body}</div>}</article>}
  </ProtectedMaterial>{active?.contentId && <Suspense fallback={<p role="status">Opening PDF reader…</p>}><StudyPdfReader key={active.id} contentId={active.contentId} /></Suspense>}</div>;
}
