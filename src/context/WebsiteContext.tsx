import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, onSnapshot, runTransaction } from 'firebase/firestore';
import { db } from '../services/firebase';
import { overlayNavigation, parsePublished, type CmsEntry } from '../services/publishedCms';
import { useAuth } from './AuthContext';
import { DEFAULT_WEBSITE_CONFIG, validateWebsiteConfig, resolveCopy, type WebsiteConfig } from '../services/websiteConfig';

interface WebsiteContextValue {
  publishedEntries: CmsEntry[]; config: WebsiteConfig; revision: number; syncError: string;
  save: (config: WebsiteConfig, expectedRevision: number) => Promise<void>;
  text: (original: string) => string;
}
const WebsiteContext = createContext<WebsiteContextValue | null>(null);
export function WebsiteProvider({ children }: { children: React.ReactNode }) {
  const { user, isAdmin } = useAuth();
  const [config, setConfig] = useState(DEFAULT_WEBSITE_CONFIG);
  const [publishedEntries, setPublishedEntries] = useState<CmsEntry[]>([]);
  const [revision, setRevision] = useState(0);
  const [syncError, setSyncError] = useState('');
  useEffect(() => onSnapshot(doc(db, 'curriculum_nodes', '_website_config'), snap => {
    try {
      const data = snap.data();
      setConfig(data?.config ? validateWebsiteConfig({ ...DEFAULT_WEBSITE_CONFIG, ...data.config }) : DEFAULT_WEBSITE_CONFIG);
      setRevision(Number(data?.revision || 0)); setSyncError('');
    } catch { setSyncError('Website settings could not be read. Default settings remain available.'); }
  }, () => setSyncError('Website settings could not sync. Check connectivity before saving.')), []);
  useEffect(() => {
    const base = import.meta.env.VITE_SAARTHI_API_URL, tenant = import.meta.env.VITE_CMS_TENANT_ID;
    if (!base || !tenant || !/^[A-Za-z0-9_-]{1,128}$/.test(tenant)) return;
    const controller = new AbortController();
    const refresh = async () => { try { const response=await fetch(`${base.replace(/\/$/, '')}/v1/control-center/published/${tenant}`, {signal: controller.signal, cache:'no-store'}); if (!response.ok) throw new Error('Unavailable'); const rows = parsePublished(await response.json()); if (!controller.signal.aborted) setPublishedEntries(rows); } catch { /* Keep last verified config or defaults during an outage. */ } };
    void refresh(); const interval=setInterval(() => void refresh(), 30000);
    return () => {controller.abort(); clearInterval(interval);};
  }, []);
  useEffect(() => { document.title = config.name; }, [config.name]);
  const save = async (next: WebsiteConfig, expectedRevision: number) => {
    if (!user || user.isAnonymous || !isAdmin) throw new Error('Administrator login is required.');
    const validated = validateWebsiteConfig(next);
    await runTransaction(db, async transaction => {
      const reference = doc(db, 'curriculum_nodes', '_website_config');
      const current = await transaction.get(reference);
      if (Number(current.data()?.revision || 0) !== expectedRevision) throw new Error('Another admin updated the website. Reload settings before saving your changes.');
      const now = new Date().toISOString();
      transaction.set(reference, { kind: 'website_config', config: validated, revision: expectedRevision + 1, updatedAt: now });
      // Audit capture uses the provider-authenticated server event, never
      // client-selected identity, action or time. Keep revision checking atomic.
    });
  };
  return <WebsiteContext.Provider value={{ publishedEntries, config: overlayNavigation(config, publishedEntries), revision, syncError, save, text: original => resolveCopy(config, original) }}>{children}</WebsiteContext.Provider>;
}
export function useWebsite() {
  const context = useContext(WebsiteContext);
  if (!context) throw new Error('WebsiteProvider is required.');
  return context;
}
export function WebsiteText({ original }: { original: string }) {
  const { text } = useWebsite(); return <>{text(original)}</>;
}
