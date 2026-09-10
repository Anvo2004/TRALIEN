import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Loader2, X, Stethoscope } from 'lucide-react'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1)
const now = new Date()
const YEARS = [now.getFullYear() - 1, now.getFullYear(), now.getFullYear() + 1]

const LOAI_HINH_LABELS = {
  kham_benh: 'Khám bệnh',
  tiem_chung: 'Tiêm chủng',
  khac: 'Khác',
}

const EMPTY_FORM = {
  ngayKham: '', khungGio: '', diaDiem: '', loaiHinh: 'kham_benh', donViThucHien: '', doiTuong: '', ghiChu: '',
}

function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  const p = (n) => String(n).padStart(2, '0')
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`
}

export default function LichYTePage() {
  const queryClient = useQueryClient()
  const [thang, setThang] = useState(now.getMonth() + 1)
  const [nam, setNam] = useState(now.getFullYear())
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)

  const { data, isLoading } = useQuery({
    queryKey: ['lich-y-te', thang, nam],
    queryFn: () => api.get('/api/lich-y-te', { params: { thang, nam } }).then((r) => r.data),
  })
  const items = data?.items ?? []

  const saveMutation = useMutation({
    mutationFn: (payload) =>
      editingId
        ? api.put(`/api/lich-y-te/${editingId}`, payload)
        : api.post('/api/lich-y-te', payload),
    onSuccess: () => {
      toast.success(editingId ? 'Đã cập nhật lịch y tế' : 'Đã thêm lịch y tế')
      resetForm()
      queryClient.invalidateQueries({ queryKey: ['lich-y-te'] })
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Lỗi lưu dữ liệu'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/api/lich-y-te/${id}`),
    onSuccess: () => {
      toast.success('Đã xoá')
      queryClient.invalidateQueries({ queryKey: ['lich-y-te'] })
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
      ngayKham: item.ngayKham ? item.ngayKham.slice(0, 10) : '',
      khungGio: item.khungGio || '', diaDiem: item.diaDiem || '',
      loaiHinh: item.loaiHinh || 'kham_benh', donViThucHien: item.donViThucHien || '',
      doiTuong: item.doiTuong || '', ghiChu: item.ghiChu || '',
    })
    setShowForm(true)
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.ngayKham || !form.diaDiem) {
      toast.error('Vui lòng nhập Ngày khám và Địa điểm')
      return
    }
    saveMutation.mutate(form)
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Stethoscope className="h-6 w-6 text-primary" /> Lịch y tế</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{items.length} lịch trong tháng {thang}/{nam}</p>
        </div>
        <div className="flex items-center gap-2">
          <select value={thang} onChange={(e) => setThang(Number(e.target.value))} className="h-9 rounded-md border border-input bg-background px-2 text-sm">
            {MONTHS.map((m) => <option key={m} value={m}>Tháng {m}</option>)}
          </select>
          <select value={nam} onChange={(e) => setNam(Number(e.target.value))} className="h-9 rounded-md border border-input bg-background px-2 text-sm">
            {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <Button size="sm" onClick={() => { resetForm(); setShowForm(true) }}>
            <Plus className="h-4 w-4 mr-1" /> Thêm lịch
          </Button>
        </div>
      </div>

      {showForm && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold">{editingId ? 'Sửa lịch y tế' : 'Thêm lịch y tế'}</h2>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={resetForm}><X className="h-4 w-4" /></Button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Ngày khám *</Label>
              <Input type="date" value={form.ngayKham} onChange={(e) => setForm((f) => ({ ...f, ngayKham: e.target.value }))} required />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Khung giờ</Label>
              <Input value={form.khungGio} onChange={(e) => setForm((f) => ({ ...f, khungGio: e.target.value }))} placeholder="VD: Buổi sáng từ 7h30 đến 11h00" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Loại hình *</Label>
              <select
                value={form.loaiHinh}
                onChange={(e) => setForm((f) => ({ ...f, loaiHinh: e.target.value }))}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {Object.entries(LOAI_HINH_LABELS).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Đơn vị thực hiện</Label>
              <Input value={form.donViThucHien} onChange={(e) => setForm((f) => ({ ...f, donViThucHien: e.target.value }))} placeholder="VD: Trạm y tế xã" />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label className="text-xs">Địa điểm *</Label>
              <Input value={form.diaDiem} onChange={(e) => setForm((f) => ({ ...f, diaDiem: e.target.value }))} placeholder="VD: Nhà văn hoá thôn..." required />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label className="text-xs">Đối tượng</Label>
              <Input value={form.doiTuong} onChange={(e) => setForm((f) => ({ ...f, doiTuong: e.target.value }))} placeholder="VD: Trẻ em dưới 5 tuổi, Người cao tuổi..." />
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
            Chưa có lịch y tế nào trong tháng {thang}/{nam}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground w-8">#</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Thời gian</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Loại hình</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Địa điểm</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground hidden md:table-cell">Đơn vị / Đối tượng</th>
                <th className="w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((it, i) => (
                <tr key={it._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-muted-foreground text-xs">{i + 1}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{formatDate(it.ngayKham)}</div>
                    {it.khungGio && <div className="text-xs text-muted-foreground">{it.khungGio}</div>}
                  </td>
                  <td className="px-4 py-3">{LOAI_HINH_LABELS[it.loaiHinh] || '—'}</td>
                  <td className="px-4 py-3">{it.diaDiem}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 hidden md:table-cell">
                    {[it.donViThucHien, it.doiTuong].filter(Boolean).join(' · ') || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => startEdit(it)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline" size="sm"
                        className="h-7 w-7 p-0 text-destructive hover:bg-destructive hover:text-white border-destructive/30"
                        onClick={() => { if (window.confirm('Xác nhận xoá lịch y tế này?')) deleteMutation.mutate(it._id) }}
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
