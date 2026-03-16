'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { translations, Language } from '@/lib/translations';

type TranslationsMap = typeof translations['en'];

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationsMap;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Load saved lang from localStorage on initial client render
    const savedLang = localStorage.getItem('sevacare_language') as Language;
    if (savedLang && ['en', 'hi', 'mr'].includes(savedLang)) {
      setLanguageState(savedLang);
    }
    setMounted(true);
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('sevacare_language', lang);
  };

  // Expose translations as an object so components can use t.key syntax
  const t = translations[language];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      <div style={{ visibility: mounted ? 'visible' : 'hidden', width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
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
