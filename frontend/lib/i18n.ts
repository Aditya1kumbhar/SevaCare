'use client'

import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { translations } from './translations'

// Initialize i18next engine with Marathi (mr), Hindi (hi), and English (en)
if (!i18n.isInitialized) {
  i18n
    .use(initReactI18next)
    .init({
      resources: {
        en: { translation: translations.en },
        hi: { translation: translations.hi },
        mr: { translation: translations.mr },
      },
      lng: typeof window !== 'undefined' ? (localStorage.getItem('sevacare-lang') || 'mr') : 'mr', // Default to Marathi
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false, // React already safes from xss
      },
    })
}

export default i18n
