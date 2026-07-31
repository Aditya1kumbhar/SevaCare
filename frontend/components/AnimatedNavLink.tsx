'use client'

import React, { useRef } from 'react'
import Link from 'next/link'
import anime from 'animejs'

interface AnimatedNavLinkProps {
  href: string
  children: React.ReactNode
  className?: string
  isMobile?: boolean
}

export default function AnimatedNavLink({
  href,
  children,
  className = '',
  isMobile = false,
}: AnimatedNavLinkProps) {
  const linkRef = useRef<HTMLAnchorElement>(null)

  const handleMouseEnter = () => {
    if (!linkRef.current || isMobile) return
    anime.remove(linkRef.current)
    anime({
      targets: linkRef.current,
      scale: 1.03,
      translateX: 4,
      duration: 350,
      easing: 'spring(1, 90, 14, 0)',
    })
  }

  const handleMouseLeave = () => {
    if (!linkRef.current || isMobile) return
    anime.remove(linkRef.current)
    anime({
      targets: linkRef.current,
      scale: 1,
      translateX: 0,
      duration: 300,
      easing: 'easeOutQuad',
    })
  }

  const handleClick = () => {
    if (!linkRef.current) return
    anime({
      targets: linkRef.current,
      scale: [0.94, 1.02, 1],
      duration: 300,
      easing: 'spring(1, 80, 12, 0)',
    })
  }

  return (
    <Link
      ref={linkRef}
      href={href}
      prefetch={true}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      className={className}
    >
      {children}
    </Link>
  )
}
