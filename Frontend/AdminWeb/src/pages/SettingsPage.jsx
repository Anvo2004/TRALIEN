import { useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2, Loader2, Users, RefreshCw, Search, X, UserCheck, Check } from 'lucide-react'
import { api } from '@/lib/api'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'

function Avatar({ name, avatar, size = 8 }) {
  const initial = (name || '?')[0].toUpperCase()
  if (avatar) {
    return (
      <img
        src={avatar}
        alt={name}
        className={`h-${size} w-${size} rounded-full object-cover shrink-0`}
        onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
      />
    )
  }
  return (
    <div className={`h-${size} w-${size} rounded-full bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center text-white text-xs font-bold shrink-0`}>
      {initial}
    </div>
  )
}

function FullScreenModal({ title, icon, onClose, children }) {
  return createPortal(
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-3 sm:p-6" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 shrink-0">
          <h2 className="text-base font-semibold text-slate-800 flex items-center gap-2">
            <span>{icon}</span> {title}
          </h2>
          <button onClick={onClose} aria-label="Đóng" className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-5">{children}</div>
      </div>
    </div>,
    document.body
  )
}

function PendingMembersModal({ cat, members, onClose, onApprove, onReject, approvingId, rejectingId }) {
  return (
    <FullScreenModal title={`Duyệt thành viên — ${cat.name}`} icon={cat.icon} onClose={onClose}>
      {members.length === 0 ? (
        <div className="text-center py-16 text-sm text-slate-400">
          <UserCheck className="h-10 w-10 mx-auto mb-3 text-slate-200" />
          Không có ai đang chờ duyệt
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-w-5xl mx-auto">
          {members.map((u) => (
            <div key={u.id} className="flex items-center justify-between gap-2 rounded-xl border border-slate-100 px-3 py-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <Avatar name={u.name} avatar={u.avatar} size={10} />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{u.name || '(Chưa quan tâm OA)'}</p>
                  <p className="text-[11px] text-slate-400 font-mono">{u.id}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => onApprove(u)}
                  disabled={approvingId === u.id || rejectingId === u.id}
                  className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-md bg-blue-100 text-blue-900 hover:bg-blue-200 transition-colors disabled:opacity-50"
                >
                  {approvingId === u.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                  Duyệt
                </button>
                <button
                  onClick={() => onReject(u)}
                  disabled={approvingId === u.id || rejectingId === u.id}
                  className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-md bg-slate-100 text-slate-500 hover:bg-red-100 hover:text-red-600 transition-colors disabled:opacity-50"
                >
                  {rejectingId === u.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
                  Từ chối
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </FullScreenModal>
  )
}

function CategoryCard({ cat, followers, onDelete }) {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [showPicker, setShowPicker] = useState(false)
  const [search, setSearch] = useState('')
  const [showPending, setShowPending] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['zalo-members', cat._id],
    queryFn: () => api.get(`/api/zalo-members/${cat._id}`).then((r) => r.data),
  })

  const { data: pendingData } = useQuery({
    queryKey: ['zalo-pending', cat._id],
    queryFn: () => api.get(`/api/zalo-members/pending/${cat._id}`).then((r) => r.data),
    refetchInterval: 30000,
  })
  const pendingMembers = pendingData?.members ?? []

  const approveMutation = useMutation({
    mutationFn: (user) => api.post(`/api/zalo-members/pending/${cat._id}/approve`, { users: [user] }).then((r) => r.data),
    onSuccess: (_, user) => {
      toast.success(`Đã duyệt ${user.name || user.id} vào nhóm`)
      queryClient.invalidateQueries({ queryKey: ['zalo-pending', cat._id] })
      queryClient.invalidateQueries({ queryKey: ['zalo-members', cat._id] })
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Lỗi duyệt thành viên'),
  })

  const rejectMutation = useMutation({
    mutationFn: (user) => api.post(`/api/zalo-members/pending/${cat._id}/reject`, { userIds: [user.id] }).then((r) => r.data),
    onSuccess: (_, user) => {
      toast.success(`Đã từ chối ${user.name || user.id}`)
      queryClient.invalidateQueries({ queryKey: ['zalo-pending', cat._id] })
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Lỗi từ chối thành viên'),
  })

  const addMutation = useMutation({
    mutationFn: (follower) =>
      api.post(`/api/zalo-members/manual/${cat._id}`, {
        displayName: follower.display_name || follower.user_id,
        zaloUserId: follower.user_id,
      }).then((r) => r.data),
    onSuccess: (_, follower) => {
      toast.success(`Đã thêm ${follower.display_name || follower.user_id}`)
      queryClient.invalidateQueries({ queryKey: ['zalo-members', cat._id] })
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Lỗi thêm'),
  })

  const deleteMutation = useMutation({
    mutationFn: (memberId) => api.delete(`/api/zalo-members/member/${memberId}`).then((r) => r.data),
    onSuccess: () => {
      toast.success('Đã xóa thành viên')
      queryClient.invalidateQueries({ queryKey: ['zalo-members', cat._id] })
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Lỗi xóa'),
  })

  const syncMutation = useMutation({
    mutationFn: () => api.post(`/api/zalo-members/sync/${cat._id}`).then((r) => r.data),
    onSuccess: (data) => {
      toast.success(`Đồng bộ xong — ${data.synced} thành viên`)
      queryClient.invalidateQueries({ queryKey: ['zalo-members', cat._id] })
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Lỗi đồng bộ'),
  })

  const members = data?.members ?? []
  const memberIds = useMemo(() => new Set(members.map((m) => m.zaloUserId)), [members])

  const filteredFollowers = useMemo(() => {
    const q = search.toLowerCase()
    return followers.filter((f) => {
      if (memberIds.has(f.user_id)) return false
      if (!q) return true
      return (
        f.display_name?.toLowerCase().includes(q) ||
        f.user_id?.includes(q)
      )
    })
  }, [followers, memberIds, search])

  return (
    <>
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <CardTitle className="text-base flex items-center gap-1.5 truncate">
                <span>{cat.icon}</span> <span className="truncate">{cat.name}</span>
              </CardTitle>
              <code className="text-[11px] text-slate-400 bg-slate-50 px-1 rounded mt-0.5 inline-block">{cat.zaloGroupId}</code>
            </div>
            <button
              type="button"
              onClick={() => {
                if (window.confirm(`Xóa nhóm "${cat.name}"? Toàn bộ ${members.length} thành viên cũng sẽ bị xóa.`)) {
                  onDelete(cat._id)
                }
              }}
              className="p-1 rounded text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors shrink-0"
              title="Xóa nhóm"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>

          <span className="text-xs bg-blue-100 text-blue-900 px-2 py-0.5 rounded-full font-medium inline-block">
            {members.length} thành viên
          </span>

          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="col-span-2 flex items-center justify-center gap-1.5 text-xs font-semibold px-2 py-1.5 rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors"
            >
              <Users className="h-3.5 w-3.5" /> Thành viên
            </button>
            <button
              type="button"
              onClick={() => setShowPending(true)}
              className={`flex items-center justify-center gap-1 text-xs font-semibold px-2 py-1.5 rounded-lg transition-colors ${pendingMembers.length > 0 ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-slate-50 text-slate-400 hover:bg-slate-100'}`}
            >
              <UserCheck className="h-3.5 w-3.5" />
              Duyệt{pendingMembers.length > 0 ? ` (${pendingMembers.length})` : ''}
            </button>
            <button
              type="button"
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending}
              className="flex items-center justify-center gap-1 text-xs font-semibold px-2 py-1.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors disabled:opacity-50"
            >
              {syncMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
              Đồng bộ
            </button>
          </div>
        </CardContent>
      </Card>

      {open && (
        <FullScreenModal title={`Thành viên nhóm — ${cat.name}`} icon={cat.icon} onClose={() => setOpen(false)}>
          <div className="max-w-2xl mx-auto space-y-3">
            {/* Nút mở picker */}
            {!showPicker && (
              <button
                type="button"
                onClick={() => setShowPicker(true)}
                className="flex items-center gap-1.5 text-xs font-semibold text-blue-800 hover:text-blue-900 px-3 py-2 rounded-lg border border-blue-100 bg-blue-50 hover:bg-blue-100 transition-colors duration-300 w-full"
              >
                <Plus className="h-3.5 w-3.5" /> Thêm thành viên vào nhóm này
              </button>
            )}

            {/* Follower picker */}
            {showPicker && (
              <div className="rounded-lg border border-blue-200 bg-blue-50/40 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-blue-900">Chọn từ danh sách follower</p>
                  <button
                    type="button"
                    onClick={() => { setShowPicker(false); setSearch('') }}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>

                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Tìm theo tên hoặc ID..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full h-8 pl-8 pr-3 rounded-md border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
                  />
                </div>

                <div className="max-h-52 overflow-y-auto rounded-md border border-slate-200 bg-white divide-y divide-slate-50">
                  {followers.length === 0 ? (
                    <p className="py-4 text-center text-xs text-slate-400">
                      Chưa có follower — đồng bộ follower ở trang Gửi tin nhắn trước
                    </p>
                  ) : filteredFollowers.length === 0 ? (
                    <p className="py-4 text-center text-xs text-slate-400">
                      {search ? 'Không tìm thấy follower phù hợp' : 'Tất cả follower đã được thêm vào nhóm này'}
                    </p>
                  ) : (
                    filteredFollowers.map((f) => {
                      const hasName = f.display_name && f.display_name !== f.user_id
                      return (
                        <button
                          key={f.user_id}
                          type="button"
                          onClick={() => addMutation.mutate(f)}
                          disabled={addMutation.isPending}
                          className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-blue-50 transition-colors text-left disabled:opacity-50"
                        >
                          <Avatar name={f.display_name} avatar={f.avatar} size={8} />
                          <div className="min-w-0 flex-1">
                            <p className={`text-sm font-medium truncate ${hasName ? 'text-slate-700' : 'text-slate-400 italic'}`}>
                              {hasName ? f.display_name : '(Chưa có tên)'}
                            </p>
                            <p className="text-[11px] text-slate-400 font-mono">{f.user_id}</p>
                          </div>
                          <Plus className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                        </button>
                      )
                    })
                  )}
                </div>
                <p className="text-[11px] text-slate-400">
                  {filteredFollowers.length} follower chưa trong nhóm · {members.length} đã trong nhóm
                </p>
              </div>
            )}

            {/* Danh sách thành viên đã thêm */}
            {isLoading ? (
              <div className="flex items-center gap-2 text-sm text-slate-400 py-2">
                <Loader2 className="h-4 w-4 animate-spin" /> Đang tải...
              </div>
            ) : members.length === 0 ? (
              <div className="text-center py-5 text-sm text-slate-400">
                <Users className="h-8 w-8 mx-auto mb-2 text-slate-200" />
                Chưa có thành viên nào
              </div>
            ) : (
              <div className="divide-y divide-slate-100 rounded-lg border border-slate-100 overflow-hidden">
                {members.map((m) => {
                  const follower = followers.find((f) => f.user_id === m.zaloUserId)
                  return (
                    <div key={m._id} className="flex items-center justify-between px-3 py-2.5 hover:bg-slate-50">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar name={m.displayName} avatar={follower?.avatar || m.avatar} size={8} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-slate-700 truncate">{m.displayName || '(Không tên)'}</p>
                          <p className="text-[11px] text-slate-400 font-mono">{m.zaloUserId}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          if (window.confirm(`Xóa ${m.displayName || m.zaloUserId} khỏi nhóm?`)) {
                            deleteMutation.mutate(m._id)
                          }
                        }}
                        disabled={deleteMutation.isPending}
                        className="p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors ml-2 shrink-0"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </FullScreenModal>
      )}

      {showPending && (
        <PendingMembersModal
          cat={cat}
          members={pendingMembers}
          onClose={() => setShowPending(false)}
          onApprove={(u) => approveMutation.mutate(u)}
          onReject={(u) => rejectMutation.mutate(u)}
          approvingId={approveMutation.isPending ? approveMutation.variables?.id : null}
          rejectingId={rejectMutation.isPending ? rejectMutation.variables?.id : null}
        />
      )}
    </>
  )
}

const ICONS = ['🏗️', '🏫', '📋', '🚔', '🌿', '💧', '🏥', '🏛️', '🔧', '📢']

export default function SettingsPage() {
  const queryClient = useQueryClient()
  const [showAddForm, setShowAddForm] = useState(false)
  const [form, setForm] = useState({ name: '', icon: '📋', zaloGroupId: '' })
  const [addMode, setAddMode] = useState('create')
  const [selectedFollowers, setSelectedFollowers] = useState([])
  const [searchFollower, setSearchFollower] = useState('')

  const { data: catsData, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/api/categories').then((r) => r.data),
  })

  const { data: followersData } = useQuery({
    queryKey: ['broadcast-followers'],
    queryFn: () => api.get('/api/broadcast/followers').then((r) => r.data),
  })

  const categories = catsData?.categories ?? []
  const followers = followersData?.followers ?? []

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/api/categories', data).then((r) => r.data),
    onSuccess: () => {
      toast.success('Đã tạo nhóm mới')
      setShowAddForm(false)
      setForm({ name: '', icon: '📋', zaloGroupId: '' })
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Lỗi tạo nhóm'),
  })

  const createGroupMutation = useMutation({
    mutationFn: (data) => api.post('/api/categories/create-zalo-group', data).then((r) => r.data),
    onSuccess: () => {
      toast.success('Đã tạo nhóm Zalo thành công')
      setShowAddForm(false)
      setForm({ name: '', icon: '📋', zaloGroupId: '' })
      setSelectedFollowers([])
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Lỗi tạo nhóm'),
  })

  const deleteCatMutation = useMutation({
    mutationFn: (id) => api.delete(`/api/categories/${id}`).then((r) => r.data),
    onSuccess: () => {
      toast.success('Đã xóa nhóm')
      queryClient.invalidateQueries({ queryKey: ['categories'] })
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Lỗi xóa nhóm'),
  })

  const availableFollowers = useMemo(() => {
    const q = searchFollower.toLowerCase()
    return followers.filter(f => {
      if (selectedFollowers.some(sf => sf.user_id === f.user_id)) return false
      if (!q) return true
      return f.display_name?.toLowerCase().includes(q) || f.user_id?.includes(q)
    })
  }, [followers, selectedFollowers, searchFollower])

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) return

    if (addMode === 'link') {
      if (!form.zaloGroupId.trim()) return
      createMutation.mutate({ ...form, order: categories.length + 1 })
    } else {
      if (selectedFollowers.length === 0) {
        return toast.error('Vui lòng chọn ít nhất 1 thành viên ban đầu (Bắt buộc theo chuẩn Zalo)')
      }
      createGroupMutation.mutate({
        name: form.name,
        icon: form.icon,
        order: categories.length + 1,
        members: selectedFollowers.map(f => ({
          userId: f.user_id,
          displayName: f.display_name,
          avatar: f.avatar,
        })),
      })
    }
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Cài đặt nhóm Zalo</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Quản lý danh sách cán bộ trong từng nhóm để phân công xử lý phản ánh
          </p>
        </div>
        {!showAddForm && (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-lg bg-blue-800 text-white hover:bg-blue-800/90 transition-colors shrink-0"
          >
            <Plus className="h-4 w-4" /> Thêm nhóm
          </button>
        )}
      </div>

      {/* Form thêm nhóm mới */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="max-w-2xl rounded-xl border border-blue-200 bg-blue-50/40 p-4 space-y-4">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAddMode('create')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors ${addMode === 'create' ? 'bg-blue-800 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
            >
              Tạo mới trên Zalo
            </button>
            <button
              type="button"
              onClick={() => setAddMode('link')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-colors ${addMode === 'link' ? 'bg-blue-800 text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
            >
              Liên kết nhóm có sẵn
            </button>
          </div>

          <div className="grid grid-cols-[auto_1fr] gap-3 items-start">
            <div className="space-y-1">
              <label className="text-xs text-slate-500 font-medium">Icon</label>
              <div className="flex flex-wrap gap-1 max-w-[160px]">
                {ICONS.map((ic) => (
                  <button
                    key={ic}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, icon: ic }))}
                    className={`h-8 w-8 rounded-md text-base transition-colors ${form.icon === ic ? 'bg-blue-200 ring-2 ring-blue-600' : 'bg-white hover:bg-blue-100'}`}
                  >
                    {ic}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs text-slate-500 font-medium">Tên nhóm</label>
                <input
                  type="text"
                  placeholder="VD: Môi trường, Hạ tầng..."
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                  className="w-full h-9 px-3 rounded-md border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
                />
              </div>

              {addMode === 'link' ? (
                <div className="space-y-1">
                  <label className="text-xs text-slate-500 font-medium">Zalo Group ID</label>
                  <input
                    type="text"
                    placeholder="VD: 6f2ab62e124cfb12a25d"
                    value={form.zaloGroupId}
                    onChange={(e) => setForm((f) => ({ ...f, zaloGroupId: e.target.value }))}
                    required={addMode === 'link'}
                    className="w-full h-9 px-3 rounded-md border border-slate-200 bg-white text-sm font-mono focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Sử dụng cách này nếu bạn đã tạo nhóm thủ công trên app Zalo.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <label className="text-xs text-slate-500 font-medium">Thành viên ban đầu (Chọn ≥ 1, bắt buộc phải có Admin OA)</label>

                  {/* Danh sách đang chọn */}
                  {selectedFollowers.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 p-2 bg-white rounded-md border border-slate-200 min-h-[38px]">
                      {selectedFollowers.map(f => (
                        <div key={f.user_id} className="flex items-center gap-1.5 bg-blue-50 text-blue-900 px-2 py-1 rounded-md text-[11px] font-medium border border-blue-100">
                          <Avatar name={f.display_name} avatar={f.avatar} size={4} />
                          <span className="truncate max-w-[100px]">{f.display_name || f.user_id}</span>
                          <button type="button" onClick={() => setSelectedFollowers(prev => prev.filter(x => x.user_id !== f.user_id))} className="text-blue-600 hover:text-blue-800">
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Tìm kiếm */}
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Tìm follower để thêm..."
                      value={searchFollower}
                      onChange={(e) => setSearchFollower(e.target.value)}
                      className="w-full h-8 pl-8 pr-3 rounded-md border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-600"
                    />
                  </div>

                  {/* Danh sách tìm được */}
                  {searchFollower && availableFollowers.length > 0 && (
                    <div className="max-h-40 overflow-y-auto rounded-md border border-slate-200 bg-white divide-y divide-slate-50">
                      {availableFollowers.map(f => (
                        <button
                          key={f.user_id}
                          type="button"
                          onClick={() => { setSelectedFollowers(p => [...p, f]); setSearchFollower('') }}
                          className="w-full flex items-center gap-2.5 px-3 py-1.5 hover:bg-blue-50 transition-colors text-left"
                        >
                          <Avatar name={f.display_name} avatar={f.avatar} size={6} />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium text-slate-700 truncate">{f.display_name || '(Không tên)'}</p>
                          </div>
                          <Plus className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}
                  {searchFollower && availableFollowers.length === 0 && (
                    <p className="text-xs text-slate-400 py-1">Không tìm thấy follower nào.</p>
                  )}
                  <p className="text-[11px] text-slate-400 italic mt-1">Zalo yêu cầu ít nhất 1 người phải là Quản trị viên (Admin) của OA.</p>
                </div>
              )}
            </div>
          </div>

          <div className="flex gap-2 justify-end border-t border-blue-100/50 mt-3 pt-3">
            <button
              type="button"
              onClick={() => { setShowAddForm(false); setForm({ name: '', icon: '📋', zaloGroupId: '' }); setSelectedFollowers([]) }}
              className="px-3 py-1.5 rounded-md text-sm text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={addMode === 'link' ? createMutation.isPending : createGroupMutation.isPending}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm font-semibold bg-blue-800 text-white hover:bg-blue-800/90 transition-colors disabled:opacity-50"
            >
              {(addMode === 'link' ? createMutation.isPending : createGroupMutation.isPending) ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
              {addMode === 'link' ? 'Liên kết nhóm' : 'Tạo nhóm Zalo'}
            </button>
          </div>
        </form>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="h-6 w-6 animate-spin text-blue-800" />
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-12 text-sm text-slate-400">
          <Users className="h-10 w-10 mx-auto mb-3 text-slate-200" />
          Chưa có nhóm nào — nhấn "Thêm nhóm" để tạo
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <CategoryCard
              key={cat._id}
              cat={cat}
              followers={followers}
              onDelete={(id) => deleteCatMutation.mutate(id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}
