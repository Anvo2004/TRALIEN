import { useState, useRef, useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Send, RefreshCw, Loader2, Image, Video, FileText, Users, History,
  X, Plus, Trash2, Search, CheckSquare, Square, ChevronDown, ChevronUp,
  AlertTriangle, ExternalLink, CalendarClock, Ban,
} from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

function TokenExpiredBanner() {
  return (
    <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
      <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
      <div className="flex-1 text-sm">
        <p className="font-semibold text-amber-800">Token Zalo OA đã hết hạn</p>
        <p className="text-amber-700 mt-0.5">
          Cần cập nhật token mới để gửi tin và đồng bộ follower.{' '}
          <a
            href="/set-tokens"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-medium underline underline-offset-2 hover:text-amber-900"
          >
            Cập nhật tại đây <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </p>
      </div>
    </div>
  )
}

// ── helpers ────────────────────────────────────────────────────────────────────
function fmtBytes(b) {
  return b < 1024 * 1024 ? (b / 1024).toFixed(1) + ' KB' : (b / 1024 / 1024).toFixed(1) + ' MB'
}
function fmtTs(iso) {
  try { return new Date(iso).toLocaleString('vi-VN') } catch { return iso }
}
function hasRealName(f) {
  return f.display_name && f.display_name !== f.user_id
}

function FollowerAvatar({ f, size = 8 }) {
  const name = hasRealName(f) ? f.display_name : '?'
  const initial = name[0]?.toUpperCase() ?? '?'
  if (f.avatar) {
    return (
      <img
        src={f.avatar}
        alt={name}
        className={`h-${size} w-${size} rounded-full object-cover shrink-0`}
        onError={e => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
      />
    )
  }
  return (
    <div className={`h-${size} w-${size} rounded-full bg-gradient-to-br from-blue-400 to-cyan-400 flex items-center justify-center text-white text-xs font-bold shrink-0`}>
      {initial}
    </div>
  )
}

// ── Tab bar ────────────────────────────────────────────────────────────────────
function TabBar({ active, onChange }) {
  const tabs = [
    { id: 'send',      label: 'Gửi tin nhắn', icon: Send },
    { id: 'scheduled', label: 'Lịch hẹn', icon: CalendarClock },
    { id: 'followers', label: 'Followers & Nhóm', icon: Users },
    { id: 'logs',      label: 'Lịch sử gửi', icon: History },
  ]
  return (
    <div className="flex gap-1 rounded-2xl bg-slate-100 p-1">
      {tabs.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={cn(
            'flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all',
            active === id
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          )}
        >
          <Icon className="h-4 w-4 shrink-0" />
          <span className="hidden sm:inline">{label}</span>
        </button>
      ))}
    </div>
  )
}

// ── Attachment type tabs ───────────────────────────────────────────────────────
function AttachTypeTabs({ active, onChange }) {
  return (
    <div className="flex gap-1 rounded-xl bg-slate-100 p-1 mb-3">
      {[
        { id: 'image', label: 'Hình ảnh', icon: Image },
        { id: 'video', label: 'Video',    icon: Video },
        { id: 'file',  label: 'File',     icon: FileText },
      ].map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onChange(id)}
          className={cn(
            'flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
            active === id ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          )}
        >
          <Icon className="h-3.5 w-3.5" /> {label}
        </button>
      ))}
    </div>
  )
}

// ── SendTab ────────────────────────────────────────────────────────────────────
function SendTab({ followers, groups, syncedAt }) {
  const [attachType, setAttachType] = useState('image')
  const [imgPreviews, setImgPreviews] = useState([])   // [{file, url, id?}]
  const [videoInfo, setVideoInfo] = useState(null)     // {file, articleToken?}
  const [fileInfo, setFileInfo] = useState(null)       // {file, attachmentId?, filename}
  const [message, setMessage] = useState('')
  const [adminNote, setAdminNote] = useState('')
  const [recipientText, setRecipientText] = useState('')   // user IDs
  const [groupText, setGroupText] = useState('')           // group IDs
  const [followerPickerOpen, setFollowerPickerOpen] = useState(false)
  const [groupPickerOpen, setGroupPickerOpen] = useState(false)
  const [followerSearch, setFollowerSearch] = useState('')
  const [selectedFollowers, setSelectedFollowers] = useState(new Set())
  const [jobId, setJobId] = useState(null)
  const [job, setJob] = useState(null)
  const [scheduledAt, setScheduledAt] = useState('')
  const pollRef = useRef(null)
  const qc = useQueryClient()

  const linkMatch = message.match(/https?:\/\/[^\s]+/)?.[0] || ''

  // Upload mutations
  const uploadImageMut = useMutation({
    mutationFn: (formData) => api.post('/api/broadcast/upload/image', formData).then(r => r.data),
  })
  const uploadVideoMut = useMutation({
    mutationFn: (formData) => api.post('/api/broadcast/upload/video', formData).then(r => r.data),
  })
  const uploadFileMut = useMutation({
    mutationFn: (formData) => api.post('/api/broadcast/upload/file', formData).then(r => r.data),
  })
  const sendMut = useMutation({
    mutationFn: (body) => api.post('/api/broadcast/send', body).then(r => r.data),
    onSuccess: (data) => {
      setJobId(data.jobId)
      setJob({ total: data.total, sent: 0, failed: 0, done: false })
    },
    onError: (e) => {
      const code = e.response?.data?.code
      if (code === 'TOKEN_EXPIRED') toast.error('Token Zalo hết hạn — vào Followers tab để xem hướng dẫn')
      else toast.error(e.response?.data?.error || 'Lỗi gửi tin nhắn')
    },
  })
  const scheduleMut = useMutation({
    mutationFn: (body) => api.post('/api/broadcast/schedule', body).then(r => r.data),
    onSuccess: () => {
      toast.success('Đã đặt lịch gửi — xem ở tab "Lịch hẹn"')
      qc.invalidateQueries({ queryKey: ['broadcast-scheduled'] })
      setScheduledAt('')
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Lỗi đặt lịch gửi'),
  })

  // Poll job status
  useEffect(() => {
    if (!jobId) return
    pollRef.current = setInterval(async () => {
      try {
        const { data } = await api.get(`/api/broadcast/status/${jobId}`)
        setJob(data)
        if (data.done) {
          clearInterval(pollRef.current)
          toast.success(`Gửi hoàn tất: ${data.sent} thành công${data.failed ? `, ${data.failed} thất bại` : ''}`)
        }
      } catch { clearInterval(pollRef.current) }
    }, 800)
    return () => clearInterval(pollRef.current)
  }, [jobId])

  // Image file change
  async function handleImageFiles(files) {
    const allowed = Array.from(files).filter(f => f.type.startsWith('image/')).slice(0, 5 - imgPreviews.length)
    if (!allowed.length) return
    const previews = allowed.map(f => ({ file: f, url: URL.createObjectURL(f), id: null }))
    setImgPreviews(prev => [...prev, ...previews])

    const fd = new FormData()
    allowed.forEach(f => fd.append('images', f))
    try {
      const data = await uploadImageMut.mutateAsync(fd)
      setImgPreviews(prev => {
        const next = [...prev]
        let idx = 0
        for (let i = 0; i < next.length; i++) {
          if (!next[i].id && idx < data.attachmentIds.length) {
            next[i] = { ...next[i], id: data.attachmentIds[idx++] }
          }
        }
        return next
      })
    } catch (e) {
      toast.error(e.response?.data?.error || 'Upload ảnh thất bại')
    }
  }

  async function handleVideoFile(file) {
    if (!file) return
    setVideoInfo({ file, articleToken: null })
    const fd = new FormData()
    fd.append('video', file)
    try {
      const data = await uploadVideoMut.mutateAsync(fd)
      setVideoInfo(prev => prev ? { ...prev, articleToken: data.articleToken } : null)
    } catch (e) {
      toast.error(e.response?.data?.error || 'Upload video thất bại')
      setVideoInfo(null)
    }
  }

  async function handleFileUpload(file) {
    if (!file) return
    setFileInfo({ file, attachmentId: null, filename: file.name })
    const fd = new FormData()
    fd.append('file', file)
    try {
      const data = await uploadFileMut.mutateAsync(fd)
      setFileInfo(prev => prev ? { ...prev, attachmentId: data.attachmentId } : null)
    } catch (e) {
      toast.error(e.response?.data?.error || 'Upload file thất bại')
      setFileInfo(null)
    }
  }

  function buildRecipientList() {
    const ids = []
    recipientText.split('\n').forEach(line => { const s = line.trim(); if (s) ids.push(s) })
    groupText.split('\n').forEach(line => { const s = line.trim(); if (s) ids.push(`g:${s}`) })
    return ids
  }

  function buildContentPayload() {
    const userIds = buildRecipientList()
    if (!userIds.length) { toast.error('Chưa nhập người nhận'); return null }
    const attachmentIds = imgPreviews.filter(p => p.id).map(p => p.id)
    const hasContent = message.trim() || attachmentIds.length
      || videoInfo?.articleToken || fileInfo?.attachmentId || linkMatch
    if (!hasContent) { toast.error('Chưa có nội dung tin nhắn'); return null }

    return {
      userIds,
      message: message.trim() || undefined,
      attachmentIds: attachmentIds.length ? attachmentIds : undefined,
      videoAttachmentId: videoInfo?.articleToken || undefined,
      fileAttachmentId: fileInfo?.attachmentId || undefined,
      adminNote: adminNote.trim() || undefined,
      linkUrl: linkMatch || undefined,
    }
  }

  function handleSend() {
    const payload = buildContentPayload()
    if (!payload) return
    setJob(null); setJobId(null)
    sendMut.mutate(payload)
  }

  function handleSchedule() {
    if (!scheduledAt) return toast.error('Chưa chọn thời điểm hẹn gửi')
    if (new Date(scheduledAt) <= new Date()) return toast.error('Thời điểm hẹn gửi phải ở trong tương lai')
    const payload = buildContentPayload()
    if (!payload) return
    scheduleMut.mutate({ ...payload, scheduledAt: new Date(scheduledAt).toISOString() })
  }

  function addFollowersToPicker() {
    const lines = Array.from(selectedFollowers).join('\n')
    setRecipientText(prev => {
      const existing = prev.trim()
      return existing ? `${existing}\n${lines}` : lines
    })
    setFollowerPickerOpen(false)
    setSelectedFollowers(new Set())
  }

  const filteredFollowers = (followers || []).filter(f =>
    !followerSearch || f.display_name?.toLowerCase().includes(followerSearch.toLowerCase()) || f.user_id?.includes(followerSearch)
  )

  const totalRecipients = buildRecipientList().length

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* ── Cột trái: soạn tin ── */}
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Đính kèm (tuỳ chọn)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <AttachTypeTabs active={attachType} onChange={setAttachType} />

            {/* Image panel */}
            {attachType === 'image' && (
              <div className="space-y-2">
                <label
                  className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 p-6 cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all"
                  onDragOver={e => e.preventDefault()}
                  onDrop={e => { e.preventDefault(); handleImageFiles(e.dataTransfer.files) }}
                >
                  <Image className="h-6 w-6 text-slate-300" />
                  <span className="text-sm text-slate-400">Chọn hoặc kéo thả ảnh · tối đa 5 ảnh · 10MB/ảnh</span>
                  <input type="file" accept="image/*" multiple className="hidden"
                    onChange={e => handleImageFiles(e.target.files)} />
                </label>
                {imgPreviews.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {imgPreviews.map((p, i) => (
                      <div key={i} className="relative h-16 w-16 rounded-lg overflow-hidden border border-slate-200">
                        <img src={p.url} alt="" className="h-full w-full object-cover" />
                        {!p.id && <div className="absolute inset-0 bg-black/40 flex items-center justify-center"><Loader2 className="h-4 w-4 text-white animate-spin" /></div>}
                        <button
                          onClick={() => setImgPreviews(prev => prev.filter((_, j) => j !== i))}
                          className="absolute top-0.5 right-0.5 rounded-full bg-red-500 text-white h-4 w-4 flex items-center justify-center text-[10px] hover:bg-red-600"
                        ><X className="h-2.5 w-2.5" /></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Video panel */}
            {attachType === 'video' && (
              <div className="space-y-2">
                <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2 text-xs text-amber-700">
                  ⚠️ Video chỉ gửi được vào <strong>nhóm</strong> — user cá nhân sẽ nhận link text.
                </div>
                {!videoInfo ? (
                  <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 p-6 cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all">
                    <Video className="h-6 w-6 text-slate-300" />
                    <span className="text-sm text-slate-400">Chọn video MP4/MOV · tối đa 100MB</span>
                    <input type="file" accept="video/mp4,video/quicktime" className="hidden"
                      onChange={e => handleVideoFile(e.target.files[0])} />
                  </label>
                ) : (
                  <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2.5">
                    <Video className="h-5 w-5 text-blue-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{videoInfo.file.name}</p>
                      <p className="text-xs text-slate-400">{fmtBytes(videoInfo.file.size)}</p>
                    </div>
                    {!videoInfo.articleToken && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
                    {videoInfo.articleToken && <span className="text-xs text-green-600 font-medium">✓ Sẵn sàng</span>}
                    <button onClick={() => setVideoInfo(null)} className="text-slate-400 hover:text-red-500"><X className="h-4 w-4" /></button>
                  </div>
                )}
              </div>
            )}

            {/* File panel */}
            {attachType === 'file' && (
              <div className="space-y-2">
                {!fileInfo ? (
                  <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 p-6 cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all">
                    <FileText className="h-6 w-6 text-slate-300" />
                    <span className="text-sm text-slate-400">Chọn file .pdf .doc .csv · tối đa 20MB</span>
                    <input type="file" accept=".pdf,.doc,.csv" className="hidden"
                      onChange={e => handleFileUpload(e.target.files[0])} />
                  </label>
                ) : (
                  <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2.5">
                    <FileText className="h-5 w-5 text-blue-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{fileInfo.filename}</p>
                      <p className="text-xs text-slate-400">{fmtBytes(fileInfo.file.size)}</p>
                    </div>
                    {!fileInfo.attachmentId && <Loader2 className="h-4 w-4 animate-spin text-slate-400" />}
                    {fileInfo.attachmentId && <span className="text-xs text-green-600 font-medium">✓ Sẵn sàng</span>}
                    <button onClick={() => setFileInfo(null)} className="text-slate-400 hover:text-red-500"><X className="h-4 w-4" /></button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Nội dung tin nhắn</CardTitle>
              <span className={cn('text-xs font-mono', message.length > 1800 ? 'text-red-500' : 'text-slate-400')}>
                {message.length}/2000
              </span>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={message}
              onChange={e => setMessage(e.target.value.slice(0, 2000))}
              placeholder="Nhập nội dung tin nhắn&#10;&#10;Nếu có link (https://...) sẽ tự động nhúng nút bấm"
              rows={5}
              className="resize-none text-sm"
            />
            {linkMatch && (
              <div className="flex items-center gap-2 rounded-xl bg-blue-50 border border-blue-200 px-3 py-2 text-xs text-blue-700">
                <span className="shrink-0">🔗 Phát hiện link:</span>
                <span className="truncate font-mono">{linkMatch}</span>
              </div>
            )}
            <div>
              <Label className="text-xs text-slate-500 mb-1 block">Ghi chú nội bộ (không gửi đến người dùng)</Label>
              <Input value={adminNote} onChange={e => setAdminNote(e.target.value)}
                placeholder="VD: Thông báo sự kiện tháng 6" className="text-sm" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Cột phải: người nhận ── */}
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">👤 Người nhận cá nhân</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Follower picker */}
            <div className="relative">
              <button
                onClick={() => setFollowerPickerOpen(v => !v)}
                className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600 hover:border-blue-400 transition-all"
              >
                <span>Chọn từ danh sách Follower...</span>
                {followerPickerOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              {followerPickerOpen && (
                <div className="absolute left-0 right-0 top-full z-30 mt-1 rounded-xl border border-slate-200 bg-white shadow-lg">
                  <div className="p-2 border-b border-slate-100">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                      <input
                        className="w-full rounded-lg border border-slate-200 pl-8 pr-3 py-2 text-xs outline-none focus:border-blue-400"
                        placeholder="Tìm tên hoặc ID..."
                        value={followerSearch}
                        onChange={e => setFollowerSearch(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="max-h-52 overflow-y-auto">
                    {filteredFollowers.length === 0 && (
                      <p className="py-4 text-center text-xs text-slate-400">
                        {followers?.length === 0 ? 'Chưa có follower. Vào tab Followers để đồng bộ.' : 'Không tìm thấy.'}
                      </p>
                    )}
                    {filteredFollowers.map(f => {
                      const checked = selectedFollowers.has(f.user_id)
                      const realName = hasRealName(f)
                      return (
                        <button
                          key={f.user_id}
                          onClick={() => setSelectedFollowers(prev => {
                            const next = new Set(prev)
                            if (checked) next.delete(f.user_id); else next.add(f.user_id)
                            return next
                          })}
                          className="flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-blue-50 transition-colors"
                        >
                          {checked ? <CheckSquare className="h-4 w-4 text-blue-500 shrink-0" /> : <Square className="h-4 w-4 text-slate-300 shrink-0" />}
                          <FollowerAvatar f={f} size={7} />
                          <div className="min-w-0">
                            <p className={cn('text-xs font-medium truncate', !realName && 'text-slate-400 italic')}>
                              {realName ? f.display_name : 'Chưa có tên'}
                            </p>
                            <p className="text-[10px] text-slate-400 font-mono">{f.user_id}</p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                  {selectedFollowers.size > 0 && (
                    <div className="p-2 border-t border-slate-100">
                      <Button size="sm" className="w-full" onClick={addFollowersToPicker}>
                        Thêm {selectedFollowers.size} người vào danh sách
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
            <Textarea
              value={recipientText}
              onChange={e => setRecipientText(e.target.value)}
              placeholder="Nhập Zalo ID, mỗi ID một dòng&#10;&#10;VD:&#10;1234567890&#10;9876543210"
              rows={4}
              className="resize-none text-sm font-mono"
            />
            <p className="text-xs text-slate-400">
              {recipientText.split('\n').filter(l => l.trim()).length} người
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">💬 Nhóm nhận</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Group picker */}
            <div className="relative">
              <button
                onClick={() => setGroupPickerOpen(v => !v)}
                className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-600 hover:border-blue-400 transition-all"
              >
                <span>Chọn nhóm từ danh sách...</span>
                {groupPickerOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>
              {groupPickerOpen && (
                <div className="absolute left-0 right-0 top-full z-30 mt-1 rounded-xl border border-slate-200 bg-white shadow-lg">
                  <div className="max-h-52 overflow-y-auto">
                    {!groups?.length && <p className="py-4 text-center text-xs text-slate-400">Chưa có nhóm. Vào tab Followers để thêm nhóm.</p>}
                    {groups?.map(g => (
                      <button
                        key={g.id}
                        onClick={() => {
                          setGroupText(prev => {
                            const existing = prev.trim()
                            if (existing.split('\n').includes(g.id)) return prev
                            return existing ? `${existing}\n${g.id}` : g.id
                          })
                          setGroupPickerOpen(false)
                        }}
                        className="flex w-full items-center gap-2.5 px-3 py-2 text-left hover:bg-blue-50 transition-colors"
                      >
                        <div>
                          <p className="text-xs font-medium">{g.name}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{g.id}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <Textarea
              value={groupText}
              onChange={e => setGroupText(e.target.value)}
              placeholder="Nhập Group ID, mỗi ID một dòng"
              rows={3}
              className="resize-none text-sm font-mono"
            />
            <p className="text-xs text-slate-400">
              {groupText.split('\n').filter(l => l.trim()).length} nhóm
            </p>
          </CardContent>
        </Card>

        {/* Send button + progress */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-600">
              Tổng: <strong className="text-slate-800">{totalRecipients}</strong> người nhận
            </span>
          </div>
          <Button
            className="w-full gap-2"
            size="lg"
            onClick={handleSend}
            disabled={sendMut.isPending || (job && !job.done)}
          >
            {sendMut.isPending || (job && !job.done)
              ? <><Loader2 className="h-4 w-4 animate-spin" /> Đang gửi...</>
              : <><Send className="h-4 w-4" /> Gửi Tin Nhắn</>
            }
          </Button>

          <div className="flex items-center gap-2 rounded-xl border border-slate-200 p-2">
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={e => setScheduledAt(e.target.value)}
              className="flex-1 rounded-lg border border-slate-200 px-2.5 py-2 text-sm outline-none focus:border-blue-400"
            />
            <Button
              variant="outline"
              className="gap-1.5 shrink-0"
              onClick={handleSchedule}
              disabled={scheduleMut.isPending}
            >
              {scheduleMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CalendarClock className="h-4 w-4" />}
              Đặt lịch gửi
            </Button>
          </div>
          {job && (
            <div className="space-y-1.5">
              <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all duration-500"
                  style={{ width: `${job.total ? ((job.sent + job.failed) / job.total) * 100 : 0}%` }}
                />
              </div>
              <p className="text-xs text-slate-500 text-center">
                {job.done ? '✅ Hoàn tất' : `${job.sent + job.failed}/${job.total}`}
                {job.sent > 0 && ` · ${job.sent} thành công`}
                {job.failed > 0 && ` · ${job.failed} thất bại`}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── FollowersTab ───────────────────────────────────────────────────────────────
function FollowersTab() {
  const qc = useQueryClient()
  const [subTab, setSubTab] = useState('followers')
  const [search, setSearch] = useState('')
  const [checkedIds, setCheckedIds] = useState(new Set())
  const [newGroup, setNewGroup] = useState({ group_id: '', name: '' })

  const { data: followersData, isLoading: fLoading } = useQuery({
    queryKey: ['broadcast-followers'],
    queryFn: () => api.get('/api/broadcast/followers').then(r => r.data),
  })
  const { data: groupsData, isLoading: gLoading } = useQuery({
    queryKey: ['broadcast-groups'],
    queryFn: () => api.get('/api/broadcast/groups').then(r => r.data),
  })

  const { data: catsData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/api/categories').then(r => r.data),
  })

  const [tokenExpired, setTokenExpired] = useState(false)

  const syncMut = useMutation({
    mutationFn: () => api.post('/api/broadcast/followers/sync').then(r => r.data),
    onSuccess: (d) => {
      setTokenExpired(false)
      qc.invalidateQueries({ queryKey: ['broadcast-followers'] })
      toast.success(`Đã đồng bộ ${d.count} follower`)
    },
    onError: (e) => {
      const code = e.response?.data?.code
      const msg  = e.response?.data?.error || 'Lỗi đồng bộ'
      if (code === 'TOKEN_EXPIRED') {
        setTokenExpired(true)
        toast.error('Token Zalo hết hạn — cập nhật token để tiếp tục')
      } else {
        toast.error(msg)
      }
    },
  })

  const addGroupMut = useMutation({
    mutationFn: () =>
      api
        .post('/api/broadcast/groups', { id: newGroup.group_id.trim(), name: newGroup.name.trim() })
        .then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['broadcast-groups'] })
      setNewGroup({ group_id: '', name: '' })
      toast.success('Đã thêm nhóm')
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Lỗi thêm nhóm'),
  })

  const removeGroupMut = useMutation({
    mutationFn: (id) => api.delete(`/api/broadcast/groups/${id}`).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['broadcast-groups'] })
      toast.success('Đã xoá nhóm')
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Lỗi xoá'),
  })

  const importCatsMut = useMutation({
    // Dùng endpoint chuyên dụng ở backend (đọc Category có zaloGroupId, khử trùng
    // theo id, lưu Redis) thay vì tự lặp POST — tránh lệch tên trường group_id/id.
    mutationFn: async () => {
      const before = (groupsData?.groups || []).length
      const { data } = await api.post('/api/broadcast/groups/import-from-categories')
      return { added: (data.groups || []).length - before }
    },
    onSuccess: ({ added }, manual) => {
      qc.invalidateQueries({ queryKey: ['broadcast-groups'] })
      if (added > 0) toast.success(`Đã thêm ${added} nhóm từ danh mục`)
      else if (manual)
        toast.message('Chưa có danh mục nào gắn Group ID. Vào "Cài đặt nhóm Zalo" gắn Group ID cho danh mục trước, hoặc thêm nhóm thủ công bên dưới.')
    },
    onError: (e, manual) => {
      if (manual) toast.error(e.response?.data?.error || 'Lỗi nhập từ danh mục')
    },
  })

  // Tự động import nhóm từ danh mục khi groups rỗng
  useEffect(() => {
    if (
      !gLoading &&
      !importCatsMut.isPending &&
      groupsData &&
      (groupsData.groups || []).length === 0 &&
      catsData?.categories?.length > 0
    ) {
      importCatsMut.mutate(false)
    }
  }, [gLoading, groupsData, catsData])

  const followers = followersData?.followers || []
  const groups = groupsData?.groups || []
  const filtered = search
    ? followers.filter(f => f.display_name?.toLowerCase().includes(search.toLowerCase()) || f.user_id?.includes(search))
    : followers

  const allChecked = filtered.length > 0 && filtered.every(f => checkedIds.has(f.user_id))

  return (
    <div className="space-y-4">
      {tokenExpired && <TokenExpiredBanner />}

      <div className="flex gap-2 rounded-2xl bg-slate-100 p-1">
        {[
          { id: 'followers', label: `Followers${followers.length ? ` (${followers.length})` : ''}` },
          { id: 'groups', label: `Nhóm${groups.length ? ` (${groups.length})` : ''}` },
        ].map(({ id, label }) => (
          <button key={id} onClick={() => setSubTab(id)}
            className={cn('flex-1 rounded-xl py-2 text-sm font-medium transition-all',
              subTab === id ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            )}>{label}</button>
        ))}
      </div>

      {subTab === 'followers' && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle className="text-base">Danh sách Follower</CardTitle>
                {followersData?.syncedAt && (
                  <p className="text-xs text-slate-400 mt-0.5">Đồng bộ lần cuối: {fmtTs(followersData.syncedAt)}</p>
                )}
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
                  <input
                    className="rounded-xl border border-slate-200 pl-8 pr-3 py-2 text-sm outline-none focus:border-blue-400 w-48"
                    placeholder="Tìm tên hoặc ID..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
                <Button variant="outline" size="sm" onClick={() => syncMut.mutate()} disabled={syncMut.isPending}>
                  {syncMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  <span className="ml-1.5">Đồng bộ</span>
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {fLoading && <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>}
            {!fLoading && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="w-8 pb-2">
                        <input type="checkbox" checked={allChecked}
                          onChange={e => {
                            if (e.target.checked) setCheckedIds(new Set(filtered.map(f => f.user_id)))
                            else setCheckedIds(new Set())
                          }}
                          className="rounded"
                        />
                      </th>
                      <th className="text-left pb-2 font-medium text-slate-500 pl-2">Người dùng</th>
                      <th className="text-left pb-2 font-medium text-slate-500">Zalo ID</th>
                      <th className="w-16 pb-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 && (
                      <tr><td colSpan={4} className="py-8 text-center text-slate-400">
                        {followers.length === 0 ? 'Chưa có dữ liệu. Nhấn "Đồng bộ" để lấy danh sách.' : 'Không tìm thấy.'}
                      </td></tr>
                    )}
                    {filtered.map(f => {
                      const realName = hasRealName(f)
                      return (
                        <tr key={f.user_id} className="border-b border-slate-50 hover:bg-slate-50/50">
                          <td className="py-2">
                            <input type="checkbox" checked={checkedIds.has(f.user_id)}
                              onChange={e => {
                                const next = new Set(checkedIds)
                                if (e.target.checked) next.add(f.user_id); else next.delete(f.user_id)
                                setCheckedIds(next)
                              }}
                              className="rounded"
                            />
                          </td>
                          <td className="py-2 pl-2">
                            <div className="flex items-center gap-2.5">
                              <FollowerAvatar f={f} size={8} />
                              <div>
                                <p className={cn('text-sm font-medium', !realName && 'text-slate-400 italic')}>
                                  {realName ? f.display_name : 'Chưa có tên'}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="py-2 font-mono text-xs text-slate-500">{f.user_id}</td>
                          <td className="py-2">
                            <button
                              onClick={() => navigator.clipboard.writeText(f.user_id).then(() => {})}
                              className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-500 hover:bg-slate-100 transition-colors"
                              title="Sao chép ID"
                            >
                              Sao chép
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {subTab === 'groups' && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Danh sách Nhóm</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between gap-2 rounded-xl bg-green-50 border border-green-200 px-3 py-2 text-xs text-green-700">
              <span>✅ Nhóm được thêm bằng Group ID từ OA Manager.</span>
              <button
                onClick={() => importCatsMut.mutate(true)}
                disabled={importCatsMut.isPending || !catsData?.categories?.length}
                className="flex items-center gap-1 shrink-0 px-2.5 py-1 rounded-md bg-green-600 text-white font-semibold hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {importCatsMut.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                Nhập từ danh mục
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Input
                placeholder="Group ID *"
                value={newGroup.group_id}
                onChange={e => setNewGroup(p => ({ ...p, group_id: e.target.value }))}
                className="text-sm font-mono sm:col-span-1"
              />
              <Input
                placeholder="Tên nhóm (tuỳ chọn)"
                value={newGroup.name}
                onChange={e => setNewGroup(p => ({ ...p, name: e.target.value }))}
                className="text-sm sm:col-span-1"
              />
              <Button
                onClick={() => addGroupMut.mutate()}
                disabled={!newGroup.group_id.trim() || addGroupMut.isPending}
                className="gap-1"
              >
                {addGroupMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                Thêm nhóm
              </Button>
            </div>

            {gLoading && <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>}
            {!gLoading && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left pb-2 font-medium text-slate-500">Tên nhóm</th>
                      <th className="text-left pb-2 font-medium text-slate-500">Group ID</th>
                      <th className="w-12 pb-2" />
                    </tr>
                  </thead>
                  <tbody>
                    {groups.length === 0 && (
                      <tr><td colSpan={3} className="py-6 text-center text-slate-400">Chưa có nhóm nào.</td></tr>
                    )}
                    {groups.map(g => (
                      <tr key={g.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                        <td className="py-2.5 font-medium">{g.name}</td>
                        <td className="py-2.5 font-mono text-xs text-slate-500">{g.id}</td>
                        <td className="py-2.5">
                          <button
                            onClick={() => removeGroupMut.mutate(g.id)}
                            disabled={removeGroupMut.isPending}
                            className="text-slate-400 hover:text-red-500 transition-colors"
                          ><Trash2 className="h-4 w-4" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}

// ── LogsTab ────────────────────────────────────────────────────────────────────
function LogsTab() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['broadcast-logs'],
    queryFn: () => api.get('/api/broadcast/logs').then(r => r.data),
  })

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Lịch sử gửi tin</CardTitle>
          <Button variant="outline" size="sm" onClick={() => qc.invalidateQueries({ queryKey: ['broadcast-logs'] })}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Tải lại
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>}
        {!isLoading && (!data?.logs?.length) && (
          <p className="py-8 text-center text-slate-400">Chưa có lịch sử gửi.</p>
        )}
        {!isLoading && data?.logs?.length > 0 && (
          <div className="space-y-2">
            {data.logs.map((log, i) => (
              <div key={i} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{log.message || '[ảnh/file/video]'}</p>
                  {log.adminNote && <p className="text-xs text-slate-400 mt-0.5">📝 {log.adminNote}</p>}
                  <p className="text-xs text-slate-400 mt-1">{fmtTs(log.timestamp)}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-sm font-bold text-slate-700">{log.recipientCount} người</p>
                  <p className="text-xs text-green-600">{log.sent} thành công</p>
                  {log.failed > 0 && <p className="text-xs text-red-500">{log.failed} thất bại</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ── ScheduledTab ───────────────────────────────────────────────────────────────
const SCHEDULED_STATUS = {
  pending:   { label: 'Chờ gửi',  className: 'text-amber-700 bg-amber-50' },
  sending:   { label: 'Đang gửi', className: 'text-sky-700 bg-sky-50' },
  sent:      { label: 'Đã gửi',   className: 'text-green-700 bg-green-50' },
  failed:    { label: 'Thất bại', className: 'text-red-700 bg-red-50' },
  cancelled: { label: 'Đã hủy',   className: 'text-slate-500 bg-slate-100' },
}

function ScheduledTab() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['broadcast-scheduled'],
    queryFn: () => api.get('/api/broadcast/scheduled').then(r => r.data),
    refetchInterval: 15_000,
  })

  const cancelMut = useMutation({
    mutationFn: (id) => api.delete(`/api/broadcast/scheduled/${id}`).then(r => r.data),
    onSuccess: () => {
      toast.success('Đã hủy lịch hẹn')
      qc.invalidateQueries({ queryKey: ['broadcast-scheduled'] })
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Lỗi hủy lịch hẹn'),
  })

  const scheduled = data?.scheduled || []

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">Lịch hẹn gửi tin</CardTitle>
          <Button variant="outline" size="sm" onClick={() => qc.invalidateQueries({ queryKey: ['broadcast-scheduled'] })}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Tải lại
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && <div className="flex justify-center py-8"><Loader2 className="h-5 w-5 animate-spin text-slate-400" /></div>}
        {!isLoading && scheduled.length === 0 && (
          <p className="py-8 text-center text-slate-400">Chưa có lịch hẹn nào.</p>
        )}
        {!isLoading && scheduled.length > 0 && (
          <div className="space-y-2">
            {scheduled.map((sm) => {
              const status = SCHEDULED_STATUS[sm.status] || SCHEDULED_STATUS.pending
              const contentPreview = sm.message
                || (sm.attachmentIds?.length ? `[${sm.attachmentIds.length} ảnh]` : '')
                || (sm.videoAttachmentId ? '[video]' : '')
                || (sm.fileAttachmentId ? '[file]' : '')
                || (sm.linkUrl ? `[link] ${sm.linkUrl}` : '')
              return (
                <div key={sm._id} className="flex items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{contentPreview || '(không có nội dung)'}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Hẹn gửi: {fmtTs(sm.scheduledAt)} · {sm.userIds?.length || 0} người nhận
                      {sm.createdBy?.fullName && ` · bởi ${sm.createdBy.fullName}`}
                    </p>
                    {sm.status === 'sent' && (
                      <p className="text-xs text-green-600 mt-0.5">{sm.result?.sent || 0} thành công{sm.result?.failed > 0 && `, ${sm.result.failed} thất bại`}</p>
                    )}
                  </div>
                  <span className={cn('text-xs font-semibold px-2 py-1 rounded-full shrink-0', status.className)}>
                    {status.label}
                  </span>
                  {sm.status === 'pending' && (
                    <button
                      onClick={() => cancelMut.mutate(sm._id)}
                      disabled={cancelMut.isPending}
                      className="text-slate-400 hover:text-red-500 transition-colors shrink-0"
                      title="Hủy lịch hẹn"
                    >
                      <Ban className="h-4 w-4" />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function MessagesPage() {
  const { user } = useAuth()
  if (user?.role !== 'superadmin') return <Navigate to="/dashboard" replace />

  const [tab, setTab] = useState('send')

  const { data: followersData } = useQuery({
    queryKey: ['broadcast-followers'],
    queryFn: () => api.get('/api/broadcast/followers').then(r => r.data),
  })
  const { data: groupsData } = useQuery({
    queryKey: ['broadcast-groups'],
    queryFn: () => api.get('/api/broadcast/groups').then(r => r.data),
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Gửi tin nhắn Zalo</h1>
        <p className="text-sm text-slate-500 mt-1">Soạn và gửi thông báo đến follower và nhóm Zalo OA</p>
      </div>

      <TabBar active={tab} onChange={setTab} />

      {tab === 'send' && (
        <SendTab
          followers={followersData?.followers}
          groups={groupsData?.groups}
          syncedAt={followersData?.syncedAt}
        />
      )}
      {tab === 'scheduled' && <ScheduledTab />}
      {tab === 'followers' && <FollowersTab />}
      {tab === 'logs' && <LogsTab />}
    </div>
  )
}
