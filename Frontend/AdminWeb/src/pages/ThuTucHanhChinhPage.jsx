import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Loader2, X, FileText } from 'lucide-react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

const MUC_DO_LABELS = { '3': 'Mức độ 3', '4': 'Mức độ 4' }

const EMPTY_FORM = {
  tenThuTuc: '', linhVuc: '', mucDo: '4', thoiGianXuLy: '', giayToCanNop: '',
  linkNopTrucTuyen: '', ghiChu: '', order: 0,
}

export default function ThuTucHanhChinhPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [q, setQ] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)

  const { data, isLoading } = useQuery({
    queryKey: ['thu-tuc-hanh-chinh', page, q],
    queryFn: () => api.get('/api/thu-tuc-hanh-chinh', { params: { page, q } }).then((r) => r.data),
  })
  const items = data?.items ?? []
  const total = data?.total ?? 0
  const pageSize = data?.pageSize ?? 20
  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const saveMutation = useMutation({
    mutationFn: (payload) =>
      editingId
        ? api.put(`/api/thu-tuc-hanh-chinh/${editingId}`, payload)
        : api.post('/api/thu-tuc-hanh-chinh', payload),
    onSuccess: () => {
      toast.success(editingId ? 'Đã cập nhật thủ tục' : 'Đã thêm thủ tục')
      resetForm()
      queryClient.invalidateQueries({ queryKey: ['thu-tuc-hanh-chinh'] })
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Lỗi lưu dữ liệu'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/api/thu-tuc-hanh-chinh/${id}`),
    onSuccess: () => {
      toast.success('Đã xoá')
      queryClient.invalidateQueries({ queryKey: ['thu-tuc-hanh-chinh'] })
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Lỗi xoá'),
  })

  function resetForm() {
    setShowForm(false)
    setEditingId(null)
    setForm(EMPTY_FORM)
  }

  function startEdit(item) {
    setEditingId(item._id)
    setForm({
      tenThuTuc: item.tenThuTuc || '', linhVuc: item.linhVuc || '',
      mucDo: item.mucDo || '4', thoiGianXuLy: item.thoiGianXuLy || '',
      giayToCanNop: item.giayToCanNop || '', linkNopTrucTuyen: item.linkNopTrucTuyen || '',
      ghiChu: item.ghiChu || '', order: item.order ?? 0,
    })
    setShowForm(true)
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.tenThuTuc) {
      toast.error('Vui lòng nhập tên thủ tục')
      return
    }
    saveMutation.mutate(form)
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><FileText className="h-6 w-6 text-primary" /> Thủ tục hành chính</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{total} thủ tục trong danh mục</p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1) }}
            placeholder="Tìm theo tên, lĩnh vực..."
            className="h-9 w-56"
          />
          <Button size="sm" onClick={() => { resetForm(); setShowForm(true) }}>
            <Plus className="h-4 w-4 mr-1" /> Thêm thủ tục
          </Button>
        </div>
      </div>

      {showForm && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">{editingId ? 'Sửa thủ tục' : 'Thêm thủ tục'}</h2>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={resetForm}><X className="h-4 w-4" /></Button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1 md:col-span-2">
              <Label className="text-xs">Tên thủ tục *</Label>
              <Input value={form.tenThuTuc} onChange={(e) => setForm((f) => ({ ...f, tenThuTuc: e.target.value }))} placeholder="VD: Đăng ký khai sinh" required />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Lĩnh vực</Label>
              <Input value={form.linhVuc} onChange={(e) => setForm((f) => ({ ...f, linhVuc: e.target.value }))} placeholder="VD: Tư pháp - Hộ tịch" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Mức độ</Label>
              <select
                value={form.mucDo}
                onChange={(e) => setForm((f) => ({ ...f, mucDo: e.target.value }))}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {Object.entries(MUC_DO_LABELS).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Thời gian xử lý</Label>
              <Input value={form.thoiGianXuLy} onChange={(e) => setForm((f) => ({ ...f, thoiGianXuLy: e.target.value }))} placeholder="VD: Trong ngày làm việc" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Thứ tự hiển thị</Label>
              <Input type="number" value={form.order} onChange={(e) => setForm((f) => ({ ...f, order: e.target.value }))} />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label className="text-xs">Giấy tờ cần nộp (mỗi dòng 1 giấy tờ)</Label>
              <Textarea value={form.giayToCanNop} onChange={(e) => setForm((f) => ({ ...f, giayToCanNop: e.target.value }))} rows={4} />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label className="text-xs">Link nộp trực tuyến</Label>
              <Input value={form.linkNopTrucTuyen} onChange={(e) => setForm((f) => ({ ...f, linkNopTrucTuyen: e.target.value }))} placeholder="https://dichvucong.gov.vn" />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label className="text-xs">Ghi chú</Label>
              <Textarea value={form.ghiChu} onChange={(e) => setForm((f) => ({ ...f, ghiChu: e.target.value }))} rows={2} />
            </div>
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
            Chưa có thủ tục nào trong danh mục
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground w-8">#</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Tên thủ tục</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Lĩnh vực</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground hidden md:table-cell">Mức độ</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground hidden md:table-cell">Thời gian xử lý</th>
                <th className="w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((it, i) => (
                <tr key={it._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-muted-foreground text-xs">{(page - 1) * pageSize + i + 1}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{it.tenThuTuc}</div>
                    {it.ghiChu && <div className="text-xs text-muted-foreground">{it.ghiChu}</div>}
                  </td>
                  <td className="px-4 py-3">{it.linhVuc || '—'}</td>
                  <td className="px-4 py-3 hidden md:table-cell">{MUC_DO_LABELS[it.mucDo] || '—'}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 hidden md:table-cell">{it.thoiGianXuLy || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => startEdit(it)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline" size="sm"
                        className="h-7 w-7 p-0 text-destructive hover:bg-destructive hover:text-white border-destructive/30"
                        onClick={() => { if (window.confirm('Xác nhận xoá thủ tục này?')) deleteMutation.mutate(it._id) }}
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

      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Trước</Button>
          <span className="text-xs text-muted-foreground">Trang {page}/{totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Sau</Button>
        </div>
      )}
    </div>
  )
}
