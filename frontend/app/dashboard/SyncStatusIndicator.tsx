'use client'

import React, { useState, useEffect } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db, processSyncQueue } from '@/lib/offline-db'
import { CloudOff, RefreshCw, CheckCircle2, WifiOff } from 'lucide-react'
import { useLanguage } from '@/components/LanguageProvider'
import { toast } from 'sonner'

export default function SyncStatusIndicator() {
  const { t } = useLanguage()
  const [isOnline, setIsOnline] = useState(true)
  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    setIsOnline(navigator.onLine)
    const handleOnline = () => {
      setIsOnline(true)
      toast.success('🌐 Connection restored! Auto-syncing pending offline items...')
      handleSyncNow()
    }
    const handleOffline = () => {
      setIsOnline(false)
      toast.info('📱 Offline Mode Active (95%+ Ready). All changes saved locally.')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])
  
  const pendingCount = useLiveQuery(
    () => db.syncQueue.where('status').equals('pending').count(),
    []
  )

  const handleSyncNow = async () => {
    if (!navigator.onLine) {
      toast.error('Device is offline. Connect to internet to sync.')
      return
    }
    setIsSyncing(true)
    const synced = await processSyncQueue()
    setIsSyncing(false)
    if (synced > 0) {
      toast.success(`Successfully synced ${synced} offline items to cloud!`)
    }
  }

  if (pendingCount === undefined) return null

  if (!isOnline) {
    return (
      <div 
        title="App is running 95%+ offline mode. All edits are saved locally."
        className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 rounded-full text-[11px] font-bold border border-amber-200 dark:border-amber-800 shadow-xs"
      >
        <WifiOff className="w-3.5 h-3.5" />
        <span>Offline (95% Ready)</span>
        {pendingCount > 0 && <span className="bg-amber-600 text-white rounded-full px-1.5 py-0.2 text-[10px]">{pendingCount}</span>}
      </div>
    )
  }

  if (isSyncing) {
    return (
      <div className="flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-300 rounded-full text-[11px] font-bold animate-pulse border border-blue-200 dark:border-blue-800">
        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
        <span>Syncing Cloud...</span>
      </div>
    )
  }

  if (pendingCount > 0) {
    return (
      <button
        onClick={handleSyncNow}
        type="button"
        title="Click to sync pending items to cloud"
        className="flex items-center gap-1.5 px-3 py-1 bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 rounded-full text-[11px] font-bold border border-amber-300 dark:border-amber-700 hover:bg-amber-200 transition-all cursor-pointer shadow-xs active:scale-95"
      >
        <CloudOff className="w-3.5 h-3.5 text-amber-600" />
        <span>{pendingCount} Pending Sync</span>
        <RefreshCw className="w-3 h-3 ml-0.5 text-amber-700" />
      </button>
    )
  }

  return (
    <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 rounded-full text-[11px] font-bold border border-emerald-200 dark:border-emerald-800">
      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
      <span>Cloud Synced</span>
    </div>
  )
}
