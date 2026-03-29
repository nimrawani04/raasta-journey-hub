'use client'

import { useRef } from 'react'
import { HeroScrollAnimation } from '@/components/HeroScrollAnimation'
import { HomeHeroMic } from '@/components/HomeHeroMic'

export function HomeHero() {
  const containerRef = useRef<HTMLDivElement>(null)

  return (
    <section ref={containerRef} className="relative w-full h-[250vh]">
      <div className="sticky top-0 left-0 w-full h-screen overflow-hidden flex flex-col items-center justify-center text-center">
        <HeroScrollAnimation scrollContainerRef={containerRef} />
        <div className="relative z-20 flex flex-col items-center pt-24">
          <span className="font-label text-[10px] uppercase tracking-[0.3em] text-[var(--color-secondary)] mb-4 drop-shadow-[0_1px_3px_rgba(255,255,255,0.6)]">
            The Digital Archivist
          </span>
          <h2
            className="font-headline text-6xl md:text-8xl font-bold tracking-tighter mb-2"
            style={{
              color: 'var(--color-primary-container)',
              textShadow: '0 2px 12px rgba(255,255,255,0.5), 0 0 40px rgba(255,255,255,0.3)',
            }}
          >
            RAASTA
          </h2>
          <p
            className="font-headline italic text-xl md:text-2xl mb-12"
            style={{
              color: 'var(--color-on-surface)',
              textShadow: '0 1px 8px rgba(255,255,255,0.5)',
            }}
          >
            Your AI companion for Kashmiri heritage &amp; progress.
          </p>

          <HomeHeroMic />
        </div>
      </div>
    </section>
  )
}
