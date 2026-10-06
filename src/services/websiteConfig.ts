import type { BoardType, ClassGrade, StreamType } from '../types';
import { validateMenuAppearance, PROTECTED_NAVIGATION, type NavigationIcon } from './navigationAppearance';

export interface WebsiteOption { id: string; label: string; hindiLabel: string; deleted?: boolean; icon?: NavigationIcon; subtitle?: string; hindiSubtitle?: string }
export interface WebsiteCopy { replacement: string; deleted?: boolean }
export interface WebsiteQuote { id: string; en: string; hi: string; deleted?: boolean }
export interface WebsitePage { id: string; title: string; hindiTitle: string; body: string; hindiBody: string; deleted?: boolean; icon?: NavigationIcon }
export interface WebsiteConfig {
  name: string;
  logoUrl: string;
  logoVisible: boolean;
  babaImageUrl: string;
  bannerVisible: boolean;
  quotes: WebsiteQuote[];
  boards: WebsiteOption[];
  classes: WebsiteOption[];
  streams: WebsiteOption[];
  navigation: WebsiteOption[];
  modules: WebsiteOption[];
  pages: WebsitePage[];
  copy: Record<string, WebsiteCopy>;
}

export const DEFAULT_WEBSITE_CONFIG: WebsiteConfig = {
  name: 'Sankatmochan Saarthi', logoUrl: '/sankatmochan-saarthi-logo.png', logoVisible: true,
  babaImageUrl: '/baba.jpg', bannerVisible: true,
  quotes: [
    { id: 'quote-love', en: 'Love everyone, serve everyone, remember God, and tell the truth.', hi: 'सबको प्यार करो, सबकी सेवा करो, भगवान को याद रखो और सदा सत्य बोलो।' },
    { id: 'quote-one', en: 'All is One (Sub Ek Hai). Release anxiety and trust divine grace.', hi: 'सब एक है (Sub Ek Hai)। चिंता छोड़ो, परमात्मा की कृपा पर विश्वास रखो।' },
    { id: 'quote-devotion', en: 'No task in this world is too difficult when pursued with sincere devotion.', hi: 'कवन सो काज कठिन जग माहीं। जो नहिं तात होत तुम्ह पाहीं॥' },
    { id: 'quote-wisdom', en: 'Endowed with wisdom, character and vigilance in righteous duties.', hi: 'विद्यावान गुनी अति चातुर। राम काज करिबे को आतुर॥' },
    { id: 'quote-duty', en: 'Perform your duties with dedication; leave results to the Divine.', hi: 'कर्म पूरी निष्ठा से करो, फल की चिंता परमात्मा पर छोड़ दो — विजय निश्चित है।' },
    { id: 'quote-calm', en: 'Keep your heart pure and mind calm; divine grace guides every step.', hi: 'मन को शांत और पवित्र रखो, संकटमोचन स्वयं हर राह में सहायता करेंगे।' }
  ],
  boards: [
    { id: 'CBSE', label: 'CBSE', hindiLabel: 'सीबीएसई' },
    { id: 'ICSE_ISC', label: 'ICSE / ISC', hindiLabel: 'आईसीएसई / आईएससी' },
    { id: 'UP_BOARD', label: 'UP Board', hindiLabel: 'उत्तर प्रदेश बोर्ड' },
    { id: 'BIHAR_BOARD', label: 'Bihar Board', hindiLabel: 'बिहार बोर्ड' },
    { id: 'STATE_BOARD', label: 'Other State Boards', hindiLabel: 'अन्य राज्य बोर्ड' }
  ],
  classes: [9, 10, 11, 12].map((n, i) => ({ id: `Class ${n}`, label: `Class ${['IX', 'X', 'XI', 'XII'][i]}`, hindiLabel: `कक्षा ${n}` })),
  streams: ['General', 'Science', 'Commerce', 'Humanities'].map(id => ({ id, label: id, hindiLabel: id })),
  navigation: [
    ['materials', 'My Dashboard — Saved Materials', 'मेरी अध्ययन सामग्री'],
    ['learning', 'Learning Hub', 'अध्ययन कक्ष (Curriculum)'], ['youtube', 'Learn with YouTube', 'यूट्यूब से सीखें'],
    ['notices', 'Notice Board', 'प्रेरणादायक सूचना पट्ट'], ['evaluation', 'Evaluation Hub', 'मूल्यांकन एवं रिपोर्ट'],
    ['about', 'About Us', 'हमारे विषय में'], ['contact', 'Contact Us', 'संपर्क करें'], ['admin', 'Admin Control Panel', 'प्रशासक नियंत्रण कक्ष']
  ].map(([id, label, hindiLabel]) => ({ id, label, hindiLabel })),
  modules: [
    ['recommended_videos', 'Recommended Videos', 'अनुशंसित वीडियो'], ['detailed_notes', 'Detailed Notes', 'विस्तृत नोट्स'],
    ['revision_notes', 'Revision Notes', 'रिवीजन नोट्स'], ['formulae', 'Definitions & Formulae', 'परिभाषाएँ एवं सूत्र'],
    ['mindmaps', 'Mind Maps', 'माइंड मैप्स'], ['flashcards', 'Interactive Flashcards', 'इंटरैक्टिव फ्लैशकार्ड'],
    ['pyqs', 'Previous Year Questions (PYQ)', 'विगत वर्षों के प्रश्न (PYQs)'], ['cbqs', 'Competency-Based Questions', 'योग्यता-आधारित प्रश्न (CBQs)'],
    ['case_studies', 'Case-Based Studies', 'केस-आधारित अध्ययन'], ['test_yourself', 'Test Yourself', 'स्वयं का परीक्षण (Live Test)']
  ].map(([id, label, hindiLabel]) => ({ id, label, hindiLabel })),
  pages: [], copy: {}
};

export function safeImageUrl(value: string): boolean {
  if (value === '') return true;
  if (/^\/(?!\/)[^\s\\]*$/.test(value)) return true;
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password; } catch { return false; }
}

export function validateWebsiteConfig(value: WebsiteConfig): WebsiteConfig {
  if (!value || typeof value.name !== 'string' || !value.name.trim() || value.name.length > 120) throw new Error('Website name is required (maximum 120 characters).');
  if (!safeImageUrl(value.logoUrl) || !safeImageUrl(value.babaImageUrl)) throw new Error('Images must use an HTTPS URL or a local website image path.');
  if (typeof value.logoVisible !== 'boolean' || typeof value.bannerVisible !== 'boolean') throw new Error('Invalid display setting.');
  for (const key of ['boards', 'classes', 'streams', 'navigation', 'modules'] as const) {
    const list = value[key];
    if (!Array.isArray(list) || list.length > 100) throw new Error(`Invalid ${key} list.`);
    const ids = new Set<string>();
    for (const item of list) {
      if (!item || typeof item.id !== 'string' || !/^[a-zA-Z0-9 _-]{1,128}$/.test(item.id) || ids.has(item.id)) throw new Error(`Duplicate or invalid ${key} identity.`);
      ids.add(item.id);
      validateMenuAppearance(item);
      if (key === 'navigation' && PROTECTED_NAVIGATION.includes(item.id) && item.deleted) throw new Error('Dashboard and Admin access must remain available.');
      if (typeof item.label !== 'string' || !item.label.trim() || item.label.length > 160 || typeof item.hindiLabel !== 'string' || item.hindiLabel.length > 160 || (item.deleted !== undefined && typeof item.deleted !== 'boolean')) throw new Error(`Invalid ${key} label.`);
    }
    if (['boards', 'classes', 'streams', 'modules'].includes(key) && !list.some(x => !x.deleted)) throw new Error(`Keep at least one ${key} option.`);
    if (key === 'navigation') {
      const known = new Set(DEFAULT_WEBSITE_CONFIG[key].map(x => x.id));
      if (list.some(x => !known.has(x.id))) throw new Error('Use Add Page for a new menu page. Learning tools keep their existing identities.');
    }
  }
  if (!Array.isArray(value.quotes) || value.quotes.length > 100 || !Array.isArray(value.pages) || value.pages.length > 50) throw new Error('Too many quotes or pages.');
  for (const rows of [value.quotes, value.pages]) {
    if (new Set(rows.map(x => x.id)).size !== rows.length || rows.some(x => !/^[a-zA-Z0-9_-]{1,128}$/.test(x.id))) throw new Error('Invalid or duplicate item identity.');
  }
  for (const q of value.quotes) if (typeof q.en !== 'string' || typeof q.hi !== 'string' || q.en.length > 2000 || q.hi.length > 2000) throw new Error('Invalid quote.');
  for (const p of value.pages) {
    validateMenuAppearance(p);
    if (typeof p.title !== 'string' || !p.title.trim() || p.title.length > 160 || typeof p.hindiTitle !== 'string' || p.hindiTitle.length > 160 || typeof p.body !== 'string' || p.body.length > 20000 || typeof p.hindiBody !== 'string' || p.hindiBody.length > 20000 || (p.deleted !== undefined && typeof p.deleted !== 'boolean')) throw new Error('Invalid page.');
  }
  if (!value.navigation.some(x => !x.deleted) && !value.pages.some(x => !x.deleted)) throw new Error('Keep at least one visible page or menu item.');
  if (!value.copy || typeof value.copy !== 'object' || Array.isArray(value.copy) || Object.keys(value.copy).length > 1200) throw new Error('Invalid website text.');
  for (const [key, item] of Object.entries(value.copy)) if (key.length > 5000 || !item || typeof item.replacement !== 'string' || item.replacement.length > 5000 || (item.deleted !== undefined && typeof item.deleted !== 'boolean')) throw new Error('Invalid text replacement.');
  if (new TextEncoder().encode(JSON.stringify(value)).length > 700000) throw new Error('Website settings are too large.');
  return value;
}

export function resolveCopy(config: WebsiteConfig, original: string): string {
  const value = Object.hasOwn(config.copy, original) ? config.copy[original] : undefined;
  if (value) return value.deleted ? '' : value.replacement;
  return config.name === DEFAULT_WEBSITE_CONFIG.name ? original : original.replace(/Sankatmochansaarthi|Sankatmochan Saarthi|Saarthi by Sankatmochan/g, () => config.name);
}
export function optionLabel(options: WebsiteOption[], id: string, language = 'en'): string {
  const item = options.find(x => x.id === id);
  return item ? (language === 'hi' ? item.hindiLabel || item.label : item.label) : id;
}
export const activeOptions = (options: WebsiteOption[]) => options.filter(x => !x.deleted);
export function managedNavigation(options: WebsiteOption[]): WebsiteOption[] {
  return [...(options.some(x => x.id === 'materials') ? [] : DEFAULT_WEBSITE_CONFIG.navigation.filter(x => x.id === 'materials')), ...options, ...(options.some(x => x.id === 'admin') ? [] : DEFAULT_WEBSITE_CONFIG.navigation.filter(x => x.id === 'admin'))];
}
export const supportedTeacherClass = (grade: ClassGrade) => ['Class 9', 'Class 10', 'Class 11', 'Class 12'].includes(grade);
export type CurriculumIdentity = BoardType | ClassGrade | StreamType;
