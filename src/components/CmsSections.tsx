import React from 'react';
import { useWebsite } from '../context/WebsiteContext';
import { useCurriculum } from '../context/CurriculumContext';
import { effectiveEntries, cmsMediaUrl } from '../services/publishedCms';
import { MenuIcon } from './MenuIcon';
export function CmsSections({route}: {route: string}) {
  const { publishedEntries } = useWebsite(); const { language } = useCurriculum();
  const entries = effectiveEntries(publishedEntries).filter(row => row.kind !== 'menu' && row.route === route && row.locale === language);
  if (!entries.length) return null;
  return <section aria-label="Published website content" className="grid w-full min-w-0 gap-4 md:grid-cols-2">{entries.map(entry => <article key={entry.id} className={`min-w-0 space-y-3 rounded-2xl border border-blue-100 bg-white p-5 ${entry.kind === 'banner' || entry.kind === 'page' ? 'md:col-span-2' : ''}`}><h2 className="flex items-center gap-2 text-xl font-bold"><MenuIcon icon={entry.icon} className="h-5 w-5" />{entry.title}</h2>{entry.mediaId && <img alt={entry.title} src={cmsMediaUrl(entry.mediaId)} loading="lazy" className="max-h-80 w-full rounded-xl object-contain" />}<p className="whitespace-pre-wrap break-words">{entry.description}</p></article>)}</section>;
}
