import { hindiWebsiteCopy } from '../data/hindiWebsiteCopy';
import { DEFAULT_WEBSITE_CONFIG, resolveCopy, type WebsiteConfig } from './websiteConfig';

export function resolveLocalizedCopy(config: WebsiteConfig, original: string, language: 'en' | 'hi') {
  if (Object.hasOwn(config.copy, original) || language !== 'hi') return resolveCopy(config, original);
  const translated = resolveCopy(config, hindiWebsiteCopy[original] ?? original);
  return config.name === DEFAULT_WEBSITE_CONFIG.name ? translated : translated.replace(/संकटमोचन सारथी/g, () => config.name);
}
