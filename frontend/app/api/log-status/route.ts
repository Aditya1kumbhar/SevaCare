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
    const { resident_id, status, mood, meal_taken, medication_taken, notes } = body

    if (!resident_id || !status) {
      return NextResponse.json({ error: 'resident_id and status are required' }, { status: 400 })
    }

    // Get resident info for WhatsApp message
    const { data: resident, error: residentError } = await supabase
      .from('residents')
      .select('name, family_phone_number, family_contact_name')
      .eq('id', resident_id)
      .single()

    if (residentError || !resident) {
      return NextResponse.json({ error: 'Resident not found' }, { status: 404 })
    }

    // Insert log
    const { error: insertError } = await supabase
      .from('daily_logs')
      .insert({
        resident_id,
        caretaker_id: user.id,
        status,
        mood,
        meal_taken,
        medication_taken,
        notes,
      })

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
    })
  } catch (error: any) {
    console.error('Log status error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
