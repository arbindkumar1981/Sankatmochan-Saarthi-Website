import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useWebsite } from '../context/WebsiteContext';

export function ProtectedMaterial({ children }: { children: React.ReactNode }) {
  const { user, openAuthModal } = useAuth();
  const { config } = useWebsite();
  if (!user || user.isAnonymous) return <section className="border rounded-2xl p-6 bg-white"><p>Sign in to read your learning material.</p><button className="mt-3 border rounded-xl p-3" onClick={() => openAuthModal('student')}>Student Sign In</button></section>;
  const watermark = `${config.name} · Personal study · ${user.uid.slice(-8)}`;
  return <section className="protected-material relative w-full min-w-0 select-none" onCopy={e => e.preventDefault()} onCut={e => e.preventDefault()} onContextMenu={e => e.preventDefault()}>
    <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden flex flex-col justify-around" aria-hidden="true">{Array.from({ length: 8 }, (_, index) => <span key={index} className="text-center text-stone-500/20 text-lg -rotate-12 break-words">{watermark}</span>)}</div>
    <p className="text-xs text-stone-500 mb-2">{watermark}</p>{children}
  </section>;
}
