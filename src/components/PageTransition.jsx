import { useLayoutEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { gsap, prefersReducedMotion } from '../lib/gsap'

export default function PageTransition({ children }) {
  const location = useLocation()
  const ref = useRef(null)

  useLayoutEffect(() => {
    // New route → new page. Reset scroll first so the fade-in isn't seen
    // halfway down a previous page's scroll position (a common SPA glitch).
    window.scrollTo(0, 0)

    if (ref.current && !prefersReducedMotion) {
      gsap.fromTo(
        ref.current,
        { opacity: 0, y: 14 },
        {
          opacity: 1,
          y: 0,
          duration: 0.45,
          ease: 'power3.out',
          // GSAP animates `y` via an inline CSS transform and leaves it on
          // the element once the tween finishes. A transform on this
          // wrapper — which every routed page (including modals rendered
          // inside them) sits under — makes it the positioning context for
          // any `position: fixed` descendant instead of the real viewport.
          // That's what was trapping the Add Product modal's fixed overlay
          // inside this div's box, letting the page's <Footer> render on
          // top of it. Clearing the transform once the animation is done
          // restores normal fixed-position behavior for the rest of the tree.
          clearProps: 'transform',
        }
      )
    }
  }, [location.pathname])

  return <div ref={ref}>{children}</div>
}
