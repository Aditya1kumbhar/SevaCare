import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://pdzwxijuktpmcvnodnzn.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBkend4aWp1a3RwbWN2bm9kbnpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ5ODU1ODcsImV4cCI6MjEwMDU2MTU4N30.o0xgeFSLXc74dAruCTR_I9dr8mBdQ_8sI21qX1yqMzY'
  )
}
