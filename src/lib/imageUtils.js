// A Google Sheets cell holds at most 50,000 characters, and product images
// are now stored directly in a cell (see apps-script/Code.gs) rather than
// uploaded to Drive. This keeps every compressed image comfortably under
// that limit — with real margin, not right up against the edge — by
// shrinking further and re-trying if a first pass still comes out too big.
const MAX_BASE64_CHARS = 40000

function loadImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read the selected file.'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('Could not decode the selected image.'))
      img.onload = () => resolve(img)
      img.src = reader.result
    }
    reader.readAsDataURL(file)
  })
}

function toDataUrl(img, maxDimension, quality) {
  let { width, height } = img
  if (width > maxDimension || height > maxDimension) {
    if (width >= height) {
      height = Math.round((height / width) * maxDimension)
      width = maxDimension
    } else {
      width = Math.round((width / height) * maxDimension)
      height = maxDimension
    }
  }
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  canvas.getContext('2d').drawImage(img, 0, 0, width, height)
  return canvas.toDataURL('image/jpeg', quality)
}

/**
 * Resizes and re-encodes an image file, shrinking it in steps until the
 * resulting base64 string fits well within a Sheets cell. Phone photos
 * are often several megabytes — this can take a few passes for a very
 * detailed photo, but always converges quickly since each step cuts both
 * dimensions and quality.
 */
export async function compressImageFile(file) {
  const img = await loadImage(file)

  const steps = [
    { maxDimension: 900, quality: 0.7 },
    { maxDimension: 700, quality: 0.6 },
    { maxDimension: 500, quality: 0.5 },
    { maxDimension: 350, quality: 0.4 },
    { maxDimension: 250, quality: 0.35 },
  ]

  let result = null
  for (const step of steps) {
    result = toDataUrl(img, step.maxDimension, step.quality)
    if (result.length <= MAX_BASE64_CHARS) return result
  }

  throw new Error(
    'This image is too detailed to compress small enough to save. Try a simpler photo or crop it tighter first.'
  )
}
