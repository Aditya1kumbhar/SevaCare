import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // 1. Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 2. Validate request body
    const body = await request.json()
    const { resident_id, medication_name, dosage, scheduled_time, status = 'given', notes } = body

    if (!resident_id || !medication_name) {
      return NextResponse.json({ error: 'resident_id and medication_name are required' }, { status: 400 })
    }

    // 3. Insert medication administration record
    const { data, error: insertError } = await supabase
      .from('medication_administrations')
      .insert({
        resident_id,
        medication_name,
        dosage: dosage || null,
        scheduled_time: scheduled_time || null,
        administered_at: new Date().toISOString(),
        administered_by: user.id,
        status,
        notes: notes || 'Administered via Reminders Action Center'
      })
      .select()
      .single()

    if (insertError) {
      console.error('Medication administration insert error:', insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      data
    })
  } catch (error: any) {
    console.error('Record medication error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
