const MAX_STORED_LENGTH = 3_500_000

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('Could not read image'))
    img.src = url
  })
}

function encode(img: HTMLImageElement, maxSize: number, quality: number): string {
  const scale = Math.min(1, maxSize / Math.max(img.naturalWidth, img.naturalHeight))
  const width = Math.max(1, Math.round(img.naturalWidth * scale))
  const height = Math.max(1, Math.round(img.naturalHeight * scale))
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas is unavailable')
  ctx.drawImage(img, 0, 0, width, height)
  return canvas.toDataURL('image/jpeg', quality)
}

export async function fileToDataUrl(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('That file is not an image')
  const objectUrl = URL.createObjectURL(file)
  try {
    const img = await loadImage(objectUrl)
    let dataUrl = encode(img, 1920, 0.85)
    if (dataUrl.length > MAX_STORED_LENGTH) dataUrl = encode(img, 1440, 0.7)
    if (dataUrl.length > MAX_STORED_LENGTH) throw new Error('Image is too large to embed')
    return dataUrl
  } finally {
    URL.revokeObjectURL(objectUrl)
  }
}
