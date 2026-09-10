import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, Loader2, X, Wallet } from 'lucide-react'
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

const CATEGORY_LABELS = {
  cong: 'Người có công với cách mạng',
  baotro: 'Bảo trợ xã hội hàng tháng',
  ngheo: 'Hỗ trợ hộ nghèo, cận nghèo',
  treem: 'Trợ cấp trẻ em & chính sách khác',
}

const EMPTY_FORM = {
  phuongCu: '', phuongMoi: '', ngayChiTra: '', khungGio: '', diaDiem: '', nhanVienTen: '', nhanVienSdt: '', ghiChu: '',
  loaiTroCap: 'baotro', soLuong: '', donVi: 'người', soTien: '', hinhThuc: 'cash',
}

function formatMoney(n) {
  return (n || 0).toLocaleString('vi-VN')
}

function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  const p = (n) => String(n).padStart(2, '0')
  return `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()}`
}

export default function TroCapPage() {
  const queryClient = useQueryClient()
  const [thang, setThang] = useState(now.getMonth() + 1)
  const [nam, setNam] = useState(now.getFullYear())
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)

  const { data, isLoading } = useQuery({
    queryKey: ['tro-cap', thang, nam],
    queryFn: () => api.get('/api/tro-cap', { params: { thang, nam } }).then((r) => r.data),
  })
  const items = data?.items ?? []

  const saveMutation = useMutation({
    mutationFn: (payload) =>
      editingId
        ? api.put(`/api/tro-cap/${editingId}`, payload)
        : api.post('/api/tro-cap', payload),
    onSuccess: () => {
      toast.success(editingId ? 'Đã cập nhật lịch chi trả' : 'Đã thêm lịch chi trả')
      resetForm()
      queryClient.invalidateQueries({ queryKey: ['tro-cap'] })
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Lỗi lưu dữ liệu'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/api/tro-cap/${id}`),
    onSuccess: () => {
      toast.success('Đã xoá')
      queryClient.invalidateQueries({ queryKey: ['tro-cap'] })
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
      phuongCu: item.phuongCu || '', phuongMoi: item.phuongMoi || '',
      ngayChiTra: item.ngayChiTra ? item.ngayChiTra.slice(0, 10) : '',
      khungGio: item.khungGio || '', diaDiem: item.diaDiem || '',
      nhanVienTen: item.nhanVienTen || '', nhanVienSdt: item.nhanVienSdt || '', ghiChu: item.ghiChu || '',
      loaiTroCap: item.loaiTroCap || 'baotro', soLuong: item.soLuong || '', donVi: item.donVi || 'người',
      soTien: item.soTien || '', hinhThuc: item.hinhThuc || 'cash',
    })
    setShowForm(true)
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.phuongMoi || !form.ngayChiTra || !form.diaDiem) {
      toast.error('Vui lòng nhập Phường mới, Ngày chi trả và Địa điểm')
      return
    }
    saveMutation.mutate(form)
  }

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Wallet className="h-6 w-6 text-primary" /> Lịch chi trả trợ cấp</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{items.length} lịch chi trả trong tháng {thang}/{nam}</p>
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
            <h2 className="font-semibold">{editingId ? 'Sửa lịch chi trả' : 'Thêm lịch chi trả'}</h2>
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={resetForm}><X className="h-4 w-4" /></Button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Phường cũ (nếu có)</Label>
              <Input value={form.phuongCu} onChange={(e) => setForm((f) => ({ ...f, phuongCu: e.target.value }))} placeholder="VD: Trà Liên" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Phường mới *</Label>
              <Input value={form.phuongMoi} onChange={(e) => setForm((f) => ({ ...f, phuongMoi: e.target.value }))} placeholder="VD: Xã Trà Liên" required />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Ngày chi trả *</Label>
              <Input type="date" value={form.ngayChiTra} onChange={(e) => setForm((f) => ({ ...f, ngayChiTra: e.target.value }))} required />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Khung giờ</Label>
              <Input value={form.khungGio} onChange={(e) => setForm((f) => ({ ...f, khungGio: e.target.value }))} placeholder="VD: Buổi chiều từ 13h30 đến 17h00" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Nhóm đối tượng *</Label>
              <select
                value={form.loaiTroCap}
                onChange={(e) => setForm((f) => ({ ...f, loaiTroCap: e.target.value }))}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {Object.entries(CATEGORY_LABELS).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Hình thức chi trả</Label>
              <select
                value={form.hinhThuc}
                onChange={(e) => setForm((f) => ({ ...f, hinhThuc: e.target.value }))}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="cash">Tiền mặt</option>
                <option value="bank">Qua tài khoản</option>
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Số lượng nhận</Label>
              <Input type="number" min="0" value={form.soLuong} onChange={(e) => setForm((f) => ({ ...f, soLuong: e.target.value }))} placeholder="VD: 42" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Đơn vị tính</Label>
              <Input value={form.donVi} onChange={(e) => setForm((f) => ({ ...f, donVi: e.target.value }))} placeholder="người / hộ / trẻ" />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label className="text-xs">Tổng kinh phí chi trả (đồng)</Label>
              <Input type="number" min="0" value={form.soTien} onChange={(e) => setForm((f) => ({ ...f, soTien: e.target.value }))} placeholder="VD: 128500000" />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label className="text-xs">Địa điểm chi trả *</Label>
              <Input value={form.diaDiem} onChange={(e) => setForm((f) => ({ ...f, diaDiem: e.target.value }))} placeholder="VD: Nhà văn hoá thôn..." required />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Nhân viên chi trả</Label>
              <Input value={form.nhanVienTen} onChange={(e) => setForm((f) => ({ ...f, nhanVienTen: e.target.value }))} placeholder="Họ tên" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">SĐT nhân viên</Label>
              <Input value={form.nhanVienSdt} onChange={(e) => setForm((f) => ({ ...f, nhanVienSdt: e.target.value }))} placeholder="09xxxxxxxx" />
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
            Chưa có lịch chi trả nào trong tháng {thang}/{nam}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground w-8">#</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Nhóm đối tượng</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Phường mới</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Thời gian chi trả</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Địa điểm</th>
                <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground hidden md:table-cell">Kinh phí</th>
                <th className="w-20"></th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {items.map((it, i) => (
                <tr key={it._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-muted-foreground text-xs">{i + 1}</td>
                  <td className="px-4 py-3">{CATEGORY_LABELS[it.loaiTroCap] || '—'}</td>
                  <td className="px-4 py-3 font-medium">{it.phuongMoi}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{formatDate(it.ngayChiTra)}</div>
                    {it.khungGio && <div className="text-xs text-muted-foreground">{it.khungGio}</div>}
                  </td>
                  <td className="px-4 py-3">{it.diaDiem}</td>
                  <td className="px-4 py-3 text-xs text-slate-500 hidden md:table-cell">
                    {formatMoney(it.soTien)}đ · {it.soLuong} {it.donVi}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" className="h-7 w-7 p-0" onClick={() => startEdit(it)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="outline" size="sm"
                        className="h-7 w-7 p-0 text-destructive hover:bg-destructive hover:text-white border-destructive/30"
                        onClick={() => { if (window.confirm('Xác nhận xoá lịch chi trả này?')) deleteMutation.mutate(it._id) }}
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
