'use client'

import { useEffect, useRef } from 'react'
import anime from 'animejs'

export default function DashboardTemplate({ children }: { children: React.ReactNode }) {
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Animate page entrance with buttery custom spring bezier
    anime({
      targets: containerRef.current,
      opacity: [0, 1],
      translateY: [16, 0],
      scale: [0.99, 1],
      duration: 450,
      easing: 'cubicBezier(0.16, 1, 0.3, 1)',
    })

    // Stagger all direct child cards or elements that match class .anime-stagger
    const staggerItems = containerRef.current.querySelectorAll('.anime-stagger, .grid > div, .space-y-4 > div')
    if (staggerItems.length > 0) {
      anime({
        targets: staggerItems,
        opacity: [0, 1],
        translateY: [20, 0],
        scale: [0.97, 1],
        delay: anime.stagger(50, { start: 100 }),
        duration: 400,
        easing: 'cubicBezier(0.16, 1, 0.3, 1)',
      })
    }
  }, [])

  return (
    <div ref={containerRef} style={{ overscrollBehavior: 'none', position: 'relative', width: '100%' }} className="w-full opacity-0">
      {children}
    </div>
  )
}
