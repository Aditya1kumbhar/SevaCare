'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Play, Pause, SkipForward, RotateCcw, CheckCircle2, Clock, AlertTriangle, Heart, ChevronLeft, Trophy } from 'lucide-react'
import { useLanguage } from '@/components/LanguageProvider'
import { Translate } from '@/components/Translate'

const getExercises = (t: any) => [
  {
    id: 'neck-rotation',
    name: t.neckRotation,
    duration: 60,
    type: t.warmUp,
    emoji: '🧘',
    color: 'bg-blue-500',
    steps: [
      t.neckRotationS1,
      t.neckRotationS2,
      t.neckRotationS3,
      t.neckRotationS4,
    ],
    caution: t.neckRotationCaution,
  },
  {
    id: 'shoulder-rolls',
    name: t.shoulderRolls,
    duration: 45,
    type: t.warmUp,
    emoji: '💪',
    color: 'bg-emerald-500',
    steps: [
      t.shoulderRollsS1,
      t.shoulderRollsS2,
      t.shoulderRollsS3,
      t.shoulderRollsS4,
    ],
    caution: t.shoulderRollsCaution,
  },
  {
    id: 'deep-breathing',
    name: t.deepBreathing,
    duration: 120,
    type: t.yoga,
    emoji: '🌬️',
    color: 'bg-purple-500',
    steps: [
      t.deepBreathingS1,
      t.deepBreathingS2,
      t.deepBreathingS3,
      t.deepBreathingS4,
      t.deepBreathingS5,
    ],
    caution: t.deepBreathingCaution,
  },
  {
    id: 'seated-forward-bend',
    name: t.seatedForwardBend,
    duration: 60,
    type: t.stretch,
    emoji: '🪑',
    color: 'bg-amber-500',
    steps: [
      t.seatedForwardBendS1,
      t.seatedForwardBendS2,
      t.seatedForwardBendS3,
      t.seatedForwardBendS4,
      t.seatedForwardBendS5,
    ],
    caution: t.seatedForwardBendCaution,
  },
  {
    id: 'ankle-rotations',
    name: t.ankleRotations,
    duration: 60,
    type: t.mobility,
    emoji: '🦶',
    color: 'bg-rose-500',
    steps: [
      t.ankleRotationsS1,
      t.ankleRotationsS2,
      t.ankleRotationsS3,
      t.ankleRotationsS4,
    ],
    caution: t.ankleRotationsCaution,
  },
  {
    id: 'gentle-arm-raises',
    name: t.gentleArmRaises,
    duration: 60,
    type: t.strength,
    emoji: '🙌',
    color: 'bg-teal-500',
    steps: [
      t.gentleArmRaisesS1,
      t.gentleArmRaisesS2,
      t.gentleArmRaisesS3,
      t.gentleArmRaisesS4,
      t.gentleArmRaisesS5,
      t.gentleArmRaisesS6,
    ],
    caution: t.gentleArmRaisesCaution,
  },
  {
    id: 'seated-twist',
    name: t.seatedSpinalTwist,
    duration: 60,
    type: t.yoga,
    emoji: '🔄',
    color: 'bg-indigo-500',
    steps: [
      t.seatedTwistS1,
      t.seatedTwistS2,
      t.seatedTwistS3,
      t.seatedTwistS4,
      t.seatedTwistS5,
      t.seatedTwistS6,
    ],
    caution: t.seatedTwistCaution,
  },
  {
    id: 'finger-stretches',
    name: t.fingerWristStretches,
    duration: 45,
    type: t.mobility,
    emoji: '✋',
    color: 'bg-sky-500',
    steps: [
      t.fingerStretchesS1,
      t.fingerStretchesS2,
      t.fingerStretchesS3,
      t.fingerStretchesS4,
      t.fingerStretchesS5,
    ],
    caution: t.fingerStretchesCaution,
  },
]

function formatTimer(s: number) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`
}

export default function PlayModePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const residentId = searchParams.get('residentId')
  const supabase = createClient()
  const { t } = useLanguage()

  const EXERCISES = getExercises(t)
  
  const [currentIdx, setCurrentIdx] = useState(0)
  const [timeLeft, setTimeLeft] = useState(EXERCISES[0]?.duration || 60)
  const [isRunning, setIsRunning] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [hasLogged, setHasLogged] = useState(false)
  const [activeStep, setActiveStep] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const currentExercise = EXERCISES[currentIdx]
  const progress = ((currentExercise.duration - timeLeft) / currentExercise.duration) * 100

  // Advance the highlighted step as the timer progresses
  useEffect(() => {
    if (currentExercise) {
      const stepsCount = currentExercise.steps.length
      const elapsed = currentExercise.duration - timeLeft
      const stepDuration = currentExercise.duration / stepsCount
      const newStep = Math.min(Math.floor(elapsed / stepDuration), stepsCount - 1)
      setActiveStep(newStep)
    }
  }, [timeLeft, currentExercise])

  // Timer logic
  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!)
            // Auto-advance to next exercise
            if (currentIdx < EXERCISES.length - 1) {
              const nextIdx = currentIdx + 1
              setCurrentIdx(nextIdx)
              setActiveStep(0)
              return EXERCISES[nextIdx].duration
            } else {
              setIsRunning(false)
              setIsComplete(true)
              return 0
            }
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current) }
  }, [isRunning, currentIdx])

  const togglePlay = useCallback(() => setIsRunning(prev => !prev), [])

  const skipExercise = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    if (currentIdx < EXERCISES.length - 1) {
      const nextIdx = currentIdx + 1
      setCurrentIdx(nextIdx)
      setTimeLeft(EXERCISES[nextIdx].duration)
      setActiveStep(0)
    } else {
      setIsRunning(false)
      setIsComplete(true)
    }
  }, [currentIdx])

  const resetWorkout = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current)
    setCurrentIdx(0)
    setTimeLeft(EXERCISES[0].duration)
    setIsRunning(false)
    setIsComplete(false)
    setHasLogged(false)
    setActiveStep(0)
  }, [])

  // Log gamification points when workout completes
  useEffect(() => {
    async function logWorkout() {
      if (isComplete && !hasLogged && residentId) {
        setHasLogged(true)
        const totalDuration = EXERCISES.reduce((a, e) => a + e.duration, 0)
        const points = Math.ceil(totalDuration / 60) * 10 // 10 points per minute of activity
        
        // 1. Log to activities table
        await supabase.from('activities').insert({
          resident_id: residentId,
          activity_type: 'exercise',
          activity_name: 'Daily Wellness Routine',
          duration_minutes: Math.ceil(totalDuration / 60),
          points_earned: points,
        })

        // 2. Fetch and update resident gamification stats
        const { data: resident } = await supabase.from('residents').select('gamification_score, activity_streak, last_activity_date').eq('id', residentId).single()
        if (resident) {
          const today = new Date().toISOString().split('T')[0]
          let newStreak = resident.activity_streak || 0
          
          if (resident.last_activity_date !== today) {
             newStreak += 1
          }

          await supabase.from('residents').update({
             gamification_score: (resident.gamification_score || 0) + points,
             activity_streak: newStreak,
             last_activity_date: today
          }).eq('id', residentId)
        }
      }
    }
    logWorkout()
  }, [isComplete, hasLogged, residentId, supabase])

  // Completion Screen
  if (isComplete) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center px-6">
        <div className="bg-emerald-100 w-24 h-24 rounded-full flex items-center justify-center mb-6 animate-bounce">
          <Trophy className="w-12 h-12 text-emerald-600" />
        </div>
        <h2 className="text-3xl font-black text-slate-900 tracking-tight"><Translate id="wellDone" fallback="Well Done!" /></h2>
        <p className="text-slate-500 mt-2 max-w-xs">{t.wellnessRoutineCompleted}</p>
        
        <div className="flex flex-col gap-3 mt-8 w-full max-w-xs">
          <button
            onClick={resetWorkout}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-5 h-5" /> <Translate id="restartWorkout" fallback="Restart Workout" />
          </button>
          <button
            onClick={() => router.push('/dashboard/activity')}
            className="w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-2xl transition-all flex items-center justify-center gap-2"
          >
            <ChevronLeft className="w-5 h-5" /> <Translate id="backToExercises" fallback="Back to Exercises" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-[85vh] max-w-lg mx-auto pb-24 md:pb-6 relative">
      {/* Top Progress Bar */}
      <div className="flex gap-1 px-4 py-3">
        {EXERCISES.map((_, idx) => (
          <div key={idx} className="flex-1 h-1.5 rounded-full bg-slate-200 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                idx < currentIdx ? 'bg-emerald-500 w-full' :
                idx === currentIdx ? 'bg-blue-500' :
                'w-0'
              }`}
              style={idx === currentIdx ? { width: `${progress}%` } : idx < currentIdx ? { width: '100%' } : { width: '0%' }}
            />
          </div>
        ))}
      </div>

      {/* Exercise Counter */}
      <div className="flex items-center justify-between px-4 py-2">
        <button onClick={() => router.push('/dashboard/activity')} className="text-slate-400 hover:text-slate-600 transition-colors">
          <ChevronLeft className="w-6 h-6" />
        </button>
        <span className="text-xs font-bold text-slate-500 tracking-widest uppercase">
          {currentIdx + 1} / {EXERCISES.length}
        </span>
        <button onClick={skipExercise} className="text-xs font-bold text-blue-600 hover:text-blue-800 transition-colors flex items-center gap-1">
          <Translate id="skip" fallback="Skip" /> <SkipForward className="w-4 h-4" />
        </button>
      </div>

      {/* Main Exercise Display */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center space-y-6">
        
        {/* Big Emoji Icon */}
        <div className={`w-28 h-28 rounded-3xl ${currentExercise.color} flex items-center justify-center text-6xl shadow-lg ${isRunning ? 'animate-pulse' : ''}`}>
          {currentExercise.emoji}
        </div>

        {/* Exercise Name */}
        <div>
          <span className="text-[10px] font-bold tracking-widest uppercase text-slate-400">{currentExercise.type}</span>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-1">{currentExercise.name}</h2>
        </div>

        {/* Timer Circle */}
        <div className="relative w-40 h-40 flex items-center justify-center">
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" fill="none" className="stroke-slate-200" strokeWidth="8" />
            <circle
              cx="60" cy="60" r="54" fill="none"
              stroke={isRunning ? '#3b82f6' : '#94a3b8'}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 54}
              strokeDashoffset={2 * Math.PI * 54 * (1 - progress / 100)}
              className="transition-all duration-1000"
            />
          </svg>
          <div className="text-center z-10">
            <p className="text-4xl font-black text-slate-900 tracking-tight font-mono">{formatTimer(timeLeft)}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">
              {isRunning ? t.inProgress : t.paused}
            </p>
          </div>
        </div>

        {/* Step-by-Step Guidance — Highlighted Active Step */}
        <div className="w-full text-left space-y-2 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm" style={{}}>
          <p className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mb-2"><Translate id="followAlong" fallback="Follow Along" /></p>
          {currentExercise.steps.map((step: any, sIdx: any) => (
            <div
              key={sIdx}
              className={`flex items-start gap-2.5 p-2 rounded-xl transition-all duration-500 ${
                sIdx === activeStep
                  ? 'bg-blue-50 border border-blue-200 scale-[1.02]'
                  : sIdx < activeStep
                    ? 'opacity-40'
                    : 'opacity-60'
              }`}
            >
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 ${
                sIdx === activeStep ? 'bg-blue-600 text-white' : sIdx < activeStep ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'
              }`}>
                {sIdx < activeStep ? <CheckCircle2 className="w-3.5 h-3.5" /> : sIdx + 1}
              </span>
              <p className={`text-sm leading-relaxed ${sIdx === activeStep ? 'text-slate-900 font-semibold' : 'text-slate-600'}`}>{step}</p>
            </div>
          ))}
        </div>

        {/* Caution Banner */}
        <div className="w-full bg-rose-50 border border-rose-200 rounded-xl px-4 py-3 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
          <p className="text-xs text-rose-700 font-medium leading-relaxed">{currentExercise.caution}</p>
        </div>
      </div>

      {/* Bottom Controls — Sticky */}
      <div className="sticky bottom-20 md:bottom-4 z-40 px-6 pt-4">
        <div className="flex items-center gap-3">
          {/* Reset */}
          <button
            onClick={resetWorkout}
            className="w-14 h-14 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-all"
            title="Reset"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          {/* Play / Pause */}
          <button
            onClick={togglePlay}
            className={`flex-1 h-14 rounded-2xl font-bold text-lg tracking-tight flex items-center justify-center gap-2 shadow-lg transition-all ${
              isRunning
                ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/30'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/30'
            }`}
          >
            {isRunning ? <><Pause className="w-6 h-6 fill-white" /> {t.pauseUpper}</> : <><Play className="w-6 h-6 fill-white" /> {t.startUpper}</>}
          </button>

          {/* Skip */}
          <button
            onClick={skipExercise}
            className="w-14 h-14 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-all"
            title="Skip"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
