import { useEffect, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Award, Search, Loader2, X, Plus, Trash2, Save } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import { formatDate } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'

const TYPE_LABELS = {
  register: 'Đăng ký lần đầu',
  referrer: 'Giới thiệu bạn bè',
  referee: 'Nhập mã giới thiệu',
  survey: 'Khảo sát',
  feedback: 'Phản ánh được phản hồi',
  event: 'Check-in sự kiện',
  exam: 'Thi trực tuyến',
  adjust: 'Điều chỉnh thủ công',
}

const RULE_KEYS = ['register', 'referrer', 'referee', 'survey', 'feedback', 'event', 'exam']

function StatCard({ label, value }) {
  return (
    <Card className="p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
    </Card>
  )
}

function CitizenDetail({ zaloUserId, canEdit, onClose }) {
  const queryClient = useQueryClient()
  const [points, setPoints] = useState('')
  const [note, setNote] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['citizen', zaloUserId],
    queryFn: () => api.get(`/api/citizens/${zaloUserId}`).then((r) => r.data),
  })

  const adjust = useMutation({
    mutationFn: () => api.post(`/api/citizens/${zaloUserId}/adjust`, { points: Number(points), note }),
    onSuccess: () => {
      toast.success('Đã điều chỉnh điểm')
      setPoints('')
      setNote('')
      queryClient.invalidateQueries({ queryKey: ['citizen', zaloUserId] })
      queryClient.invalidateQueries({ queryKey: ['citizens'] })
      queryClient.invalidateQueries({ queryKey: ['citizen-stats'] })
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Không điều chỉnh được'),
  })

  const c = data?.citizen
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose}>
      <div
        className="h-full w-full max-w-md overflow-y-auto bg-background p-5 shadow-xl animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">Chi tiết công dân</h2>
          <button onClick={onClose} className="p-1 rounded hover:bg-muted"><X className="h-5 w-5" /></button>
        </div>

        {isLoading && <Loader2 className="h-5 w-5 animate-spin" />}
        {c && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              {c.avatar ? (
                <img src={c.avatar} alt="" className="h-14 w-14 rounded-full object-cover" />
              ) : (
                <div className="h-14 w-14 rounded-full bg-muted" />
              )}
              <div className="min-w-0">
                <p className="font-semibold truncate">{c.displayName || '(chưa có tên)'}</p>
                <p className="text-xs text-muted-foreground break-all">Zalo ID: {c.zaloUserId}</p>
              </div>
            </div>

            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-muted-foreground">Số điện thoại</dt><dd>{c.phone || '—'}</dd></div>
              <div><dt className="text-muted-foreground">Thôn/Tổ</dt><dd>{c.villageName || '—'}</dd></div>
              <div><dt className="text-muted-foreground">Tổng điểm</dt><dd className="font-bold">{c.points}</dd></div>
              <div><dt className="text-muted-foreground">Mã giới thiệu</dt><dd className="font-mono">{c.referralCode}</dd></div>
              <div><dt className="text-muted-foreground">Quan tâm OA</dt><dd>{c.followedOA ? 'Có' : 'Chưa'}</dd></div>
              <div><dt className="text-muted-foreground">Đăng ký</dt><dd>{formatDate(c.registeredAt)}</dd></div>
            </dl>

            {canEdit && (
              <div className="rounded-lg border p-3 space-y-2">
                <p className="text-sm font-semibold">Điều chỉnh điểm thủ công</p>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    placeholder="± điểm"
                    value={points}
                    onChange={(e) => setPoints(e.target.value)}
                    className="w-28"
                  />
                  <Input placeholder="Lý do (bắt buộc)" value={note} onChange={(e) => setNote(e.target.value)} />
                </div>
                <Button size="sm" disabled={adjust.isPending || !points || note.trim().length < 3} onClick={() => adjust.mutate()}>
                  {adjust.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Áp dụng'}
                </Button>
              </div>
            )}

            <div>
              <p className="text-sm font-semibold mb-2">Nhật ký điểm</p>
              {data.transactions.length === 0 && <p className="text-sm text-muted-foreground">Chưa có giao dịch.</p>}
              <ul className="divide-y rounded-lg border">
                {data.transactions.map((t) => (
                  <li key={t._id} className="flex items-center justify-between gap-3 px-3 py-2 text-sm">
                    <div className="min-w-0">
                      <p className="truncate">{t.type === 'adjust' && t.note ? t.note : TYPE_LABELS[t.type] || t.type}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(t.createdAt)}{t.createdBy ? ` · ${t.createdBy}` : ''}
                      </p>
                    </div>
                    <span className={t.points < 0 ? 'font-bold text-red-600' : 'font-bold text-green-600'}>
                      {t.points > 0 ? `+${t.points}` : t.points}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function CitizenList({ canEdit }) {
  const [q, setQ] = useState('')
  const [search, setSearch] = useState('')
  const [tier, setTier] = useState('')
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState(null)
  const limit = 20

  useEffect(() => {
    const t = setTimeout(() => { setSearch(q); setPage(1) }, 350)
    return () => clearTimeout(t)
  }, [q])

  const { data: stats } = useQuery({
    queryKey: ['citizen-stats'],
    queryFn: () => api.get('/api/citizens/stats').then((r) => r.data),
  })
  const { data: programData } = useQuery({
    queryKey: ['citizen-program'],
    queryFn: () => api.get('/api/citizens/program').then((r) => r.data),
  })
  const tiers = programData?.program?.tiers ?? []
  const tierName = (key) => tiers.find((t) => t.key === key)?.name || '—'

  const { data, isLoading } = useQuery({
    queryKey: ['citizens', search, tier, page],
    queryFn: () =>
      api.get('/api/citizens', { params: { q: search, tier, page, limit } }).then((r) => r.data),
    keepPreviousData: true,
  })
  const items = data?.items ?? []
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / limit))

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatCard label="Công dân đã đăng ký" value={stats?.total ?? '—'} />
        <StatCard label="Tổng điểm đã cấp" value={stats?.totalPoints ?? '—'} />
        {tiers.slice(0, 2).map((t) => (
          <StatCard key={t.key} label={`Hạng ${t.name}`} value={stats?.byTier?.[t.key] ?? 0} />
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Tìm theo tên, SĐT, mã giới thiệu, Zalo ID" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        <select
          className="rounded-md border bg-background px-3 text-sm"
          value={tier}
          onChange={(e) => { setTier(e.target.value); setPage(1) }}
        >
          <option value="">Tất cả hạng</option>
          {tiers.map((t) => <option key={t.key} value={t.key}>{t.name}</option>)}
        </select>
      </div>

      <Card className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="px-3 py-2">Công dân</th>
              <th className="px-3 py-2">SĐT</th>
              <th className="px-3 py-2">Thôn/Tổ</th>
              <th className="px-3 py-2">Hạng</th>
              <th className="px-3 py-2 text-right">Điểm</th>
              <th className="px-3 py-2">Đăng ký</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={6} className="px-3 py-6 text-center"><Loader2 className="h-5 w-5 animate-spin inline" /></td></tr>
            )}
            {!isLoading && items.length === 0 && (
              <tr><td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">Chưa có công dân nào.</td></tr>
            )}
            {items.map((c) => (
              <tr key={c._id} className="border-t hover:bg-muted/40 cursor-pointer" onClick={() => setSelected(c.zaloUserId)}>
                <td className="px-3 py-2">
                  <div className="flex items-center gap-2">
                    {c.avatar ? <img src={c.avatar} alt="" className="h-8 w-8 rounded-full object-cover" /> : <div className="h-8 w-8 rounded-full bg-muted" />}
                    <span className="font-medium">{c.displayName || '(chưa có tên)'}</span>
                  </div>
                </td>
                <td className="px-3 py-2">{c.phone || '—'}</td>
                <td className="px-3 py-2">{c.villageName || '—'}</td>
                <td className="px-3 py-2">{tierName(c.tierKey)}</td>
                <td className="px-3 py-2 text-right font-bold">{c.points}</td>
                <td className="px-3 py-2 text-muted-foreground">{formatDate(c.registeredAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{data?.total ?? 0} công dân</span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Trước</Button>
          <span>{page}/{totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Sau</Button>
        </div>
      </div>

      {selected && <CitizenDetail zaloUserId={selected} canEdit={canEdit} onClose={() => setSelected(null)} />}
    </div>
  )
}

function ProgramEditor({ canEdit }) {
  const queryClient = useQueryClient()
  const { data, isLoading } = useQuery({
    queryKey: ['citizen-program'],
    queryFn: () => api.get('/api/citizens/program').then((r) => r.data),
  })
  const [form, setForm] = useState(null)

  useEffect(() => {
    if (data?.program) {
      setForm({
        ...data.program,
        benefits: data.program.benefits.map((b) => ({ title: b.title, itemsText: b.items.join('\n') })),
      })
    }
  }, [data])

  const save = useMutation({
    mutationFn: () =>
      api.put('/api/citizens/program', {
        program: {
          target: form.target,
          rules: form.rules,
          tiers: form.tiers,
          benefits: form.benefits.map((b) => ({
            title: b.title,
            items: b.itemsText.split('\n').map((s) => s.trim()).filter(Boolean),
          })),
        },
      }),
    onSuccess: () => {
      toast.success('Đã lưu thể lệ và mức điểm')
      queryClient.invalidateQueries({ queryKey: ['citizen-program'] })
      queryClient.invalidateQueries({ queryKey: ['citizens'] })
      queryClient.invalidateQueries({ queryKey: ['citizen-stats'] })
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Không lưu được'),
  })

  if (isLoading || !form) return <Loader2 className="h-5 w-5 animate-spin" />

  const setRule = (key, field, value) =>
    setForm((f) => ({ ...f, rules: { ...f.rules, [key]: { ...f.rules[key], [field]: value } } }))
  const setTier = (i, field, value) =>
    setForm((f) => ({ ...f, tiers: f.tiers.map((t, idx) => (idx === i ? { ...t, [field]: value } : t)) }))
  const setBenefit = (i, field, value) =>
    setForm((f) => ({ ...f, benefits: f.benefits.map((b, idx) => (idx === i ? { ...b, [field]: value } : b)) }))
  const dis = !canEdit

  return (
    <div className="space-y-5">
      {!canEdit && (
        <p className="rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-sm px-3 py-2">
          Chỉ tài khoản Lãnh đạo Ủy ban được sửa thể lệ và mức điểm.
        </p>
      )}

      <Card className="p-4 space-y-3">
        <h3 className="font-semibold">Mức điểm theo hoạt động</h3>
        <div className="space-y-2">
          {RULE_KEYS.map((key) => {
            const r = form.rules[key]
            return (
              <div key={key} className="grid grid-cols-12 gap-2 items-center">
                <Input className="col-span-3" value={r.title} disabled={dis} onChange={(e) => setRule(key, 'title', e.target.value)} />
                <Input className="col-span-6" value={r.desc} disabled={dis} onChange={(e) => setRule(key, 'desc', e.target.value)} />
                <div className="col-span-3 flex items-center gap-1">
                  <span className="text-sm">+</span>
                  <Input type="number" min="0" value={r.points} disabled={dis} onChange={(e) => setRule(key, 'points', e.target.value)} />
                  <span className="text-sm text-muted-foreground">điểm</span>
                </div>
              </div>
            )
          })}
        </div>
        <p className="text-xs text-muted-foreground">
          Điểm "Phản ánh" được cộng khi phản ánh được phản hồi; "Được giới thiệu" là điểm cho người nhập mã.
        </p>
      </Card>

      <Card className="p-4 space-y-3">
        <h3 className="font-semibold">Phân hạng</h3>
        {form.tiers.map((t, i) => (
          <div key={t.key} className="flex items-center gap-2">
            <Input value={t.name} disabled={dis} onChange={(e) => setTier(i, 'name', e.target.value)} />
            <span className="text-sm whitespace-nowrap">từ</span>
            <Input type="number" min="0" className="w-24" value={t.min} disabled={dis} onChange={(e) => setTier(i, 'min', e.target.value)} />
            <span className="text-sm">điểm</span>
            {canEdit && form.tiers.length > 1 && (
              <button onClick={() => setForm((f) => ({ ...f, tiers: f.tiers.filter((_, idx) => idx !== i) }))} className="p-1 text-red-600">
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
        {canEdit && (
          <Button variant="outline" size="sm" onClick={() => setForm((f) => ({ ...f, tiers: [...f.tiers, { key: `tier_${f.tiers.length + 1}`, name: '', min: 0 }] }))}>
            <Plus className="h-4 w-4 mr-1" /> Thêm hạng
          </Button>
        )}
      </Card>

      <Card className="p-4 space-y-3">
        <h3 className="font-semibold">Đối tượng áp dụng</h3>
        <Textarea rows={3} value={form.target} disabled={dis} onChange={(e) => setForm((f) => ({ ...f, target: e.target.value }))} />
      </Card>

      <Card className="p-4 space-y-4">
        <h3 className="font-semibold">Quyền lợi và hình thức ghi nhận</h3>
        {form.benefits.map((b, i) => (
          <div key={i} className="space-y-2 rounded-lg border p-3">
            <div className="flex gap-2">
              <Input placeholder="Tiêu đề nhóm quyền lợi" value={b.title} disabled={dis} onChange={(e) => setBenefit(i, 'title', e.target.value)} />
              {canEdit && (
                <button onClick={() => setForm((f) => ({ ...f, benefits: f.benefits.filter((_, idx) => idx !== i) }))} className="p-1 text-red-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>
            <Label className="text-xs text-muted-foreground">Mỗi dòng là một mục</Label>
            <Textarea rows={3} value={b.itemsText} disabled={dis} onChange={(e) => setBenefit(i, 'itemsText', e.target.value)} />
          </div>
        ))}
        {canEdit && (
          <Button variant="outline" size="sm" onClick={() => setForm((f) => ({ ...f, benefits: [...f.benefits, { title: '', itemsText: '' }] }))}>
            <Plus className="h-4 w-4 mr-1" /> Thêm nhóm quyền lợi
          </Button>
        )}
      </Card>

      {canEdit && (
        <Button onClick={() => save.mutate()} disabled={save.isPending}>
          {save.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
          Lưu thể lệ
        </Button>
      )}
    </div>
  )
}

export default function CongDanPage() {
  const { user } = useAuth()
  const [tab, setTab] = useState('list')
  const isSuper = user?.role === 'superadmin'

  return (
    <div className="space-y-4 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Award className="h-6 w-6 text-primary" /> Công dân &amp; Tích điểm
        </h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Công dân tự đăng ký khi mở tab Công dân trong Mini App. Điểm được cộng khi đăng ký, giới thiệu bạn bè và khi
          phản ánh được phản hồi.
        </p>
      </div>

      <div className="flex gap-2">
        {[
          { key: 'list', label: 'Danh sách công dân' },
          { key: 'program', label: 'Thể lệ & mức điểm' },
        ].map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              tab === t.key ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-muted'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'list' ? <CitizenList canEdit={isSuper} /> : <ProgramEditor canEdit={isSuper} />}
    </div>
  )
}
