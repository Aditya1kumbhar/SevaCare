'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { showLocalNotification, requestNotificationPermission } from '@/lib/push-notifications'

const SEVERITY_EMOJI: Record<string, string> = {
  low: '⚠️',
  medium: '🟠',
  high: '🔴',
  critical: '🚨',
}

const SEVERITY_COLORS: Record<string, string> = {
  low: '#eab308',
  medium: '#f97316',
  high: '#ef4444',
  critical: '#dc2626',
}

export default function EmergencyListener() {
  const supabase = createClient()
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const hasRequestedPermission = useRef(false)

  useEffect(() => {
    // Request notification permission on mount (once)
    if (!hasRequestedPermission.current) {
      hasRequestedPermission.current = true
      requestNotificationPermission()
    }

    // Subscribe to real-time INSERT events on emergency_alerts
    const channel = supabase
      .channel('emergency-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'emergency_alerts',
        },
        async (payload: any) => {
          const alert = payload.new

          // Fetch resident name
          let residentName = 'Unknown Resident'
          if (alert.resident_id) {
            const { data } = await supabase
              .from('residents')
              .select('name')
              .eq('id', alert.resident_id)
              .single()
            if (data) residentName = data.name
          }

          const emoji = SEVERITY_EMOJI[alert.severity] || '⚠️'
          const title = `${emoji} EMERGENCY: ${alert.alert_type?.toUpperCase()}`
          const body = `${residentName} — Severity: ${alert.severity?.toUpperCase()}${alert.description ? ` — ${alert.description}` : ''}`

          // 1. Play alarm sound
          playAlarm(alert.severity)

          // 2. Show in-app toast (persistent for high/critical)
          const isUrgent = alert.severity === 'high' || alert.severity === 'critical'
          toast.error(body, {
            duration: isUrgent ? 60000 : 10000,
            description: `${title} — Tap to view`,
            action: {
              label: 'View',
              onClick: () => {
                window.location.href = '/dashboard/emergency'
              },
            },
            style: {
              borderLeft: `4px solid ${SEVERITY_COLORS[alert.severity] || '#ef4444'}`,
            },
          })

          // 3. Show native browser notification (works even when tab is in background)
          showLocalNotification(title, body, `emergency-${alert.id}`)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  function playAlarm(severity: string) {
    try {
      // Use Web Audio API to generate alarm sound (no external file needed!)
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const isUrgent = severity === 'high' || severity === 'critical'

      const playBeep = (freq: number, startTime: number, duration: number) => {
        const oscillator = audioCtx.createOscillator()
        const gainNode = audioCtx.createGain()
        oscillator.connect(gainNode)
        gainNode.connect(audioCtx.destination)
        oscillator.frequency.value = freq
        oscillator.type = 'square'
        gainNode.gain.setValueAtTime(0.3, startTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration)
        oscillator.start(startTime)
        oscillator.stop(startTime + duration)
      }

      // Short urgent beeps
      const now = audioCtx.currentTime
      const beepCount = isUrgent ? 6 : 3
      for (let i = 0; i < beepCount; i++) {
        playBeep(isUrgent ? 880 : 660, now + i * 0.3, 0.15)
      }
    } catch (e) {
      console.warn('Audio alarm failed:', e)
    }
  }

  return null // This component renders nothing — it's a side-effect listener
}
