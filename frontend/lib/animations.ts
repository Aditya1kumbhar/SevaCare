'use client'

import anime from 'animejs'

/**
 * Standard smooth entrance animation for single elements (cards, headers, panels)
 */
export const animateEntrance = (
  target: HTMLElement | string,
  options?: { delay?: number; duration?: number; translateY?: number; scale?: number }
) => {
  if (typeof window === 'undefined') return null

  return anime({
    targets: target,
    opacity: [0, 1],
    translateY: [options?.translateY ?? 24, 0],
    scale: [options?.scale ?? 0.96, 1],
    duration: options?.duration ?? 600,
    delay: options?.delay ?? 0,
    easing: 'cubicBezier(0.16, 1, 0.3, 1)', // Buttery smooth custom bezier
  })
}

/**
 * Staggered entrance for grids, lists, tables, nav items
 */
export const animateStagger = (
  targets: HTMLElement[] | NodeListOf<Element> | string,
  options?: { delay?: number; duration?: number; translateY?: number; staggerMs?: number }
) => {
  if (typeof window === 'undefined') return null

  return anime({
    targets: targets,
    opacity: [0, 1],
    translateY: [options?.translateY ?? 20, 0],
    scale: [0.97, 1],
    delay: anime.stagger(options?.staggerMs ?? 60, { start: options?.delay ?? 50 }),
    duration: options?.duration ?? 500,
    easing: 'cubicBezier(0.16, 1, 0.3, 1)',
  })
}

/**
 * Elastic micro-interaction for hover/press states
 */
export const animateHoverElastic = (
  target: HTMLElement | string,
  isHovered: boolean,
  scaleUp = 1.05
) => {
  if (typeof window === 'undefined') return null

  return anime({
    targets: target,
    scale: isHovered ? scaleUp : 1,
    duration: 400,
    easing: isHovered ? 'spring(1, 90, 14, 0)' : 'easeOutQuad',
  })
}

/**
 * Breathing continuous pulse loop (great for Voice Assistant, Live Indicators, active audio)
 */
export const animatePulseLoop = (
  target: HTMLElement | string,
  options?: { scaleMax?: number; duration?: number }
) => {
  if (typeof window === 'undefined') return null

  return anime({
    targets: target,
    scale: [1, options?.scaleMax ?? 1.12, 1],
    opacity: [0.85, 1, 0.85],
    duration: options?.duration ?? 1800,
    loop: true,
    easing: 'easeInOutSine',
  })
}

/**
 * Counter interpolation for stats and numbers
 */
export const animateCounter = (
  target: HTMLElement | string | { value: number },
  startVal: number,
  endVal: number,
  onUpdate: (val: number) => void,
  duration = 1000
) => {
  if (typeof window === 'undefined') return null

  const obj = { val: startVal }
  return anime({
    targets: obj,
    val: endVal,
    round: 1,
    duration: duration,
    easing: 'easeOutExpo',
    update: () => {
      onUpdate(obj.val)
    },
  })
}

/**
 * Ripple visualizer effect for voice input
 */
export const animateRipple = (
  targets: HTMLElement[] | NodeListOf<Element> | string
) => {
  if (typeof window === 'undefined') return null

  return anime({
    targets: targets,
    scale: [0.8, 1.4],
    opacity: [0.8, 0],
    delay: anime.stagger(250),
    duration: 1500,
    loop: true,
    easing: 'easeOutCubic',
  })
}
