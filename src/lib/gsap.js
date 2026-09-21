import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

// Respect users who've asked their OS for reduced motion — big fashion-site
// animations are a delight, not a requirement, and shouldn't override
// accessibility preferences.
export const prefersReducedMotion =
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

// A shared "quick, premium" easing so every animation across the site feels
// like it belongs to the same brand rather than a grab-bag of effects.
export const EASE = 'power3.out'

export { gsap, ScrollTrigger }
