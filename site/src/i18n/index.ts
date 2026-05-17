import { zh, type Dict } from './zh';
import { en } from './en';

export const LANGS = { zh, en } as const;
export type Lang = keyof typeof LANGS;

export const useTranslations = (lang: Lang | undefined): Dict =>
  (lang && LANGS[lang]) || LANGS.zh;

export const otherLang = (lang: Lang): Lang => (lang === 'zh' ? 'en' : 'zh');

export const localizedPath = (base: string, lang: Lang, path = ''): string => {
  const prefix = base.endsWith('/') ? base.slice(0, -1) : base;
  const segment = lang === 'zh' ? '' : '/en';
  const tail = path ? (path.startsWith('/') ? path : `/${path}`) : '';
  return `${prefix}${segment}${tail || '/'}`;
};

export type { Dict };
