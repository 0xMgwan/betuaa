import { useLanguage } from '@/contexts/LanguageContext';
import en from '@/locales/en.json';
import sw from '@/locales/sw.json';

const translations = {
  en,
  sw,
};

export function useTranslation() {
  const { language } = useLanguage();

  const t = (key: string, params?: Record<string, string>): string => {
    const keys = key.split('.');
    let value: any = translations[language];

    for (const k of keys) {
      value = value?.[k];
    }

    if (typeof value !== 'string') {
      console.warn(`Translation key not found: ${key}`);
      return key;
    }

    // Replace parameters like {token} with actual values
    if (params) {
      return Object.entries(params).reduce(
        (str, [paramKey, paramValue]) => str.replace(`{${paramKey}}`, paramValue),
        value
      );
    }

    return value;
  };

  return { t, language };
}
