import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft, Send, UserCheck, Trash2, Loader2, CheckCircle2,
  FileText, ThumbsUp, ThumbsDown, Clock,
} from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import StatusBadge from '@/components/feedback/StatusBadge'
import ImageGallery from '@/components/feedback/ImageGallery'
import AttachmentComposer from '@/components/feedback/AttachmentComposer'
import AttachmentViewer from '@/components/feedback/AttachmentViewer'
import { formatDate, cn } from '@/lib/utils'
import { toast } from 'sonner'

const EMPTY_ATTACH = { note: '', images: [], video: { url: '', name: '' }, file: { url: '', name: '' } }

export default function FeedbackDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { user } = useAuth()

  const [draftText, setDraftText] = useState('')
  const [note, setNote] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [rejectReason, setRejectReason] = useState('')
  const [notifyAdmin, setNotifyAdmin] = useState(false)
  const [assignAttach, setAssignAttach] = useState(EMPTY_ATTACH)
  const [draftAttach, setDraftAttach] = useState(EMPTY_ATTACH)
  const [internalTab, setInternalTab] = useState('assign')

  const isLeader = user?.role === 'superadmin' || user?.role === 'dept_leader'
  const isOfficer = user?.role === 'officer' || user?.role === 'staff'

  const { data, isLoading } = useQuery({
    queryKey: ['feedback', id],
    queryFn: () => api.get(`/api/feedbacks/${id}`).then((r) => r.data),
  })

  useEffect(() => {
    if (data?.feedback) {
      const fb = data.feedback
      setNote(fb.note || '')
      setAssignedTo(fb.assignedTo?._id || '')
      setDraftText(fb.draftResponse || '')
      setAssignAttach({
        note: fb.assignAttachments?.note || '',
        images: fb.assignAttachments?.images || [],
        video: fb.assignAttachments?.video || { url: '', name: '' },
        file: fb.assignAttachments?.file || { url: '', name: '' },
      })
      setDraftAttach({
        note: fb.draftAttachments?.note || '',
        images: fb.draftAttachments?.images || [],
        video: fb.draftAttachments?.video || { url: '', name: '' },
        file: fb.draftAttachments?.file || { url: '', name: '' },
      })
    }
  }, [data])

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['feedback', id] })
    queryClient.invalidateQueries({ queryKey: ['feedbacks'] })
    queryClient.invalidateQueries({ queryKey: ['stats'] })
  }

  const noteMutation = useMutation({
    mutationFn: () => api.put(`/api/feedbacks/${id}`, { note }).then((r) => r.data),
    onSuccess: () => { toast.success('Đã lưu ghi chú'); invalidate() },
    onError: (e) => toast.error(e.response?.data?.error || 'Lỗi lưu'),
  })

  const assignMutation = useMutation({
    mutationFn: () => api.post(`/api/feedbacks/${id}/assign`, { assignedTo, ...assignAttach }).then((r) => r.data),
    onSuccess: () => { toast.success('Đã cập nhật phân công'); invalidate() },
    onError: (e) => toast.error(e.response?.data?.error || 'Lỗi phân công'),
  })

  const draftMutation = useMutation({
    mutationFn: () => api.post(`/api/feedbacks/${id}/draft`, { draftResponse: draftText, ...draftAttach }).then((r) => r.data),
    onSuccess: () => { toast.success('Đã gửi dự thảo, chờ lãnh đạo duyệt'); invalidate() },
    onError: (e) => toast.error(e.response?.data?.error || 'Lỗi gửi dự thảo'),
  })

  const approveMutation = useMutation({
    mutationFn: () => api.post(`/api/feedbacks/${id}/approve`, { finalResponse: draftText, notifyAdmin }).then((r) => r.data),
    onSuccess: () => { toast.success('Đã duyệt và gửi phản hồi cho dân qua Zalo'); invalidate() },
    onError: (e) => toast.error(e.response?.data?.error || 'Lỗi duyệt'),
  })

  const rejectMutation = useMutation({
    mutationFn: () => api.post(`/api/feedbacks/${id}/reject`, { rejectedReason: rejectReason }).then((r) => r.data),
    onSuccess: () => { toast.success('Đã từ chối, cán bộ cần soạn lại dự thảo'); setRejectReason(''); invalidate() },
    onError: (e) => toast.error(e.response?.data?.error || 'Lỗi từ chối'),
  })

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/api/feedbacks/${id}`),
    onSuccess: () => { toast.success('Đã xóa góp ý'); navigate('/feedbacks') },
    onError: (e) => toast.error(e.response?.data?.error || 'Lỗi xóa'),
  })

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const fb = data?.feedback
  const admins = data?.admins ?? []

  if (!fb) return <p className="text-destructive">Không tìm thấy góp ý</p>

  // Mã hiển thị luôn là mã 1022 thật; chưa đồng bộ xong thì để trống, không tự sinh.
  const gopyId = fb.cgy1022?.gopyId || ''
  const isDraft = fb.status === 'draft'
  const isResolved = fb.status === 'resolved'

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link to="/feedbacks">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" /> Quay lại
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold">
            Chi tiết phản ánh{' '}
            {gopyId ? (
              <span className="text-blue-600 font-mono">#{gopyId}</span>
            ) : (
              <span className="text-slate-400 text-base font-normal">(chờ mã 1022)</span>
            )}
          </h1>
          <p className="text-xs text-muted-foreground">{fb._id}</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {fb.categoryId && (
            <span className="text-sm text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
              {fb.categoryId.icon} {fb.categoryId.name}
            </span>
          )}
          {/* Trạng thái đồng bộ Cổng góp ý 1022 */}
          {fb.cgy1022?.synced ? (
            <span
              className="text-xs text-sky-700 bg-sky-50 border border-sky-200 px-2.5 py-1 rounded-full"
              title={fb.cgy1022.gopyId ? `Mã trên 1022: ${fb.cgy1022.gopyId}` : 'Đã đồng bộ Cổng góp ý 1022'}
            >
              ☁️ 1022 ✓
            </span>
          ) : fb.cgy1022?.attempts > 0 ? (
            <span
              className="text-xs text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full"
              title={`Chờ đồng bộ 1022 — đã thử ${fb.cgy1022.attempts} lần${fb.cgy1022.lastError ? `: ${fb.cgy1022.lastError}` : ''}`}
            >
              ☁️ 1022 ⏳
            </span>
          ) : null}
          <StatusBadge status={fb.status} />
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-4">
        {/* Left — info */}
        <div className="lg:col-span-3 space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Thông tin người gửi</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Họ tên</p>
                  <p className="font-medium">{fb.displayName || '(Ẩn danh)'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Liên hệ</p>
                  <p className="font-medium">{fb.contact}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Ngày gửi</p>
                  <p>{formatDate(fb.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Hạn xử lý</p>
                  <p className={fb.deadline && new Date(fb.deadline) < new Date() && !isResolved ? 'text-red-600 font-semibold' : ''}>
                    {fb.deadline ? formatDate(fb.deadline) : '—'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Phân công</p>
                  <p>{fb.assignedTo?.fullName ?? '—'}</p>
                </div>
                {fb.assignedBy && (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Người phân công</p>
                    <p>{fb.assignedBy?.fullName ?? '—'}</p>
                  </div>
                )}
              </div>

              {fb.title && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">Tiêu đề</p>
                  <p className="font-medium">{fb.title}</p>
                </div>
              )}

              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Nội dung phản ánh</p>
                <div className="bg-gray-50 rounded-lg p-4 text-sm leading-relaxed whitespace-pre-wrap">{fb.content}</div>
              </div>

              {(() => {
                const imgs = fb.imageUrls?.length > 0 ? fb.imageUrls : fb.imageUrl ? [fb.imageUrl] : []
                return imgs.length > 0 ? (
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                      Hình ảnh đính kèm ({imgs.length})
                    </p>
                    <ImageGallery images={imgs} />
                  </div>
                ) : null
              })()}

              {fb.videoUrl && (
                <div className="mt-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Video đính kèm</p>
                  <video src={fb.videoUrl} controls className="max-h-80 rounded-lg border object-cover w-full max-w-lg" />
                </div>
              )}
            </CardContent>
          </Card>

          {/* Trao đổi nội bộ — đính kèm Phân công & Xử lý */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">📎 Trao đổi nội bộ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-1 rounded-xl bg-slate-100 p-1">
                {[
                  { id: 'assign', label: 'Phân công' },
                  { id: 'draft', label: 'Xử lý' },
                ].map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setInternalTab(id)}
                    className={cn(
                      'flex-1 rounded-lg py-1.5 text-sm font-medium transition-all',
                      internalTab === id ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
              {internalTab === 'assign' ? (
                <AttachmentViewer data={fb.assignAttachments} emptyLabel="Chưa có đính kèm phân công." />
              ) : (
                <AttachmentViewer data={fb.draftAttachments} emptyLabel="Chưa có đính kèm xử lý." />
              )}
            </CardContent>
          </Card>

          {/* Dự thảo đang chờ duyệt */}
          {fb.draftResponse && (
            <Card className={isDraft ? 'border-sky-300' : 'border-slate-200'}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-sky-700">
                  <FileText className="h-4 w-4" />
                  Dự thảo phản hồi
                  {isDraft && <span className="text-xs bg-sky-100 text-sky-600 px-2 py-0.5 rounded-full ml-auto">Chờ duyệt</span>}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-sky-50 rounded-lg p-4 text-sm leading-relaxed whitespace-pre-wrap">{fb.draftResponse}</div>
                {fb.draftBy && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Soạn bởi {fb.draftBy?.fullName} · {fb.draftAt ? formatDate(fb.draftAt) : ''}
                  </p>
                )}
                {fb.rejectedReason && (
                  <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
                    <span className="font-semibold">Lý do từ chối: </span>{fb.rejectedReason}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Phản hồi đã gửi dân */}
          {isResolved && fb.finalResponse && (
            <Card className="border-green-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-green-700">
                  <CheckCircle2 className="h-4 w-4" /> Phản hồi đã gửi qua Zalo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-green-50 rounded-lg p-4 text-sm leading-relaxed whitespace-pre-wrap">{fb.finalResponse}</div>
                {fb.sentAt && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Gửi lúc {formatDate(fb.sentAt)}
                    {fb.approvedBy && ` · Duyệt bởi ${fb.approvedBy?.fullName}`}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Ghi chú nội bộ */}
          {fb.note && (
            <Card className="border-yellow-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base text-yellow-700">📝 Ghi chú nội bộ</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-yellow-50 rounded-lg p-3 text-sm whitespace-pre-wrap">{fb.note}</div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right — actions */}
        <div className="lg:col-span-2 space-y-4">

          {/* OFFICER: Soạn dự thảo */}
          {isOfficer && !isResolved && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="h-4 w-4 text-sky-500" /> Soạn dự thảo trả lời
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  rows={5}
                  placeholder="Nhập nội dung dự thảo phản hồi cho người dân..."
                  value={draftText}
                  onChange={(e) => setDraftText(e.target.value)}
                />
                <div className="border-t pt-3">
                  <p className="text-xs text-slate-500 mb-2">Đính kèm thêm thông tin xử lý (nội bộ, không gửi dân):</p>
                  <AttachmentComposer value={draftAttach} onChange={setDraftAttach} disabled={draftMutation.isPending} />
                </div>
                <Button
                  className="w-full bg-sky-600 hover:bg-sky-700 text-white"
                  onClick={() => {
                    if (!draftText.trim()) { toast.error('Vui lòng nhập nội dung dự thảo'); return }
                    if (window.confirm('Gửi dự thảo để lãnh đạo duyệt?')) draftMutation.mutate()
                  }}
                  disabled={draftMutation.isPending}
                >
                  {draftMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
                  Gửi dự thảo chờ duyệt
                </Button>
                {isDraft && (
                  <p className="text-xs text-center text-sky-600 bg-sky-50 rounded-lg p-2">
                    Dự thảo đã gửi, đang chờ lãnh đạo duyệt
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          {/* LEADER: Duyệt / Từ chối — có thể sửa nội dung trước khi gửi */}
          {isLeader && isDraft && (
            <Card className="border-sky-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2 text-sky-700">
                  <Clock className="h-4 w-4" /> Duyệt dự thảo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-xs text-slate-500 mb-1.5">Nội dung phản hồi gửi dân — có thể chỉnh sửa trước khi duyệt:</p>
                  <Textarea
                    rows={5}
                    className="border-sky-200 focus:ring-sky-300"
                    value={draftText}
                    onChange={(e) => setDraftText(e.target.value)}
                  />
                  {draftText !== fb.draftResponse && (
                    <p className="text-[11px] text-amber-600 mt-1">✏️ Đã chỉnh sửa so với bản gốc của cán bộ</p>
                  )}
                </div>
                {user?.role === 'dept_leader' && (
                  <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notifyAdmin}
                      onChange={(e) => setNotifyAdmin(e.target.checked)}
                      className="rounded border-slate-300"
                    />
                    Gửi chi tiết xử lý cho admin qua Zalo
                  </label>
                )}
                <Button
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
                  onClick={() => {
                    if (!draftText.trim()) { toast.error('Nội dung phản hồi không được để trống'); return }
                    if (window.confirm('Duyệt và gửi phản hồi này cho người dân qua Zalo?')) approveMutation.mutate()
                  }}
                  disabled={approveMutation.isPending}
                >
                  {approveMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ThumbsUp className="h-4 w-4 mr-2" />}
                  Duyệt & Gửi dân
                </Button>
                <div className="border-t pt-3 space-y-2">
                  <p className="text-xs text-slate-500">Hoặc từ chối và yêu cầu cán bộ soạn lại:</p>
                  <Textarea
                    rows={2}
                    placeholder="Lý do từ chối (tuỳ chọn)..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                  />
                  <Button
                    variant="outline"
                    className="w-full border-red-200 text-red-600 hover:bg-red-50"
                    onClick={() => {
                      if (window.confirm('Từ chối dự thảo và trả lại cán bộ?')) rejectMutation.mutate()
                    }}
                    disabled={rejectMutation.isPending}
                  >
                    {rejectMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ThumbsDown className="h-4 w-4 mr-2" />}
                    Từ chối — Trả về cán bộ
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* LEADER: Phân công */}
          {isLeader && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <UserCheck className="h-4 w-4 text-sky-500" /> Phân công xử lý
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <select
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                >
                  <option value="">— Chưa phân công —</option>
                  {admins.map((a) => (
                    <option key={a._id} value={a._id}>{a.fullName} (@{a.username})</option>
                  ))}
                </select>
                <div className="border-t pt-3">
                  <p className="text-xs text-slate-500 mb-2">Đính kèm thêm thông tin cho cán bộ xử lý:</p>
                  <AttachmentComposer value={assignAttach} onChange={setAssignAttach} disabled={assignMutation.isPending} />
                </div>
                <Button variant="secondary" className="w-full" onClick={() => assignMutation.mutate()} disabled={assignMutation.isPending}>
                  {assignMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Cập nhật phân công
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Ghi chú nội bộ */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">📝 Ghi chú nội bộ</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                rows={3}
                placeholder="Ghi chú cho nội bộ (người gửi không thấy)..."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <Button variant="outline" className="w-full" onClick={() => noteMutation.mutate()} disabled={noteMutation.isPending}>
                {noteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Lưu ghi chú
              </Button>
            </CardContent>
          </Card>

          {/* Xóa — chỉ superadmin */}
          {user?.role === 'superadmin' && (
            <Card className="border-red-100">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">Xóa vĩnh viễn phản ánh này</p>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => { if (window.confirm('Xác nhận xóa vĩnh viễn phản ánh này?')) deleteMutation.mutate() }}
                    disabled={deleteMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 mr-1" /> Xóa
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
