import { useState, useEffect, useRef, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Star, Quote } from 'lucide-react'

// Edit these freely. Use real customer feedback where you can.
const REVIEWS = [
  { name: 'Bolu', text: "I wore my outfit to a friend's wedding and I lost count of the compliments. The fit is clean, the fabric feels premium, and it arrived exactly as pictured. I've already ordered a second piece." },
  { name: 'Mary', text: "Ordering was so easy, and my parcel was packaged beautifully. The material is soft but sturdy, and it still looks brand new after several washes. This is my go-to store for office wear now." },
  { name: 'Abigail', text: "I'm usually nervous buying clothes online, but the sizes were spot on. The finishing is neat, with no loose threads anywhere. Pure quality for the price. I'm telling all my friends." },
  { name: 'Tolu', text: "Fast delivery and great communication from the team. They called me about my delivery, answered every question, and my order came on the exact day they promised. Very professional." },
  { name: 'Faith', text: "The colour is even richer in person than on the site. It's stylish, comfortable, and I can dress it up or down. I wore it three days in a row and nobody noticed the repeat. Worth every naira." },
  { name: 'Janet', text: "I bought gifts for my sisters and they were thrilled. Everything came wrapped well and looked so classy. Great taste, great quality, and I'll definitely be shopping again before the festive season." },
  { name: 'Chisom', text: "From the first click to the doorstep, the experience was smooth. The outfit hugs in all the right places and feels expensive. I got asked where I bought it at least five times." },
]

const INTERVAL = 5000

export default function Reviews() {
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const timer = useRef(null)
  const touchX = useRef(null)
  const count = REVIEWS.length

  const go = useCallback((dir) => setIndex((i) => (i + dir + count) % count), [count])

  // Auto-swipe every 5 seconds. Any manual action restarts the 5s countdown.
  useEffect(() => {
    if (paused) return
    timer.current = setTimeout(() => go(1), INTERVAL)
    return () => clearTimeout(timer.current)
  }, [index, paused, go])

  return (
    <section className="bg-white py-16 sm:py-24" aria-label="Customer reviews">
      <div className="container mx-auto px-4 sm:px-6 max-w-3xl">
        <div className="text-center mb-10">
          <p className="text-[#C9A24B] text-[10px] tracking-[0.25em] uppercase font-semibold mb-3">Reviews</p>
          <h2 className="text-2xl sm:text-4xl font-bold uppercase tracking-tight">What Our Customers Say</h2>
        </div>

        <div
          className="relative flex items-center gap-2 sm:gap-4"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onTouchStart={(e) => { touchX.current = e.touches[0].clientX }}
          onTouchEnd={(e) => {
            if (touchX.current === null) return
            const dx = e.changedTouches[0].clientX - touchX.current
            if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1)
            touchX.current = null
          }}
        >
          <button onClick={() => go(-1)} aria-label="Previous review"
            className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center border border-gray-200 rounded-full hover:bg-[#0D0F1C] hover:text-white transition-colors">
            <ChevronLeft size={20} />
          </button>

          <div className="overflow-hidden flex-1" aria-live="polite">
            <div className="flex transition-transform duration-700 ease-out" style={{ transform: `translateX(-${index * 100}%)` }}>
              {REVIEWS.map((r) => (
                <figure key={r.name} className="w-full shrink-0 px-2 sm:px-6 text-center min-h-[230px] flex flex-col items-center justify-center">
                  <Quote size={28} className="text-[#C9A24B] mb-4" />
                  <blockquote className="text-sm sm:text-lg leading-relaxed text-gray-700">{r.text}</blockquote>
                  <div className="flex gap-0.5 mt-5 text-[#C9A24B]">
                    {[0, 1, 2, 3, 4].map((n) => <Star key={n} size={14} fill="currentColor" />)}
                  </div>
                  <figcaption className="mt-2 text-xs font-bold uppercase tracking-[0.18em]">{r.name}</figcaption>
                </figure>
              ))}
            </div>
          </div>

          <button onClick={() => go(1)} aria-label="Next review"
            className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center border border-gray-200 rounded-full hover:bg-[#0D0F1C] hover:text-white transition-colors">
            <ChevronRight size={20} />
          </button>
        </div>

        <div className="flex justify-center gap-2 mt-6">
          {REVIEWS.map((r, i) => (
            <button key={r.name} onClick={() => setIndex(i)} aria-label={`Show review ${i + 1}`}
              className={`h-1.5 rounded-full transition-all duration-300 ${i === index ? 'w-6 bg-[#0D0F1C]' : 'w-1.5 bg-gray-300'}`} />
          ))}
        </div>
      </div>
    </section>
  )
}
