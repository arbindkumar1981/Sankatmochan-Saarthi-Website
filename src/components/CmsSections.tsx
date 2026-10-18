import React, {useEffect, useState} from 'react';
import {useAuth} from '../context/AuthContext';
import { useWebsite } from '../context/WebsiteContext';
import { useCurriculum } from '../context/CurriculumContext';
import { effectiveEntries, cmsMediaUrl } from '../services/publishedCms';
import { MenuIcon } from './MenuIcon';
function CmsImage({mediaId, title}: {mediaId: string; title: string}) {
  const {user} = useAuth();
  const [preview, setPreview] = useState<{url: string; uid: string; mediaId: string} | null>(null);
  const gateway = import.meta.env.VITE_SAARTHI_API_URL === '/api';
  useEffect(() => {
    if (!gateway || !user || user.isAnonymous) return;
    const controller = new AbortController(); let objectUrl: string | undefined;
    void (async () => {
      try {
        const token = await user.getIdToken();
        if (controller.signal.aborted) return;
        const response = await fetch(cmsMediaUrl(mediaId), {signal: controller.signal, cache: 'no-store', headers: {Authorization: `Bearer ${token}`}});
        if (!response.ok) return;
        const blob = await response.blob();
        if (controller.signal.aborted) return;
        objectUrl = URL.createObjectURL(blob); setPreview({url: objectUrl, uid: user.uid, mediaId});
      } catch { /* Leave image unavailable when authentication or network fails. */ }
    })();
    return () => { controller.abort(); if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [gateway, mediaId, user]);
  const src = gateway ? (preview?.uid === user?.uid && preview?.mediaId === mediaId ? preview.url : undefined) : cmsMediaUrl(mediaId);
  return src ? <img alt={title} src={src} loading="lazy" className="max-h-80 w-full rounded-xl object-contain" /> : null;
}
export function CmsSections({route}: {route: string}) {
  const { publishedEntries } = useWebsite(); const { language } = useCurriculum();
  const entries = effectiveEntries(publishedEntries).filter(row => row.kind !== 'menu' && row.route === route && row.locale === language);
  if (!entries.length) return null;
  return <section aria-label="Published website content" className="grid w-full min-w-0 gap-4 md:grid-cols-2">{entries.map(entry => <article key={entry.id} className={`min-w-0 space-y-3 rounded-2xl border border-blue-100 bg-white p-5 ${entry.kind === 'banner' || entry.kind === 'page' ? 'md:col-span-2' : ''}`}><h2 className="flex items-center gap-2 text-xl font-bold"><MenuIcon icon={entry.icon} className="h-5 w-5" />{entry.title}</h2>{entry.mediaId && <CmsImage mediaId={entry.mediaId} title={entry.title} />}<p className="whitespace-pre-wrap break-words">{entry.description}</p></article>)}</section>;
}
