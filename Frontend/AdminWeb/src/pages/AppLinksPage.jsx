import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Loader2, X, LayoutGrid } from 'lucide-react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

const SECTIONS = [
  { key: 'quick_link', label: 'Tiện ích nhanh (Trang chủ)' },
  { key: 'service', label: 'Dịch vụ (trang Dịch vụ)' },
  { key: 'portal', label: 'Cổng dịch vụ công (trang Dịch vụ)' },
]

const EMPTY_FORM = {
  section: 'quick_link', icon: '', color: '', label: '', type: '',
  description: '', badge: '', path: '', href: '', order: 0,
}

export default function AppLinksPage() {
  const queryClient = useQueryClient()
  const [section, setSection] = useState('quick_link')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)

  const { data, isLoading } = useQuery({
    queryKey: ['app-links', section],
    queryFn: () => api.get('/api/app-links', { params: { section } }).then((r) => r.data),
  })
  const items = data?.items ?? []

  const saveMutation = useMutation({
    mutationFn: (payload) =>
      editingId
        ? api.put(`/api/app-links/${editingId}`, payload)
        : api.post('/api/app-links', payload),
    onSuccess: () => {
      toast.success(editingId ? 'Đã cập nhật' : 'Đã thêm')
      resetForm()
      queryClient.invalidateQueries({ queryKey: ['app-links'] })
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Lỗi lưu dữ liệu'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/api/app-links/${id}`),
    onSuccess: () => {
      toast.success('Đã xoá')
      queryClient.invalidateQueries({ queryKey: ['app-links'] })
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Lỗi xoá'),
  })

  function resetForm() {
    setShowForm(false)
    setEditingId(null)
    setForm({ ...EMPTY_FORM, section })
  }

  function startEdit(item) {
    setEditingId(item._id)
    setForm({
      section: item.section, icon: item.icon || '', color: item.color || '',
      label: item.label || '', type: item.type || '', description: item.description || '',
      badge: item.badge || '', path: item.path || '', href: item.href || '', order: item.order ?? 0,
    })
    setShowForm(true)
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.label) {
      toast.error('Vui lòng nhập tên hiển thị')
      return
    }
    if (!form.path && !form.href) {
      toast.error('Vui lòng nhập route nội bộ (path) hoặc link ngoài (href)')
      return
    }
    saveMutation.mutate(form)
  }

  const isService = form.section === 'service'
  const isPortal = form.section === 'portal'

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><LayoutGrid className="h-6 w-6 text-primary" /> Icon &amp; liên kết MiniApp</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Quản lý icon "Tiện ích nhanh" ở Trang chủ và danh sách "Dịch vụ" / "Cổng dịch vụ công" — đổi ở đây có hiệu lực ngay, không cần build lại MiniApp.
          </p>
        </div>
        <Button size="sm" onClick={() => { resetForm(); setShowForm(true) }}>
          <Plus className="h-4 w-4 mr-1" /> Thêm mục
        </Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        {SECTIONS.map((s) => (
          <button
            key={s.key}
            type="button"
            onClick={() => setSection(s.key)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              section === s.key ? 'bg-primary text-primary-foreground border-primary' : 'border-input text-muted-foreground hover:bg-gray-50'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {showForm && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">{editingId ? 'Sửa mục' : 'Thêm mục'}</h2>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={resetForm}><X className="h-4 w-4" /></Button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Hiển thị ở</Label>
              <select
                value={form.section}
                onChange={(e) => setForm((f) => ({ ...f, section: e.target.value }))}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {SECTIONS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Tên hiển thị *</Label>
              <Input value={form.label} onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))} required />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Icon (tên trong icon-paths.js)</Label>
              <Input value={form.icon} onChange={(e) => setForm((f) => ({ ...f, icon: e.target.value }))} placeholder="VD: groups, map, description..." />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Màu (hậu tố tile-...)</Label>
              <Input value={form.color} onChange={(e) => setForm((f) => ({ ...f, color: e.target.value }))} placeholder="b, g, c, v, p, a, o, n" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Route nội bộ (path)</Label>
              <Input value={form.path} onChange={(e) => setForm((f) => ({ ...f, path: e.target.value }))} placeholder="/dan-so" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Link ngoài (href)</Label>
              <Input value={form.href} onChange={(e) => setForm((f) => ({ ...f, href: e.target.value }))} placeholder="https://..." />
            </div>
            {isService && (
              <div className="space-y-1">
                <Label className="text-xs">Loại dịch vụ</Label>
                <select
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                  className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="online">Trực tuyến</option>
                  <option value="offline">Trực tiếp</option>
                </select>
              </div>
            )}
            <div className="space-y-1">
              <Label className="text-xs">Thứ tự hiển thị</Label>
              <Input type="number" value={form.order} onChange={(e) => setForm((f) => ({ ...f, order: e.target.value }))} />
            </div>
            {isPortal && (
              <>
                <div className="space-y-1 md:col-span-2">
                  <Label className="text-xs">Mô tả ngắn</Label>
                  <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} rows={2} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Badge (vd: "Đang hoàn thiện")</Label>
                  <Input value={form.badge} onChange={(e) => setForm((f) => ({ ...f, badge: e.target.value }))} />
                </div>
              </>
            )}
            <div className="md:col-span-2 flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" size="sm" onClick={resetForm}>Huỷ</Button>
              <Button type="submit" size="sm" disabled={saveMutation.isPending}>
                {saveMutation.isPending && <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />}
                {editingId ? 'Lưu thay đổi' : 'Thêm'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      <Card className="overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
            Chưa có mục nào trong nhóm này
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground w-8">#</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Tên hiển thị</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Icon</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground hidden md:table-cell">Điều hướng</th>
                <th className="w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((it, i) => (
                <tr key={it._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-muted-foreground text-xs">{i + 1}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{it.label}</div>
                    {it.description && <div className="text-xs text-muted-foreground">{it.description}</div>}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{it.icon || '—'}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 hidden md:table-cell">
                    {it.path || it.href || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => startEdit(it)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline" size="sm"
                        className="h-7 w-7 p-0 text-destructive hover:bg-destructive hover:text-white border-destructive/30"
                        onClick={() => { if (window.confirm('Xác nhận xoá mục này?')) deleteMutation.mutate(it._id) }}
                        disabled={deleteMutation.isPending}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  )
}
