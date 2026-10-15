import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useWebsite } from '../context/WebsiteContext';

export function ProtectedMaterial({ children }: { children: React.ReactNode }) {
  const { user, openAuthModal } = useAuth();
  const { config } = useWebsite();
  if (!user || user.isAnonymous) return <section className="border rounded-2xl p-6 bg-white"><p>Sign in to read your learning material.</p><button className="mt-3 border rounded-xl p-3" onClick={() => openAuthModal('student')}>Student Sign In</button></section>;
  const watermark = `${config.name} · Personal study · ${user.uid.slice(-8)}`;
  return <section className="protected-material relative w-full min-w-0 select-none" onCopy={e => e.preventDefault()} onCut={e => e.preventDefault()} onContextMenu={e => e.preventDefault()}>
    <header className="mb-4 flex items-center gap-3 rounded-xl border border-orange-100 bg-white/95 px-3 py-2"><img src={config.logoUrl} alt={`${config.name} logo`} className="h-10 w-auto max-w-32 object-contain" /><p className="min-w-0 truncate text-xs text-stone-500">{watermark}</p></header>
    {children}
  </section>;
}
