import { useLayoutEffect, useRef } from 'react'
import { gsap, prefersReducedMotion } from '../lib/gsap'

/**
 * Runs `callback(context)` inside a gsap.context() scoped to `scopeRef`.
 * gsap.context() auto-tracks every tween/ScrollTrigger created inside the
 * callback and gsap.revert()'s them on unmount — this is what prevents the
 * "glitchy" leftover animations / duplicate ScrollTriggers that show up
 * when a user navigates between pages quickly in a SPA.
 */
export default function useGsapContext(callback, deps = [], scopeRef = null) {
  const localRef = useRef(null)
  const ref = scopeRef || localRef

  useLayoutEffect(() => {
    if (prefersReducedMotion) return
    const ctx = gsap.context(() => callback(ref.current), ref)
    return () => ctx.revert()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return ref
}
