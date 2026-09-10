import { useState, useCallback, useEffect } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

export default function ImageGallery({ images }) {
  const urls = (images || []).map((img) => (typeof img === 'string' ? img : img?.url)).filter(Boolean)
  const [openIndex, setOpenIndex] = useState(null)

  const close = useCallback(() => setOpenIndex(null), [])
  const prev = useCallback((e) => { e?.stopPropagation(); setOpenIndex((i) => (i - 1 + urls.length) % urls.length) }, [urls.length])
  const next = useCallback((e) => { e?.stopPropagation(); setOpenIndex((i) => (i + 1) % urls.length) }, [urls.length])

  useEffect(() => {
    if (openIndex === null) return
    const onKey = (e) => {
      if (e.key === 'Escape') close()
      else if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'ArrowRight') next()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [openIndex, close, prev, next])

  if (!urls.length) return null

  return (
    <>
      <div className={`grid gap-2 ${urls.length === 1 ? 'grid-cols-1 max-w-sm' : 'grid-cols-2 sm:grid-cols-3'}`}>
        {urls.map((url, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setOpenIndex(i)}
            className="aspect-square overflow-hidden rounded-lg border bg-slate-50 hover:opacity-90 transition-opacity cursor-zoom-in"
          >
            <img src={url} alt={`Ảnh ${i + 1}`} className="h-full w-full object-contain" />
          </button>
        ))}
      </div>

      {openIndex !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={close}>
          <button onClick={close} className="absolute top-4 right-4 text-white/80 hover:text-white">
            <X className="h-7 w-7" />
          </button>
          {urls.length > 1 && (
            <>
              <button onClick={prev} className="absolute left-2 sm:left-6 text-white/80 hover:text-white">
                <ChevronLeft className="h-9 w-9" />
              </button>
              <button onClick={next} className="absolute right-2 sm:right-6 text-white/80 hover:text-white">
                <ChevronRight className="h-9 w-9" />
              </button>
            </>
          )}
          <img
            src={urls[openIndex]}
            alt={`Ảnh ${openIndex + 1}`}
            className="max-h-[90vh] max-w-[90vw] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          {urls.length > 1 && (
            <span className="absolute bottom-4 text-white/70 text-sm">{openIndex + 1}/{urls.length}</span>
          )}
        </div>
      )}
    </>
  )
}
