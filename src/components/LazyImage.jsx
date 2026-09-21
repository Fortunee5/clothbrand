import { useState } from 'react'

/**
 * Drop-in replacement for <img> used across product cards, hero images,
 * and admin thumbnails. Two things make image-heavy pages feel "glitchy":
 * 1. Images popping in abruptly once downloaded.
 * 2. The page reflowing/jumping as each image's real size is discovered.
 * This component fixes both: a shimmer skeleton fills the exact box while
 * loading, then the image cross-fades in once decoded.
 */
export default function LazyImage({
  src,
  alt = '',
  className = '',
  imgClassName = '',
  eager = false,
  ...rest
}) {
  const [loaded, setLoaded] = useState(false)
  const [errored, setErrored] = useState(false)

  return (
    <div className={`relative overflow-hidden bg-gray-100 ${className}`}>
      {!loaded && !errored && (
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-gray-100 via-gray-200 to-gray-100 bg-[length:200%_200%]" />
      )}
      {errored ? (
        <div className="absolute inset-0 flex items-center justify-center text-[10px] uppercase tracking-widest text-gray-300">
          Image unavailable
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          loading={eager ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setErrored(true)}
          className={`h-full w-full object-cover transition-opacity duration-500 ease-out ${
            loaded ? 'opacity-100' : 'opacity-0'
          } ${imgClassName}`}
          {...rest}
        />
      )}
    </div>
  )
}
