'use client';

import { useLanguage } from '@/components/LanguageProvider';
import { translations } from '@/lib/translations';

export function Translate({ id, fallback }: { id: keyof typeof translations['en']; fallback?: string }) {
  const { t } = useLanguage();
  return <>{t[id] || fallback || id}</>;
}
