import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import arTranslation from './locales/ar/common.json';
import enTranslation from './locales/en/common.json';

// Resources object containing translations for each language
const resources = {
  ar: {
    translation: arTranslation
  },
  en: {
    translation: enTranslation
  }
};

// Initialize i18n
i18n
  .use(initReactI18next) // Passes i18n down to react-i18next
  .init({
    resources,
    lng: 'ar', // Default language
    fallbackLng: 'ar', // Fallback language
    interpolation: {
      escapeValue: false // React already safes from XSS
    },
    react: {
      useSuspense: false // Disable suspense to prevent loading issues
    }
  });

export default i18n;