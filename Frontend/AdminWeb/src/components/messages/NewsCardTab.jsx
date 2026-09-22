import { useEffect, useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Search, Loader2, Send, FlaskConical, Newspaper, Users,
  ChevronLeft, ChevronRight, ExternalLink,
} from 'lucide-react'
import { toast } from 'sonner'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn, formatDate, formatDateShort } from '@/lib/utils'
import ZaloCardPreview from './ZaloCardPreview'

const STATUS_LABEL = {
  sending: { text: 'Đang gửi', className: 'bg-sky-50 text-sky-700' },
  done: { text: 'Xong', className: 'bg-emerald-50 text-emerald-700' },
  failed: { text: 'Thất bại', className: 'bg-red-50 text-red-600' },
}

function errorSummary(errors = []) {
  return errors.map((e) => `${e.code}: ${e.message} (${e.count})`).join('\n')
}

// ── Chọn tin ───────────────────────────────────────────────────────────────────
function NewsPicker({ selected, onSelect }) {
  const [q, setQ] = useState('')
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['news-card-news', q, page],
    queryFn: () => api.get('/api/broadcast/news-cards/news', { params: { q, page } }).then((r) => r.data),
    placeholderData: (prev) => prev,
  })
  const items = data?.items ?? []

  return (
    <Card className="lg:col-span-2">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Newspaper className="h-4 w-4 text-blue-600" /> 1. Chọn tin cần gửi
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <Input
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1) }}
            placeholder="Tìm theo tiêu đề..."
            className="pl-9"
          />
        </div>

        {isLoading ? (
          <div className="flex h-40 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-blue-500" /></div>
        ) : items.length === 0 ? (
          <p className="py-10 text-center text-sm text-slate-400">Chưa có tin tức nào</p>
        ) : (
          <div className="max-h-[520px] space-y-1.5 overflow-y-auto pr-1">
            {items.map((n) => (
              <button
                key={n._id}
                type="button"
                onClick={() => onSelect(n)}
                className={cn(
                  'flex w-full gap-3 rounded-xl border p-2 text-left transition-all',
                  selected?._id === n._id ? 'border-blue-400 bg-blue-50 shadow-sm' : 'border-slate-100 hover:border-blue-200 hover:bg-slate-50'
                )}
              >
                {n.imageUrl ? (
                  <img src={n.imageUrl} alt="" className="h-12 w-16 shrink-0 rounded-lg object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="flex h-12 w-16 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-lg">🖼️</div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-medium leading-snug text-slate-700">{n.title}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px]">
                    {n.date && <span className="text-slate-400">{n.date}</span>}
                    <span className={cn('rounded-full px-1.5 py-0.5 font-medium', n.hasOaArticle ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500')}>
                      {n.hasOaArticle ? 'Mở bài OA' : 'Mở trang gốc'}
                    </span>
                    {n.lastSend && (
                      <span className="rounded-full bg-amber-50 px-1.5 py-0.5 font-medium text-amber-700">
                        Đã gửi {formatDateShort(n.lastSend.at)} · {n.lastSend.sent} người
                      </span>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        {(data?.totalPages ?? 1) > 1 && (
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Trang {data.page}/{data.totalPages}</span>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" className="h-7 w-7 p-0" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" className="h-7 w-7 p-0" disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ── Lịch sử gửi thẻ ────────────────────────────────────────────────────────────
function NewsCardHistory() {
  const { data, isLoading } = useQuery({
    queryKey: ['news-card-history'],
    queryFn: () => api.get('/api/broadcast/news-cards/history').then((r) => r.data),
  })
  const items = data?.items ?? []

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Lịch sử gửi thẻ tin</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-24 items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-blue-500" /></div>
        ) : items.length === 0 ? (
          <p className="py-6 text-center text-sm text-slate-400">Chưa gửi thẻ tin nào</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50 text-left text-[11px] uppercase tracking-wider text-slate-500">
                  <th className="px-3 py-2.5">Thời gian</th>
                  <th className="px-3 py-2.5">Tin</th>
                  <th className="px-3 py-2.5">Người nhận</th>
                  <th className="px-3 py-2.5">Thành công</th>
                  <th className="px-3 py-2.5">Lỗi</th>
                  <th className="px-3 py-2.5">Trạng thái</th>
                  <th className="px-3 py-2.5">Người gửi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.map((s) => {
                  const st = STATUS_LABEL[s.status] ?? STATUS_LABEL.sending
                  return (
                    <tr key={s._id} className="hover:bg-slate-50">
                      <td className="whitespace-nowrap px-3 py-2.5 text-xs text-slate-500">{formatDate(s.createdAt)}</td>
                      <td className="px-3 py-2.5">
                        <p className="line-clamp-1 max-w-[320px] font-medium text-slate-700">{s.title}</p>
                        <a href={s.targetUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline">
                          {s.targetType === 'oa' ? 'Bài viết OA' : 'Trang tin gốc'} <ExternalLink className="h-3 w-3" />
                        </a>
                      </td>
                      <td className="px-3 py-2.5">{s.recipientCount}</td>
                      <td className="px-3 py-2.5 font-semibold text-emerald-600">{s.sent}</td>
                      <td className="px-3 py-2.5">
                        {s.failed > 0 ? (
                          <span className="cursor-help font-semibold text-red-600" title={errorSummary(s.errorCounts)}>{s.failed}</span>
                        ) : (
                          <span className="text-slate-300">0</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-semibold', st.className)}>{st.text}</span>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-slate-500">{s.sentBy?.fullName || '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ── Tab chính ─────────────────────────────────────────────────────────────────
// Gửi thẻ tin tới TẤT CẢ người quan tâm OA — Backend tự lấy danh sách từ Zalo
// lúc gửi (services/newsCardService.js), trang này không chọn người nhận.
export default function NewsCardTab() {
  const qc = useQueryClient()
  const [selected, setSelected] = useState(null)
  const [jobId, setJobId] = useState(null)
  const [job, setJob] = useState(null)
  const pollRef = useRef(null)

  // Chỉ để hiển thị số tham khảo — danh sách đã đồng bộ ở tab "Followers & Nhóm".
  const { data: followersData } = useQuery({
    queryKey: ['broadcast-followers'],
    queryFn: () => api.get('/api/broadcast/followers').then((r) => r.data),
  })
  const knownFollowers = followersData?.followers?.length ?? 0
  const sending = Boolean(jobId) && !job?.done && !job?.lost

  const testMut = useMutation({
    mutationFn: () => api.post('/api/broadcast/news-cards/test', { newsId: selected._id }).then((r) => r.data),
    onSuccess: () => toast.success('Đã gửi thử — mở Zalo của bạn để xem thẻ'),
    onError: (e) => toast.error(e.response?.data?.error || 'Gửi thử thất bại'),
  })

  const sendMut = useMutation({
    mutationFn: (body) => api.post('/api/broadcast/news-cards', body).then((r) => r.data),
    onSuccess: (data) => {
      setJobId(data.jobId)
      setJob({ total: data.total, sent: 0, failed: 0, done: false, errors: [] })
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Không gửi được thẻ tin'),
  })

  // Theo dõi tiến độ — dùng chung route trạng thái job với tab "Gửi tin nhắn".
  useEffect(() => {
    if (!jobId) return
    pollRef.current = setInterval(async () => {
      try {
        const { data } = await api.get(`/api/broadcast/status/${jobId}`)
        setJob(data)
        if (data.done) {
          clearInterval(pollRef.current)
          toast.success(`Gửi xong: ${data.sent} thành công${data.failed ? `, ${data.failed} lỗi` : ''}`)
          qc.invalidateQueries({ queryKey: ['news-card-news'] })
          qc.invalidateQueries({ queryKey: ['news-card-history'] })
        }
      } catch {
        // Job hết hạn/Backend khởi động lại — số liệu vẫn được lưu trong lịch sử gửi.
        clearInterval(pollRef.current)
        setJob((j) => (j ? { ...j, lost: true } : j))
        qc.invalidateQueries({ queryKey: ['news-card-history'] })
      }
    }, 1000)
    return () => clearInterval(pollRef.current)
  }, [jobId, qc])

  function handleSend() {
    if (!selected) return
    const lines = [`Gửi thẻ tin "${selected.title}" tới tất cả người quan tâm OA?`]
    if (selected.lastSend) lines.push(`\nLưu ý: tin này đã gửi ngày ${formatDateShort(selected.lastSend.at)}.`)
    if (!window.confirm(lines.join(' '))) return
    sendMut.mutate({ newsId: selected._id })
  }

  const progress = job?.total ? Math.round(((job.sent + job.failed) / job.total) * 100) : 0

  return (
    <div className="space-y-4">
      <div className="grid gap-4 lg:grid-cols-5">
        <NewsPicker selected={selected} onSelect={setSelected} />

        <div className="space-y-4 lg:col-span-3">
          {/* 2. Xem trước */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">2. Xem trước thẻ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {selected ? (
                <>
                  <ZaloCardPreview title={selected.title} summary={selected.summary} imageUrl={selected.imageUrl} />
                  <p className="text-xs text-slate-500">
                    Bấm vào thẻ sẽ mở:{' '}
                    <b>{selected.hasOaArticle ? 'bài viết trên OA (ngay trong Zalo)' : 'trang tin gốc'}</b>
                    {!selected.hasOaArticle && selected.link && (
                      <a href={selected.link} target="_blank" rel="noreferrer" className="ml-1 inline-flex items-center gap-1 text-blue-600 hover:underline">
                        xem <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </p>
                  <Button variant="outline" size="sm" onClick={() => testMut.mutate()} disabled={testMut.isPending}>
                    {testMut.isPending ? <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" /> : <FlaskConical className="mr-1.5 h-3.5 w-3.5" />}
                    Gửi thử cho tôi
                  </Button>
                </>
              ) : (
                <p className="py-10 text-center text-sm text-slate-400">Chọn 1 tin ở bên trái để xem thẻ</p>
              )}
            </CardContent>
          </Card>

          {/* 3. Gửi */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">3. Gửi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start gap-2.5 rounded-xl bg-slate-50 px-3 py-2.5 text-sm text-slate-600">
                <Users className="mt-0.5 h-4 w-4 shrink-0 text-blue-500" />
                <p>
                  Gửi tới <b>tất cả người quan tâm OA</b> — danh sách lấy trực tiếp từ Zalo lúc bấm gửi
                  {knownFollowers > 0 && <> (lần đồng bộ gần nhất: <b>{knownFollowers}</b> người)</>}.
                </p>
              </div>

              <Button className="w-full" onClick={handleSend} disabled={!selected || sending || sendMut.isPending}>
                {sending || sendMut.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Gửi cho tất cả người quan tâm OA
              </Button>

              {job && (
                <div className="space-y-2 rounded-xl border border-slate-100 p-3">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>{job.done ? 'Đã gửi xong' : job.lost ? 'Mất kết nối tiến độ' : 'Đang gửi...'}</span>
                    <span>
                      <b className="text-emerald-600">{job.sent}</b> thành công · <b className="text-red-600">{job.failed}</b> lỗi / {job.total}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-blue-500 transition-all" style={{ width: `${progress}%` }} />
                  </div>
                  {job.lost && (
                    <p className="text-xs text-slate-500">Không theo dõi được tiến độ nữa — số liệu cuối cùng xem ở "Lịch sử gửi thẻ tin" bên dưới.</p>
                  )}
                  {job.errors?.length > 0 && (
                    <>
                      <ul className="space-y-0.5 text-xs text-red-600">
                        {job.errors.map((e) => (
                          <li key={e.code}>Mã {e.code}: {e.message} — {e.count} người</li>
                        ))}
                      </ul>
                      <p className="text-[11px] text-slate-400">
                        Zalo có thể từ chối người đã lâu không tương tác với OA (quy định tin tư vấn).
                      </p>
                    </>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <NewsCardHistory />
    </div>
  )
}
