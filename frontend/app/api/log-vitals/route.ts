import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify auth
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { resident_id, blood_pressure, heart_rate, temperature, weight, blood_sugar, oxygen_level, notes } = body

    if (!resident_id) {
      return NextResponse.json({ error: 'resident_id is required' }, { status: 400 })
    }

    // Insert record
    const { error: insertError } = await supabase
      .from('health_records')
      .insert({
        resident_id,
        recorded_by: user.id,
        blood_pressure,
        heart_rate,
        temperature,
        weight,
        blood_sugar,
        oxygen_level,
        notes,
      })

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
    })
  } catch (error: any) {
    console.error('Log vitals error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
