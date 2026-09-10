import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import {
  Inbox, Clock, Cog, CheckCircle2, TrendingUp, RefreshCw,
  MessageSquare, Send, Settings, Users, Eye, ArrowUpRight,
  MapPin, ArrowUp,
} from 'lucide-react'
import { api } from '@/lib/api'
import StatusBadge from '@/components/feedback/StatusBadge'
import { formatDateShort } from '@/lib/utils'

const QUICK_ACTIONS = [
  { to: '/feedbacks',                  label: 'Góp ý & Phản ánh', icon: MessageSquare, color: '#2563eb', light: 'linear-gradient(135deg,#dbeafe,#bfdbfe)' },
  { to: '/messages',                   label: 'Gửi tin Zalo',     icon: Send,          color: '#0891b2', light: 'linear-gradient(135deg,#cffafe,#a5f3fc)' },
  { to: '/settings',                   label: 'Cài đặt nhóm',     icon: Settings,      color: '#7c3aed', light: 'linear-gradient(135deg,#ede9fe,#ddd6fe)' },
  { to: '/users',                      label: 'Tài khoản Admin',  icon: Users,         color: '#ea580c', light: 'linear-gradient(135deg,#ffedd5,#fed7aa)' },
  { to: '/feedbacks?status=pending',   label: 'Chờ xử lý',        icon: Clock,         color: '#d97706', light: 'linear-gradient(135deg,#fef3c7,#fde68a)' },
  { to: '/feedbacks?status=resolved',  label: 'Đã xử lý',         icon: CheckCircle2,  color: '#16a34a', light: 'linear-gradient(135deg,#dcfce7,#bbf7d0)' },
]

/* ── Count-up animation ──────────────────────────────────────────────────── */
function useCountUp(target, duration = 1200) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    const end = Number(target)
    if (!Number.isFinite(end)) { setVal(0); return }
    let raf
    const start = performance.now()
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setVal(Math.round(eased * end))
      if (t < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, duration])
  return val
}

/* ── KPI card ────────────────────────────────────────────────────────────── */
function KpiCard({ label, value, icon: Icon, color, light, footText, footColor, footIcon: FootIcon, loading }) {
  const n = useCountUp(loading ? 0 : (value ?? 0), 1300)
  const display = loading ? '—' : n.toLocaleString('vi-VN')
  return (
    <div className="card-hover bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[.08em] text-slate-400">{label}</p>
          <p className="text-[2.4rem] font-black mt-2 leading-none" style={{ color }}>{display}</p>
        </div>
        <div
          className="shrink-0 rounded-2xl flex items-center justify-center"
          style={{ width: 52, height: 52, background: light, boxShadow: `inset 0 0 0 1px ${color}22` }}
        >
          <Icon size={24} style={{ color }} />
        </div>
      </div>
      <div className="mt-3.5 flex items-center gap-1.5 text-xs font-semibold" style={{ color: footColor || '#64748b' }}>
        {FootIcon
          ? <FootIcon size={14} />
          : <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
        }
        {footText}
      </div>
    </div>
  )
}

/* ── Custom tooltip cho biểu đồ ─────────────────────────────────────────── */
const ChartTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="rounded-xl bg-white shadow-lg border border-slate-100 px-4 py-3 text-sm">
        <p className="font-semibold text-slate-700">{label}</p>
        <p className="text-blue-600 font-bold mt-0.5">{payload[0].value} góp ý</p>
      </div>
    )
  }
  return null
}

/* ── Main ────────────────────────────────────────────────────────────────── */
export default function DashboardPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['stats'],
    queryFn: () => api.get('/api/stats').then((r) => r.data),
    refetchInterval: 60_000,
  })

  const stats       = data?.stats ?? {}
  const total       = Number(stats.total)      || 0
  const pending     = Number(stats.pending)    || 0
  const processing  = Number(stats.processing) || 0
  const done        = Number(stats.done)       || 0

  const heroCount = useCountUp(isLoading ? 0 : total, 1500)

  const chartData = (data?.chartDays || []).map((day, i) => ({
    name: day,
    count: data?.chartCounts?.[i] ?? 0,
  }))

  if (error) {
    return (
      <div className="rounded-2xl bg-red-50 border border-red-100 p-6 text-center">
        <p className="text-red-600 font-medium">Lỗi tải dữ liệu: {error.message}</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">

      {/* ── Heading ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[1.7rem] font-extrabold text-slate-800 tracking-tight">
            Tổng quan hệ thống
          </h1>
          <p className="text-sm text-slate-400 mt-1.5 flex items-center gap-1.5">
            <MapPin size={14} /> UBND Xã Trà Liên
          </p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isLoading}
          className="p-2.5 rounded-xl border border-slate-200 bg-white text-blue-600 hover:shadow-md hover:shadow-blue-500/15 transition-all disabled:opacity-50"
          title="Làm mới dữ liệu"
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* ── Hero card ── */}
      <div className="relative rounded-3xl overflow-hidden px-9 py-8 shadow-xl shadow-slate-200/70 bg-white border border-slate-100">
        {/* Glow blobs */}
        <div className="absolute -top-24 right-16 w-80 h-80 rounded-full pointer-events-none"
             style={{ background: 'radial-gradient(circle,rgba(37, 99, 235,.20),transparent 65%)', animation: 'heroGlow 9s ease-in-out infinite' }} />
        <div className="absolute -bottom-28 -right-10 w-72 h-72 rounded-full pointer-events-none"
             style={{ background: 'radial-gradient(circle,rgba(234,88,12,.18),transparent 68%)', animation: 'heroGlow2 11s ease-in-out infinite' }} />
        <div className="absolute -top-16 left-1/3 w-64 h-64 rounded-full pointer-events-none"
             style={{ background: 'radial-gradient(circle,rgba(251,191,36,.18),transparent 70%)', animation: 'heroGlow 13s ease-in-out infinite' }} />
        {/* Dot grid */}
        <div className="absolute inset-0 pointer-events-none opacity-50"
             style={{ backgroundImage: 'radial-gradient(rgba(37, 99, 235,.06) 1px,transparent 1px)', backgroundSize: '22px 22px' }} />

        <div className="relative z-10 flex items-end justify-between flex-wrap gap-7">
          <div>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-[13px] font-semibold text-blue-700">
              <span className="w-2 h-2 rounded-full bg-blue-500 ring-4 ring-blue-500/20 animate-pulse-soft" />
              Tổng góp ý & phản ánh đang quản lý
            </span>
            <div className="flex items-baseline gap-3.5 mt-3.5">
              <span
                className="text-[5.5rem] font-black leading-[.85] tracking-tight"
                style={{ background: 'linear-gradient(135deg,#1d4ed8,#2563eb,#0ea5e9)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}
              >
                {isLoading ? '…' : heroCount.toLocaleString('vi-VN')}
              </span>
              <span className="text-lg font-semibold text-slate-500">góp ý</span>
            </div>
            <p className="text-sm text-slate-400 mt-3">Cập nhật mới nhất — UBND Xã Trà Liên</p>
          </div>

          <div className="flex gap-3.5 flex-wrap">
            {[
              { icon: Clock,        label: 'Chờ xử lý',  val: pending,    color: '#d97706', light: 'linear-gradient(135deg,#fef3c7,#fde68a)' },
              { icon: Cog,          label: 'Đang xử lý', val: processing, color: '#0891b2', light: 'linear-gradient(135deg,#cffafe,#a5f3fc)' },
              { icon: CheckCircle2, label: 'Hoàn thành', val: done,       color: '#16a34a', light: 'linear-gradient(135deg,#dcfce7,#bbf7d0)' },
            ].map(s => (
              <div key={s.label} className="px-5 py-4 rounded-2xl border border-slate-100 min-w-[120px]" style={{ background: s.light }}>
                <div className="flex items-center gap-1.5 text-[13px] font-semibold" style={{ color: s.color }}>
                  <s.icon size={14} /> {s.label}
                </div>
                <div className="text-2xl font-black mt-1.5" style={{ color: s.color }}>
                  {isLoading ? '…' : s.val.toLocaleString('vi-VN')}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Thao tác nhanh ── */}
      <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
        <p className="text-sm font-bold text-slate-800 mb-4">Thao tác nhanh</p>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {QUICK_ACTIONS.map(qa => (
            <Link key={qa.to} to={qa.to} className="quick-action group">
              <div className="quick-action-icon" style={{ background: qa.light }}>
                <qa.icon size={18} style={{ color: qa.color }} />
              </div>
              <span className="quick-action-label">{qa.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* ── KPI cards ── */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <KpiCard
          label="Tổng cộng" value={total} loading={isLoading}
          icon={Inbox} color="#2563eb" light="linear-gradient(135deg,#dbeafe,#bfdbfe)"
          footText="Toàn bộ góp ý & phản ánh" footColor="#2563eb" footIcon={ArrowUp}
        />
        <KpiCard
          label="Chờ xử lý" value={pending} loading={isLoading}
          icon={Clock} color="#d97706" light="linear-gradient(135deg,#fef3c7,#fde68a)"
          footText="Cần xử lý sớm" footColor="#d97706"
        />
        <KpiCard
          label="Đang xử lý" value={processing} loading={isLoading}
          icon={Cog} color="#0891b2" light="linear-gradient(135deg,#cffafe,#a5f3fc)"
          footText="Đang trong quá trình" footColor="#0891b2"
        />
        <KpiCard
          label="Đã hoàn thành" value={done} loading={isLoading}
          icon={CheckCircle2} color="#16a34a" light="linear-gradient(135deg,#dcfce7,#bbf7d0)"
          footText="Đã giải quyết xong" footColor="#16a34a" footIcon={ArrowUp}
        />
      </div>

      {/* ── Biểu đồ + Góp ý mới nhất ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Bar chart 7 ngày */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-base font-bold text-slate-800">Góp ý 7 ngày qua</p>
              <p className="text-xs text-slate-400 mt-0.5">Thống kê số lượng theo ngày</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400">
              <span className="w-3 h-3 rounded-[3px]" style={{ background: 'linear-gradient(135deg,#60a5fa,#2563eb)' }} />
              Số góp ý
            </div>
          </div>
          {isLoading || chartData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-72 rounded-xl bg-slate-50 border border-dashed border-slate-200">
              <TrendingUp size={28} className="text-slate-300 mb-2" />
              <p className="text-sm text-slate-400">{isLoading ? 'Đang tải...' : 'Chưa có dữ liệu'}</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={288}>
              <BarChart data={chartData} barGap={10} barCategoryGap="32%" margin={{ top: 24, right: 8, left: -16, bottom: 0 }}>
                <defs>
                  <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#60a5fa" />
                    <stop offset="100%" stopColor="#1d4ed8" />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="4 4" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 13, fontWeight: 600, fill: '#475569' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={36} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(37, 99, 235,0.06)', radius: 6 }} />
                <Bar dataKey="count" fill="url(#barGrad)" radius={[8, 8, 0, 0]} maxBarSize={56} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Góp ý mới nhất */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col">
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-50">
            <p className="text-base font-bold text-slate-800">Góp ý mới nhất</p>
            <Link to="/feedbacks" className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors">
              Xem tất cả <ArrowUpRight size={13} />
            </Link>
          </div>

          {isLoading ? (
            <div className="flex-1 flex items-center justify-center py-10 text-sm text-slate-400">Đang tải...</div>
          ) : !data?.recent?.length ? (
            <div className="flex-1 flex flex-col items-center justify-center py-12 px-5 text-center">
              <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center mb-3">
                <Inbox size={22} className="text-slate-300" />
              </div>
              <p className="text-sm font-semibold text-slate-400">Chưa có góp ý nào</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
              {data.recent.map((fb) => {
                const name = fb.displayName || fb.contact || '?'
                const initial = name[0].toUpperCase()
                return (
                  <Link
                    key={fb._id}
                    to={`/feedbacks/${fb._id}`}
                    className="flex items-start gap-3 px-5 py-3.5 hover:bg-blue-50/50 transition-colors group"
                  >
                    {fb.avatar ? (
                      <img
                        src={fb.avatar}
                        alt={name}
                        referrerPolicy="no-referrer"
                        className="h-8 w-8 shrink-0 rounded-full object-cover shadow-sm"
                        onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }}
                      />
                    ) : null}
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white text-xs font-bold shadow-sm"
                      style={{ background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', display: fb.avatar ? 'none' : 'flex' }}
                    >
                      {initial}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate text-slate-700 group-hover:text-blue-600 transition-colors">
                        {fb.displayName || '(Ẩn danh)'}
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono">{fb.contact}</p>
                      <p className="text-xs text-slate-400 truncate mt-0.5">{fb.content}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <StatusBadge status={fb.status} />
                      <p className="text-[11px] text-slate-300">{formatDateShort(fb.createdAt)}</p>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── Phân tích trạng thái ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Tổng kết trạng thái */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <p className="text-base font-bold text-slate-800">Phân tích trạng thái</p>
          <p className="text-xs text-slate-400 mt-0.5">Tỷ lệ xử lý góp ý & phản ánh</p>
          <div className="grid grid-cols-2 gap-3 mt-5">
            {[
              { label: 'Chờ xử lý',  val: pending,    color: '#d97706', bg: 'linear-gradient(135deg,#fef3c7,#fde68a)', border: '#fde68a' },
              { label: 'Đang xử lý', val: processing, color: '#0891b2', bg: 'linear-gradient(135deg,#cffafe,#a5f3fc)', border: '#a5f3fc' },
              { label: 'Hoàn thành', val: done,       color: '#16a34a', bg: 'linear-gradient(135deg,#dcfce7,#bbf7d0)', border: '#bbf7d0' },
              { label: 'Tổng cộng',  val: total,      color: '#2563eb', bg: 'linear-gradient(135deg,#dbeafe,#bfdbfe)', border: '#bfdbfe' },
            ].map(s => (
              <div key={s.label} className="rounded-xl p-4" style={{ background: s.bg, border: `1px solid ${s.border}` }}>
                <p className="text-xs font-semibold" style={{ color: s.color }}>{s.label}</p>
                <p className="text-2xl font-black mt-1" style={{ color: s.color }}>
                  {isLoading ? '…' : s.val.toLocaleString('vi-VN')}
                </p>
                {total > 0 && s.label !== 'Tổng cộng' && (
                  <p className="text-[11px] mt-0.5" style={{ color: s.color, opacity: 0.7 }}>
                    {((s.val / total) * 100).toFixed(1)}%
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Tiến độ xử lý */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm">
          <p className="text-base font-bold text-slate-800">Tiến độ xử lý</p>
          <p className="text-xs text-slate-400 mt-0.5">Tỷ lệ hoàn thành so với tổng góp ý</p>
          <div className="mt-6 space-y-5">
            {[
              { label: 'Hoàn thành',  val: done,       total, color: '#16a34a', bg: '#dcfce7' },
              { label: 'Đang xử lý', val: processing,  total, color: '#0891b2', bg: '#cffafe' },
              { label: 'Chờ xử lý',  val: pending,     total, color: '#d97706', bg: '#fef3c7' },
            ].map(s => {
              const pct = s.total > 0 ? Math.round((s.val / s.total) * 100) : 0
              return (
                <div key={s.label}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-semibold text-slate-600">{s.label}</span>
                    <span className="font-black" style={{ color: s.color }}>{isLoading ? '…' : `${s.val} (${pct}%)`}</span>
                  </div>
                  <div className="h-2.5 rounded-full overflow-hidden" style={{ background: s.bg }}>
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{ width: isLoading ? '0%' : `${pct}%`, background: s.color }}
                    />
                  </div>
                </div>
              )
            })}
          </div>

          {total > 0 && (
            <div className="mt-6 flex items-center gap-3 rounded-xl bg-slate-50 border border-slate-100 px-4 py-3">
              <Eye size={16} className="text-slate-400 shrink-0" />
              <p className="text-sm text-slate-500">
                Tỷ lệ hoàn thành:{' '}
                <strong className="text-emerald-600">
                  {((done / total) * 100).toFixed(1)}%
                </strong>
                {' '}· còn{' '}
                <strong className="text-amber-600">{pending + processing}</strong>
                {' '}góp ý cần xử lý
              </p>
            </div>
          )}
        </div>
      </div>

    </div>
  )
}
