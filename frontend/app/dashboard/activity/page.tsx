'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Play, Clock, Heart, AlertTriangle, ShieldCheck, Flame, UserCircle } from 'lucide-react'
import { useLanguage } from '@/components/LanguageProvider'
import { Translate } from '@/components/Translate'

const getExercises = (t: any) => [
  {
    id: 'neck-rotation',
    name: t.neckRotation,
    duration: 60,
    type: t.warmUp,
    emoji: '🧘',
    color: 'bg-blue-50 text-blue-600 border-blue-100',
    steps: [
      'Sit upright in a sturdy chair with feet flat on the ground.',
      'Slowly tilt your head to the right, bringing your ear toward your shoulder.',
      'Hold for 5 seconds, then return to center.',
      'Repeat on the left side. Do 5 rotations each side.',
    ],
    caution: 'Avoid if you have cervical spondylosis or neck injury.',
    benefit: 'Relieves neck stiffness and improves range of motion.',
  },
  {
    id: 'shoulder-rolls',
    name: t.shoulderRolls,
    duration: 45,
    type: t.warmUp,
    emoji: '💪',
    color: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    steps: [
      'Sit or stand comfortably with arms relaxed at your sides.',
      'Slowly roll both shoulders forward in a circular motion.',
      'Complete 10 forward rolls.',
      'Reverse direction and complete 10 backward rolls.',
    ],
    caution: 'Go gently if you have shoulder arthritis or a rotator cuff issue.',
    benefit: 'Loosens tight shoulder muscles and improves upper body circulation.',
  },
  {
    id: 'deep-breathing',
    name: t.deepBreathing,
    duration: 120,
    type: t.yoga,
    emoji: '🌬️',
    color: 'bg-purple-50 text-purple-600 border-purple-100',
    steps: [
      'Sit comfortably with your back straight and hands on your knees.',
      'Close your eyes and inhale slowly through your nose for 4 seconds.',
      'Hold your breath gently for 4 seconds.',
      'Exhale slowly through your mouth for 6 seconds.',
      'Repeat this cycle 10 times.',
    ],
    caution: 'Do not hold breath if you have respiratory conditions like COPD or asthma. Simply breathe in and out gently.',
    benefit: 'Reduces anxiety, lowers blood pressure, and calms the nervous system.',
  },
  {
    id: 'seated-forward-bend',
    name: t.seatedForwardBend,
    duration: 60,
    type: t.stretch,
    emoji: '🪑',
    color: 'bg-amber-50 text-amber-600 border-amber-100',
    steps: [
      'Sit on the edge of a sturdy chair, feet flat on the floor, hip-width apart.',
      'Inhale and sit tall, lengthening your spine.',
      'Exhale and slowly hinge forward from your hips, reaching toward your shins or the floor.',
      'Hold for 15-20 seconds, breathing normally.',
      'Slowly rise back up. Repeat 3 times.',
    ],
    caution: 'Avoid if you have a herniated disc or severe lower back pain. Keep the bend gentle.',
    benefit: 'Stretches the hamstrings and lower back, improving flexibility.',
  },
  {
    id: 'ankle-rotations',
    name: t.ankleRotations,
    duration: 60,
    type: t.mobility,
    emoji: '🦶',
    color: 'bg-rose-50 text-rose-600 border-rose-100',
    steps: [
      'Sit comfortably in a chair and lift your right foot slightly off the ground.',
      'Slowly rotate your ankle clockwise, making 10 full circles.',
      'Reverse direction and make 10 counter-clockwise circles.',
      'Switch to the left foot and repeat.',
    ],
    caution: 'Avoid vigorous rotation if you have a recent ankle sprain or fracture.',
    benefit: 'Improves blood circulation to the feet and reduces swelling.',
  },
  {
    id: 'gentle-arm-raises',
    name: t.gentleArmRaises,
    duration: 60,
    type: t.strength,
    emoji: '🙌',
    color: 'bg-teal-50 text-teal-600 border-teal-100',
    steps: [
      'Sit or stand with arms at your sides.',
      'Slowly raise both arms straight out in front of you to shoulder height.',
      'Hold for 3 seconds.',
      'Slowly lower arms back down.',
      'Now raise arms out to the sides to shoulder height. Hold and lower.',
      'Repeat the full cycle 8 times.',
    ],
    caution: 'Avoid raising arms above shoulder height if you have shoulder impingement or pain.',
    benefit: 'Strengthens shoulder muscles and improves arm mobility.',
  },
  {
    id: 'seated-twist',
    name: t.seatedSpinalTwist,
    duration: 60,
    type: t.yoga,
    emoji: '🔄',
    color: 'bg-indigo-50 text-indigo-600 border-indigo-100',
    steps: [
      'Sit tall in a chair with feet flat on the floor.',
      'Place your right hand on your left knee.',
      'Gently twist your torso to the left, looking over your left shoulder.',
      'Hold for 15 seconds while breathing deeply.',
      'Return to center and repeat on the other side.',
      'Do 3 twists on each side.',
    ],
    caution: 'Avoid if you have spinal injuries, severe osteoporosis, or recent abdominal surgery.',
    benefit: 'Massages internal organs, relieves lower back tension, and aids digestion.',
  },
  {
    id: 'finger-stretches',
    name: t.fingerWristStretches,
    duration: 45,
    type: t.mobility,
    emoji: '✋',
    color: 'bg-sky-50 text-sky-600 border-sky-100',
    steps: [
      'Extend both arms in front of you.',
      'Spread your fingers wide apart, hold for 5 seconds.',
      'Make a tight fist, hold for 5 seconds.',
      'Repeat spreading and fisting 10 times.',
      'Then rotate each wrist clockwise 10 times, then counter-clockwise.',
    ],
    caution: 'Be gentle if you have arthritis in the hands or carpal tunnel syndrome.',
    benefit: 'Reduces hand stiffness and improves grip strength — important for daily tasks.',
  },
]

function formatTime(s: number) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return m > 0 ? `${m}:${sec.toString().padStart(2, '0')}` : `00:${sec.toString().padStart(2, '0')}`
}

export default function ActivityPage() {
  const [residents, setResidents] = useState<any[]>([])
  const [selectedResidentId, setSelectedResidentId] = useState<string>('')
  const supabase = createClient()
  const { t } = useLanguage()

  const EXERCISES = getExercises(t)
  const totalDuration = EXERCISES.reduce((a, e) => a + e.duration, 0)

  useEffect(() => {
    async function fetchResidents() {
      const { data } = await supabase.from('residents').select('id, name, room_number').order('name')
      if (data) setResidents(data)
    }
    fetchResidents()
  }, [])

  return (
    <div className="space-y-0 max-w-2xl mx-auto pb-56 bg-slate-50 min-h-screen">
      
      {/* Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden shadow-lg mb-6">
        <Image
          src="/exercises/hero.png"
          alt="Daily Wellness Challenge"
          width={800}
          height={400}
          className="w-full h-[200px] sm:h-[260px] object-cover"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <p className="text-emerald-400 text-xs font-bold tracking-widest uppercase"><Translate id="dailyWellness" fallback="Daily Wellness" /></p>
          <h2 className="text-white text-2xl sm:text-3xl font-black tracking-tight mt-1"><Translate id="gentleCareRoutine" fallback="Gentle Care Routine" /></h2>
          <div className="flex items-center gap-4 mt-3">
            <span className="text-white/80 text-xs font-semibold flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" /> {Math.ceil(totalDuration / 60)} {t.minutes}
            </span>
            <span className="text-white/80 text-xs font-semibold flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5" /> {EXERCISES.length} {t.exercisesCount}
            </span>
            <span className="text-white/80 text-xs font-semibold flex items-center gap-1.5">
              <Heart className="w-3.5 h-3.5" /> <Translate id="lowImpact" fallback="Low Impact" />
            </span>
          </div>
        </div>
      </div>

      {/* Safety & Health Notice */}
      <div className="mx-1 mb-6 bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
        <div className="bg-amber-100 rounded-full p-2 mt-0.5 shrink-0">
          <ShieldCheck className="w-4 h-4 text-amber-700" />
        </div>
        <div>
          <p className="text-sm font-bold text-amber-800"><Translate id="healthSafetyNotice" fallback="Health & Safety Notice" /></p>
          <p className="text-xs text-amber-700 mt-1 leading-relaxed">
            {t.healthSafetyDesc}
          </p>
        </div>
      </div>

      {/* Exercise List */}
      <div className="space-y-3 px-1">
        {EXERCISES.map((ex, idx) => (
          <div key={ex.id} className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden">
            {/* Main Row */}
            <div className="flex items-center gap-4 p-4">
              {/* Index Circle */}
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-sm font-bold text-slate-500 shrink-0">
                {idx + 1}
              </div>
              {/* Emoji Thumbnail */}
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl border ${ex.color} shrink-0`}>
                {ex.emoji}
              </div>
              {/* Details */}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-slate-900 truncate">{ex.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${ex.color}`}>{ex.type}</span>
                  <span className="text-xs text-slate-500 font-medium flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {formatTime(ex.duration)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Sticky Start Button with Resident Selector */}
      <div className="fixed bottom-20 md:bottom-8 left-0 right-0 z-40 px-4 pt-2 pointer-events-none max-w-2xl mx-auto">
        <div className="bg-white/95 backdrop-blur-md p-5 rounded-3xl shadow-2xl shadow-blue-900/20 border border-slate-200 pointer-events-auto">
          
          <div className="mb-4">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2 mb-2">
              <UserCircle className="w-4 h-4" /> <Translate id="whoIsExercising" fallback="Who is exercising?" />
            </label>
            <select
              value={selectedResidentId}
              onChange={(e) => setSelectedResidentId(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:outline-none focus:border-blue-500 transition-all appearance-none"
            >
              <option value="">{t.selectResidentOptional}</option>
              {residents.map(r => (
                <option key={r.id} value={r.id}>{r.name} {r.room_number ? `(${t.rm} ${r.room_number})` : ''}</option>
              ))}
            </select>
          </div>

          <Link
            href={selectedResidentId ? `/dashboard/activity/play?residentId=${selectedResidentId}` : `/dashboard/activity/play`}
            className="flex items-center justify-center gap-3 w-full py-4 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-lg font-bold tracking-tight rounded-2xl shadow-md shadow-blue-600/30 transition-all hover:scale-[1.02]"
          >
            <Play className="w-6 h-6 fill-white" /> <Translate id="startWorkout" fallback="START WORKOUT" />
          </Link>
        </div>
      </div>
    </div>
  )
}
