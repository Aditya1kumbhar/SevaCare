'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function NavRemindersBadge() {
  const [hasAlerts, setHasAlerts] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    async function checkAlerts() {
      const { data } = await supabase.from('residents').select('medications')
      if (data) {
        const now = new Date()
        const currentHour = now.getHours()
        const currentMin = now.getMinutes()
        let alertFound = false
        
        for (const r of data) {
          if (r.medications && Array.isArray(r.medications)) {
            for (const med of r.medications) {
              if (med.time) {
                const [h, m] = med.time.split(':').map(Number)
                const isOverdue = (currentHour > h) || (currentHour === h && currentMin >= m)
                if (isOverdue || (h - currentHour <= 2 && h >= currentHour)) {
                  alertFound = true
                  break
                }
              }
            }
          }
          if (alertFound) break
        }
        setHasAlerts(alertFound)
      }
    }
    checkAlerts()
    const interval = setInterval(checkAlerts, 60000)
    return () => clearInterval(interval)
  }, [])

  if (!hasAlerts) return null

  return (
    <span className="absolute -top-1 -right-1 md:static md:ml-auto md:mt-0 w-3 h-3 bg-rose-600 rounded-full shadow-sm animate-pulse border-2 border-white"></span>
  )
}
