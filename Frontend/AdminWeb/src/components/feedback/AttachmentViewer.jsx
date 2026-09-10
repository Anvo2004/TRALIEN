import { FileText, Download } from 'lucide-react'
import ImageGallery from './ImageGallery'
import { formatDate } from '@/lib/utils'

export default function AttachmentViewer({ data, emptyLabel = 'Chưa có nội dung trao đổi.' }) {
  const note = data?.note || ''
  const images = data?.images || []
  const video = data?.video || {}
  const file = data?.file || {}
  const sentByName = data?.sentBy?.fullName
  const sentAt = data?.sentAt

  const isEmpty = !note && !images.length && !video.url && !file.url
  if (isEmpty) {
    return <p className="text-sm text-slate-400 text-center py-6">{emptyLabel}</p>
  }

  return (
    <div className="space-y-3">
      {note && <div className="bg-slate-50 rounded-lg p-3 text-sm whitespace-pre-wrap">{note}</div>}
      <ImageGallery images={images} />
      {video.url && (
        <video controls className="w-full max-h-80 rounded-lg border bg-black">
          <source src={video.url} />
        </video>
      )}
      {file.url && (
        <a
          href={file.url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2.5 rounded-lg border px-3 py-2 text-sm hover:bg-slate-50 transition-colors"
        >
          <FileText className="h-4 w-4 text-emerald-500 shrink-0" />
          <span className="flex-1 truncate">{file.name}</span>
          <Download className="h-4 w-4 text-slate-400" />
        </a>
      )}
      {(sentByName || sentAt) && (
        <p className="text-xs text-muted-foreground">
          {sentByName && `Gửi bởi ${sentByName}`}
          {sentByName && sentAt && ' · '}
          {sentAt ? formatDate(sentAt) : ''}
        </p>
      )}
    </div>
  )
}
