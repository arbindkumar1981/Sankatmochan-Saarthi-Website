import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useWebsite } from '../context/WebsiteContext';

/**
 * Keep attribution readable and outside the study content. Repeated absolute
 * watermarks obscure PDF pages, diagrams, and notes on smaller screens.
 */
export function ProtectedMaterial({ children }: { children: React.ReactNode }) {
  const { user, openAuthModal } = useAuth();
  const { config } = useWebsite();
  if (!user || user.isAnonymous) return <section className="border rounded-2xl p-6 bg-white"><p>Sign in to read your learning material.</p><button className="mt-3 border rounded-xl p-3" onClick={() => openAuthModal('student')}>Student Sign In</button></section>;
  const watermark = `${config.name} · Personal study · ${user.uid.slice(-8)}`;
  return <section className="protected-material relative w-full min-w-0" onCopy={e => e.preventDefault()} onCut={e => e.preventDefault()} onContextMenu={e => e.preventDefault()}>
    <div className="mb-3 flex min-w-0 items-center gap-3 border-b border-stone-200 pb-2">
      <img src={config.logoUrl} alt={`${config.name} logo`} className="h-9 w-auto max-w-24 shrink-0 object-contain" />
      <p className="min-w-0 break-words text-xs text-stone-500">{watermark}</p>
    </div>
    {children}
  </section>;
}
