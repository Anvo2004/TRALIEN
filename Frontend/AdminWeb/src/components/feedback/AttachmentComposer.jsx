import { useState } from 'react'
import { Image, Video, FileText, X, Loader2 } from 'lucide-react'
import { api } from '@/lib/api'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

function AttachTypeTabs({ active, onChange }) {
  return (
    <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
      {[
        { id: 'image', label: 'Hình ảnh', icon: Image },
        { id: 'video', label: 'Video', icon: Video },
        { id: 'file', label: 'File', icon: FileText },
      ].map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => onChange(id)}
          className={cn(
            'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
            active === id ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          )}
        >
          <Icon className="h-3.5 w-3.5" /> {label}
        </button>
      ))}
    </div>
  )
}

export default function AttachmentComposer({ value, onChange, disabled }) {
  const [attachType, setAttachType] = useState('image')
  const [uploadingImages, setUploadingImages] = useState(false)
  const [uploadingVideo, setUploadingVideo] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)

  const note = value?.note || ''
  const images = value?.images || []
  const video = value?.video || { url: '', name: '' }
  const file = value?.file || { url: '', name: '' }

  const patch = (next) => onChange({ note, images, video, file, ...next })

  async function handleImageFiles(files) {
    const allowed = Array.from(files).filter((f) => f.type.startsWith('image/')).slice(0, 5 - images.length)
    if (!allowed.length) return
    setUploadingImages(true)
    const fd = new FormData()
    allowed.forEach((f) => fd.append('images', f))
    try {
      const { data } = await api.post('/api/feedbacks/attachments/upload/image', fd)
      patch({ images: [...images, ...data.images] })
    } catch (e) {
      toast.error(e.response?.data?.error || 'Upload ảnh thất bại')
    } finally {
      setUploadingImages(false)
    }
  }

  async function handleVideoFile(f) {
    if (!f) return
    setUploadingVideo(true)
    const fd = new FormData()
    fd.append('video', f)
    try {
      const { data } = await api.post('/api/feedbacks/attachments/upload/video', fd)
      patch({ video: { url: data.url, name: data.name } })
    } catch (e) {
      toast.error(e.response?.data?.error || 'Upload video thất bại')
    } finally {
      setUploadingVideo(false)
    }
  }

  async function handleFileUpload(f) {
    if (!f) return
    setUploadingFile(true)
    const fd = new FormData()
    fd.append('file', f)
    try {
      const { data } = await api.post('/api/feedbacks/attachments/upload/file', fd)
      patch({ file: { url: data.url, name: data.name } })
    } catch (e) {
      toast.error(e.response?.data?.error || 'Upload file thất bại')
    } finally {
      setUploadingFile(false)
    }
  }

  return (
    <div className="space-y-3">
      <Textarea
        rows={2}
        placeholder="Ghi chú kèm đính kèm (tuỳ chọn)..."
        value={note}
        onChange={(e) => patch({ note: e.target.value })}
        disabled={disabled}
      />
      <AttachTypeTabs active={attachType} onChange={setAttachType} />

      {attachType === 'image' && (
        <div className="space-y-2">
          {images.length < 5 && (
            <label className="flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-slate-200 p-4 cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30 transition-all">
              <Image className="h-5 w-5 text-slate-300" />
              <span className="text-xs text-slate-400">
                {uploadingImages ? 'Đang tải ảnh...' : 'Chọn hoặc kéo thả ảnh · tối đa 5 ảnh · 10MB/ảnh'}
              </span>
              <input
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                disabled={disabled || uploadingImages}
                onChange={(e) => handleImageFiles(e.target.files)}
              />
            </label>
          )}
          {images.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {images.map((img, i) => (
                <div key={i} className="relative h-16 w-16 rounded-lg overflow-hidden border border-slate-200">
                  <img src={img.url} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => patch({ images: images.filter((_, j) => j !== i) })}
                    className="absolute top-0.5 right-0.5 rounded-full bg-red-500 text-white h-4 w-4 flex items-center justify-center text-[10px] hover:bg-red-600"
                  >
                    <X className="h-2.5 w-2.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {attachType === 'video' && (
        <div className="space-y-2">
          {!video.url ? (
            <label className="flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-slate-200 p-4 cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30 transition-all">
              <Video className="h-5 w-5 text-slate-300" />
              <span className="text-xs text-slate-400">
                {uploadingVideo ? 'Đang tải video...' : 'Chọn video · tối đa 100MB'}
              </span>
              <input
                type="file"
                accept="video/*"
                className="hidden"
                disabled={disabled || uploadingVideo}
                onChange={(e) => handleVideoFile(e.target.files[0])}
              />
            </label>
          ) : (
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2.5">
              {uploadingVideo ? <Loader2 className="h-4 w-4 animate-spin text-slate-400" /> : <Video className="h-5 w-5 text-emerald-500 shrink-0" />}
              <p className="flex-1 text-sm font-medium truncate">{video.name}</p>
              <button type="button" onClick={() => patch({ video: { url: '', name: '' } })} className="text-slate-400 hover:text-red-500">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {attachType === 'file' && (
        <div className="space-y-2">
          {!file.url ? (
            <label className="flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-slate-200 p-4 cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/30 transition-all">
              <FileText className="h-5 w-5 text-slate-300" />
              <span className="text-xs text-slate-400">
                {uploadingFile ? 'Đang tải file...' : 'Chọn file .pdf .doc .csv · tối đa 20MB'}
              </span>
              <input
                type="file"
                accept=".pdf,.doc,.csv"
                className="hidden"
                disabled={disabled || uploadingFile}
                onChange={(e) => handleFileUpload(e.target.files[0])}
              />
            </label>
          ) : (
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2.5">
              {uploadingFile ? <Loader2 className="h-4 w-4 animate-spin text-slate-400" /> : <FileText className="h-5 w-5 text-emerald-500 shrink-0" />}
              <p className="flex-1 text-sm font-medium truncate">{file.name}</p>
              <button type="button" onClick={() => patch({ file: { url: '', name: '' } })} className="text-slate-400 hover:text-red-500">
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
