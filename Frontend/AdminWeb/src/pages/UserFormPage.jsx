import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useQuery, useQueries, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Loader2, Eye, EyeOff, Users } from 'lucide-react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'

const ROLE_OPTIONS = [
  { value: 'officer',     label: 'Cán bộ phụ trách' },
  { value: 'dept_leader', label: 'Lãnh đạo phòng' },
  { value: 'superadmin',  label: 'Lãnh đạo Ủy ban (Quản trị)' },
]

export default function UserFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [showPwd, setShowPwd] = useState(false)
  const [form, setForm] = useState({
    username: '', fullName: '', password: '', role: 'officer',
    zaloUserId: '', categoryIds: [],
  })

  // Load user nếu đang edit
  const { data: userData, isLoading: loadingUser } = useQuery({
    queryKey: ['user', id],
    queryFn: () => api.get(`/api/users/${id}`).then((r) => r.data),
    enabled: isEdit,
  })

  // Load danh mục
  const { data: catsData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/api/categories').then((r) => r.data),
  })

  // Load members của từng loại đã chọn (song song)
  const memberQueries = useQueries({
    queries: form.categoryIds.map((catId) => ({
      queryKey: ['zalo-members', catId],
      queryFn: () => api.get(`/api/zalo-members/${catId}`).then((r) => r.data),
      staleTime: 60_000,
      enabled: form.categoryIds.length > 0,
    })),
  })

  // Gộp members từ tất cả loại đã chọn, bỏ trùng theo zaloUserId
  const allMembers = useMemo(() => {
    const map = new Map()
    memberQueries.forEach((q) => {
      q.data?.members?.forEach((m) => {
        if (!map.has(m.zaloUserId)) map.set(m.zaloUserId, m)
      })
    })
    return Array.from(map.values()).sort((a, b) =>
      (a.displayName || '').localeCompare(b.displayName || '', 'vi')
    )
  }, [memberQueries])

  const isMembersLoading = memberQueries.some((q) => q.isLoading)
  const hasMembersCache = allMembers.length > 0

  useEffect(() => {
    if (userData?.user) {
      const u = userData.user
      setForm({
        username: u.username,
        fullName: u.fullName,
        password: '',
        role: u.role,
        zaloUserId: u.zaloUserId || '',
        categoryIds: u.categoryIds?.map((c) => (typeof c === 'object' ? c._id : c)) || [],
      })
    }
  }, [userData])

  // Khi thay đổi loại chọn → reset zaloUserId nếu user hiện tại không còn trong danh sách
  useEffect(() => {
    if (!hasMembersCache) return
    const stillValid = allMembers.some((m) => m.zaloUserId === form.zaloUserId)
    if (!stillValid && form.zaloUserId) setForm((f) => ({ ...f, zaloUserId: '' }))
  }, [allMembers, hasMembersCache])

  const mutation = useMutation({
    mutationFn: (payload) =>
      isEdit
        ? api.put(`/api/users/${id}`, payload).then((r) => r.data)
        : api.post('/api/users', payload).then((r) => r.data),
    onSuccess: () => {
      toast.success(isEdit ? 'Đã cập nhật tài khoản' : 'Đã tạo tài khoản mới')
      queryClient.invalidateQueries({ queryKey: ['users'] })
      navigate('/users')
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Lỗi xử lý'),
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.fullName) { toast.error('Vui lòng nhập họ tên'); return }
    if (!isEdit && !form.username) { toast.error('Vui lòng nhập tên đăng nhập'); return }
    if (!isEdit && !form.password) { toast.error('Vui lòng nhập mật khẩu'); return }

    const payload = {
      fullName: form.fullName,
      role: form.role,
      zaloUserId: form.zaloUserId,
      categoryIds: form.categoryIds,
    }
    if (!isEdit) { payload.username = form.username; payload.password = form.password }
    else if (form.password) payload.password = form.password
    mutation.mutate(payload)
  }

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const toggleCategory = (catId) => {
    setForm((f) => ({
      ...f,
      categoryIds: f.categoryIds.includes(catId)
        ? f.categoryIds.filter((c) => c !== catId)
        : [...f.categoryIds, catId],
    }))
  }


  if (isEdit && loadingUser) {
    return <div className="flex items-center justify-center h-40"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
  }

  const categories = catsData?.categories ?? []

  return (
    <div className="space-y-4 animate-fade-in max-w-lg">
      <div className="flex items-center gap-3">
        <Link to="/users">
          <Button variant="outline" size="sm"><ArrowLeft className="h-4 w-4 mr-1" /> Quay lại</Button>
        </Link>
        <h1 className="text-xl font-bold">{isEdit ? `Sửa @${userData?.user?.username}` : 'Tạo tài khoản mới'}</h1>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{isEdit ? 'Chỉnh sửa thông tin' : 'Thông tin tài khoản'}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Tên đăng nhập — chỉ khi tạo mới */}
            {!isEdit && (
              <div className="space-y-1.5">
                <Label>Tên đăng nhập <span className="text-destructive">*</span></Label>
                <Input placeholder="vd: nguyenvana" value={form.username} onChange={set('username')} autoComplete="off" />
                <p className="text-xs text-muted-foreground">Chỉ dùng chữ thường, số, không dấu</p>
              </div>
            )}

            {/* Họ tên */}
            <div className="space-y-1.5">
              <Label>Họ và tên <span className="text-destructive">*</span></Label>
              <Input placeholder="vd: Nguyễn Văn A" value={form.fullName} onChange={set('fullName')} />
            </div>

            {/* Vai trò */}
            <div className="space-y-1.5">
              <Label>Vai trò</Label>
              <select
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                value={form.role}
                onChange={set('role')}
              >
                {ROLE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* Loại phản ánh phụ trách — chọn trước để load members */}
            {categories.length > 0 && (
              <div className="space-y-2">
                <Label>Loại phản ánh phụ trách</Label>
                <div className="rounded-lg border border-slate-200 divide-y divide-slate-100 overflow-hidden">
                  {categories.map((cat) => {
                    const isChecked = form.categoryIds.includes(cat._id)
                    return (
                      <div key={cat._id} className={`flex items-center justify-between px-3 py-2.5 transition-colors ${isChecked ? 'bg-blue-50' : 'hover:bg-slate-50'}`}>
                        <label className="flex items-center gap-2.5 cursor-pointer flex-1">
                          <input
                            type="checkbox"
                            className="rounded accent-blue-600"
                            checked={isChecked}
                            onChange={() => toggleCategory(cat._id)}
                          />
                          <span className="text-sm font-medium">{cat.icon} {cat.name}</span>
                        </label>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Zalo User ID — dropdown từ members khi đã chọn loại */}
            <div className="space-y-1.5">
              <Label className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-blue-500" />
                Tài khoản Zalo trong nhóm
              </Label>

              {form.categoryIds.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-2">Chọn loại phản ánh phụ trách trước để hiển thị danh sách thành viên Zalo</p>
              ) : isMembersLoading ? (
                <div className="flex items-center gap-2 h-10 px-3 rounded-md border border-input bg-slate-50 text-sm text-slate-400">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Đang tải danh sách thành viên...
                </div>
              ) : hasMembersCache ? (
                <>
                  <select
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    value={form.zaloUserId}
                    onChange={set('zaloUserId')}
                  >
                    <option value="">— Chọn thành viên Zalo —</option>
                    {allMembers.map((m) => (
                      <option key={m.zaloUserId} value={m.zaloUserId}>
                        {m.displayName || m.zaloUserId} · ID: {m.zaloUserId}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-400">{allMembers.length} thành viên từ {form.categoryIds.length} nhóm đã chọn</p>
                </>
              ) : (
                <>
                  <div className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5 text-xs text-amber-700 mb-2">
                    Chưa có dữ liệu thành viên cho nhóm này. Bấm <strong>Sync</strong> bên cạnh loại để tải về, hoặc nhập ID thủ công bên dưới.
                  </div>
                  <Input
                    placeholder="Nhập Zalo User ID thủ công (vd: 123456789)"
                    value={form.zaloUserId}
                    onChange={set('zaloUserId')}
                  />
                </>
              )}
            </div>

            {/* Mật khẩu */}
            <div className="space-y-1.5">
              <Label>Mật khẩu {!isEdit && <span className="text-destructive">*</span>}</Label>
              <div className="relative">
                <Input
                  type={showPwd ? 'text' : 'password'}
                  placeholder={isEdit ? 'Để trống nếu không đổi mật khẩu' : 'Nhập mật khẩu'}
                  className="pr-10"
                  value={form.password}
                  onChange={set('password')}
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowPwd((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {isEdit && <p className="text-xs text-muted-foreground">Để trống nếu không muốn thay đổi mật khẩu</p>}
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="submit" className="flex-1" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {isEdit ? 'Lưu thay đổi' : 'Tạo tài khoản'}
              </Button>
              <Link to="/users">
                <Button type="button" variant="outline">Hủy</Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
