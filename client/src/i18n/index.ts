import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

export const SUPPORTED_LANGUAGES = ['vi', 'ja', 'en'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const LANGUAGE_LABELS: Record<SupportedLanguage, string> = {
  vi: 'Tiếng Việt',
  ja: '日本語',
  en: 'English',
};

// Auto-load every locale file under ./locales/<lang>/<namespace>.json.
// Each feature owns its own namespace files, so adding translations is just
// dropping a JSON file — no central registry to edit.
const modules = import.meta.glob('./locales/*/*.json', { eager: true });

const resources: Record<string, Record<string, unknown>> = {};
for (const path in modules) {
  const match = path.match(/\.\/locales\/([^/]+)\/([^/]+)\.json$/);
  if (!match) continue;
  const [, lng, ns] = match;
  const mod = modules[path] as { default: unknown };
  (resources[lng] ??= {})[ns] = mod.default;
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: resources as never,
    fallbackLng: 'ja',
    supportedLngs: SUPPORTED_LANGUAGES as unknown as string[],
    defaultNS: 'common',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage'],
      lookupLocalStorage: 'Task88-lang',
      caches: ['localStorage'],
    },
  });

export default i18n;
