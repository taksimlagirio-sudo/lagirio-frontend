export interface SEOTranslation {
  title: string;
  description: string;
  keywords: string;
}

export interface SEOConfig {
  tr: SEOTranslation;
  en: SEOTranslation;
  ar: SEOTranslation;
  ru: SEOTranslation;
}

export type LanguageCode = 'tr' | 'en' | 'ar' | 'ru';