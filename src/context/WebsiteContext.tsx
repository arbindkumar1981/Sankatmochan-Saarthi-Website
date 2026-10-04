import React, { createContext, useContext, useEffect, useState } from 'react';
import { doc, onSnapshot, runTransaction } from 'firebase/firestore';
import { db } from '../services/firebase';
import { useAuth } from './AuthContext';
import { DEFAULT_WEBSITE_CONFIG, validateWebsiteConfig, resolveCopy, type WebsiteConfig } from '../services/websiteConfig';

interface WebsiteContextValue {
  config: WebsiteConfig; revision: number; syncError: string;
  save: (config: WebsiteConfig, expectedRevision: number) => Promise<void>;
  text: (original: string) => string;
}
const WebsiteContext = createContext<WebsiteContextValue | null>(null);
export function WebsiteProvider({ children }: { children: React.ReactNode }) {
  const { user, isAdmin } = useAuth();
  const [config, setConfig] = useState(DEFAULT_WEBSITE_CONFIG);
  const [revision, setRevision] = useState(0);
  const [syncError, setSyncError] = useState('');
  useEffect(() => onSnapshot(doc(db, 'curriculum_nodes', '_website_config'), snap => {
    try {
      const data = snap.data();
      setConfig(data?.config ? validateWebsiteConfig({ ...DEFAULT_WEBSITE_CONFIG, ...data.config }) : DEFAULT_WEBSITE_CONFIG);
      setRevision(Number(data?.revision || 0)); setSyncError('');
    } catch { setSyncError('Website settings could not be read. Default settings remain available.'); }
  }, () => setSyncError('Website settings could not sync. Check connectivity before saving.')), []);
  useEffect(() => { document.title = config.name; }, [config.name]);
  const save = async (next: WebsiteConfig, expectedRevision: number) => {
    if (!user || user.isAnonymous || !isAdmin) throw new Error('Administrator login is required.');
    const validated = validateWebsiteConfig(next);
    await runTransaction(db, async transaction => {
      const reference = doc(db, 'curriculum_nodes', '_website_config');
      const current = await transaction.get(reference);
      if (Number(current.data()?.revision || 0) !== expectedRevision) throw new Error('Another admin updated the website. Reload settings before saving your changes.');
      transaction.set(reference, { kind: 'website_config', config: validated, revision: expectedRevision + 1, updatedAt: new Date().toISOString() });
    });
  };
  return <WebsiteContext.Provider value={{ config, revision, syncError, save, text: original => resolveCopy(config, original) }}>{children}</WebsiteContext.Provider>;
}
export function useWebsite() {
  const context = useContext(WebsiteContext);
  if (!context) throw new Error('WebsiteProvider is required.');
  return context;
}
export function WebsiteText({ original }: { original: string }) {
  const { text } = useWebsite(); return <>{text(original)}</>;
}
