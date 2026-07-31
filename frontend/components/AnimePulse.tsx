'use client'

import React, { useEffect, useRef } from 'react'
import anime from 'animejs'

interface AnimePulseProps {
  children?: React.ReactNode
  className?: string
  scaleMin?: number
  scaleMax?: number
  duration?: number
  opacityMin?: number
  opacityMax?: number
}

export default function AnimePulse({
  children,
  className = '',
  scaleMin = 0.97,
  scaleMax = 1.03,
  duration = 1400,
  opacityMin = 0.6,
  opacityMax = 1,
}: AnimePulseProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return

    const anim = anime({
      targets: ref.current,
      scale: [scaleMin, scaleMax],
      opacity: [opacityMin, opacityMax],
      duration: duration,
      direction: 'alternate',
      loop: true,
      easing: 'easeInOutSine',
    })

    return () => {
      anim.pause()
    }
  }, [scaleMin, scaleMax, duration, opacityMin, opacityMax])

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
