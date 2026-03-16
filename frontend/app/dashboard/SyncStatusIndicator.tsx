'use client'

import React from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/lib/offline-db'
import { CloudOff, CloudSync, CheckCircle2 } from 'lucide-react'
import { useLanguage } from '@/components/LanguageProvider'

export default function SyncStatusIndicator() {
  const { t } = useLanguage()
  
  const pendingCount = useLiveQuery(
    () => db.syncQueue.where('status').equals('pending').count(),
    []
  )
  
  const syncingCount = useLiveQuery(
    () => db.syncQueue.where('status').equals('syncing').count(),
    []
  )

  if (pendingCount === undefined) return null

  if (syncingCount && syncingCount > 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold animate-pulse border border-blue-100 italic">
        <CloudSync className="w-3.5 h-3.5" />
        {t.syncing} {syncingCount}...
      </div>
    )
  }

  if (pendingCount > 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-xs font-bold border border-amber-100">
        <CloudOff className="w-3.5 h-3.5" />
        {pendingCount} {t.pendingSync}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold border border-emerald-100 opacity-60">
      <CheckCircle2 className="w-3.5 h-3.5" />
      {t.cloudSynced}
    </div>
  )
}
