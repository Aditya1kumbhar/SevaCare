'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { translations, Language } from '@/lib/translations';
import i18n from '@/lib/i18n';

type TranslationsMap = typeof translations['en'];

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationsMap;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('mr'); // Default to Marathi
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Load saved lang from localStorage on initial client render
    const savedLang = localStorage.getItem('sevacare_language') as Language || localStorage.getItem('sevacare-lang') as Language;
    if (savedLang && ['en', 'hi', 'mr'].includes(savedLang)) {
      setLanguageState(savedLang);
      i18n.changeLanguage(savedLang);
    } else {
      setLanguageState('mr');
      i18n.changeLanguage('mr');
    }
    setMounted(true);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('sevacare_language', lang);
    localStorage.setItem('sevacare-lang', lang);
    i18n.changeLanguage(lang);
  };

  // Expose translations as an object so components can use t.key syntax
  const t = translations[language] || translations.mr;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
