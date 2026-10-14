import { createContext } from 'react';

// The settings provider sits above curriculum; keep display language independent
// so curriculum can read settings without a circular provider dependency.
export const DisplayLanguageContext = createContext<'en' | 'hi'>('en');
