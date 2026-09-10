import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Bell, Inbox } from 'lucide-react'
import { api } from '@/lib/api'

function timeAgo(date) {
  const diff = (Date.now() - new Date(date).getTime()) / 1000
  if (diff < 60) return 'vừa xong'
  if (diff < 3600) return `${Math.floor(diff / 60)} phút`
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ`
  return `${Math.floor(diff / 86400)} ngày`
}

// Chuông thông báo = phản ánh đang chờ xử lý (status=pending).
// Backend lọc theo quyền: lãnh đạo thấy tất cả, cán bộ chỉ thấy phản ánh được phân công.
export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState(null)
  const ref = useRef(null)

  const { data } = useQuery({
    queryKey: ['notif-pending'],
    queryFn: () => api.get('/api/feedbacks', { params: { status: 'pending' } }).then((r) => r.data),
    refetchInterval: 60_000,
  })

  const pendingList = data?.feedbacks ?? []
  const pendingCount = data?.pagination?.total ?? 0

  useEffect(() => {
    if (!open) return
    const onClickOutside = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => {
          if (!open && ref.current) {
            const r = ref.current.getBoundingClientRect()
            setPos({ top: r.bottom + 8, right: Math.max(8, window.innerWidth - r.right) })
          }
          setOpen((v) => !v)
        }}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 border border-white/20 hover:bg-white/25 transition-all"
      >
        <Bell className="h-4 w-4 text-white" />
        {pendingCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-yellow-400 px-1 text-[10px] font-bold text-blue-900 ring-1 ring-blue-700">
            {pendingCount > 99 ? '99+' : pendingCount}
          </span>
        )}
      </button>

      {open && (
        <div
          className="fixed w-80 max-h-96 overflow-y-auto rounded-2xl bg-white border border-slate-100 shadow-xl z-50"
          style={{ top: pos?.top ?? 60, right: pos?.right ?? 24 }}
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <span className="text-sm font-bold text-slate-700">Thông báo</span>
            <span className="text-xs text-slate-400">{pendingCount} chờ xử lý</span>
          </div>

          {pendingList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <Inbox className="h-8 w-8 text-slate-200 mb-2" />
              <p className="text-sm text-slate-400">Không có phản ánh mới</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-50">
              {pendingList.slice(0, 8).map((fb) => (
                <Link
                  key={fb._id}
                  to={`/feedbacks/${fb._id}`}
                  onClick={() => setOpen(false)}
                  className="flex flex-col gap-0.5 px-4 py-2.5 hover:bg-blue-50 transition-colors"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-slate-700 truncate">{fb.displayName || 'Người dân'}</span>
                    <span className="shrink-0 text-[10px] text-slate-400">{timeAgo(fb.createdAt)}</span>
                  </div>
                  <span className="text-xs text-slate-500 line-clamp-2">
                    {fb.categoryId?.icon ? fb.categoryId.icon + ' ' : ''}{fb.content || '(không có nội dung)'}
                  </span>
                </Link>
              ))}
            </div>
          )}

          {pendingCount > 0 && (
            <Link
              to="/feedbacks?status=pending"
              onClick={() => setOpen(false)}
              className="block border-t border-slate-100 px-4 py-2.5 text-center text-xs font-semibold text-blue-600 hover:bg-blue-50"
            >
              Xem tất cả
            </Link>
          )}
        </div>
      )}
    </div>
  )
}
