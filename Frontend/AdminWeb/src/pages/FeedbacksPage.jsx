import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search, ChevronLeft, ChevronRight, Loader2, Filter, Eye, Inbox } from 'lucide-react'
import { api } from '@/lib/api'
import { useAuth } from '@/contexts/AuthContext'
import StatusBadge from '@/components/feedback/StatusBadge'
import { formatDateShort } from '@/lib/utils'

const STATUS_OPTIONS = [
  { value: '',         label: 'Tất cả trạng thái' },
  { value: 'pending',  label: '⏳ Chờ xử lý' },
  { value: 'draft',    label: '📄 Chờ duyệt' },
  { value: 'resolved', label: '✅ Đã giải quyết' },
]

function SelectField({ value, onChange, children }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-400 transition-all cursor-pointer"
    >
      {children}
    </select>
  )
}

export default function FeedbacksPage() {
  const { user } = useAuth()
  const [filter, setFilter] = useState({ status: '', assignedTo: '', categoryId: '', q: '' })
  const [page, setPage] = useState(1)

  const { data, isLoading } = useQuery({
    queryKey: ['feedbacks', filter, page],
    queryFn: () => api.get('/api/feedbacks', { params: { ...filter, page } }).then((r) => r.data),
    keepPreviousData: true,
  })

  const { data: adminsData } = useQuery({
    queryKey: ['admins'],
    queryFn: () => api.get('/api/users').then((r) => r.data),
    enabled: user?.role === 'superadmin' || user?.role === 'dept_leader',
  })

  const { data: catsData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/api/categories').then((r) => r.data),
  })

  const setF = (key, value) => { setFilter((f) => ({ ...f, [key]: value })); setPage(1) }

  const feedbacks = data?.feedbacks ?? []
  const pagination = data?.pagination ?? { page: 1, totalPages: 1, total: 0 }
  const hasFilter = filter.status || filter.assignedTo || filter.categoryId || filter.q
  const isLeader = user?.role === 'superadmin' || user?.role === 'dept_leader'

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-800">Góp ý &amp; Phản ánh</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            {pagination.total > 0 ? `${pagination.total} góp ý tổng cộng` : 'Danh sách phản ánh người dân'}
          </p>
        </div>
      </div>

      {/* Filter card */}
      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-500">
            <Filter className="h-3.5 w-3.5" /> Lọc:
          </div>

          <SelectField value={filter.status} onChange={(v) => setF('status', v)}>
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </SelectField>

          {/* Lọc loại phản ánh */}
          <SelectField value={filter.categoryId} onChange={(v) => setF('categoryId', v)}>
            <option value="">Tất cả loại</option>
            {catsData?.categories?.map((c) => (
              <option key={c._id} value={c._id}>{c.icon} {c.name}</option>
            ))}
          </SelectField>

          {/* Lọc phân công — chỉ leader thấy */}
          {isLeader && (
            <SelectField value={filter.assignedTo} onChange={(v) => setF('assignedTo', v)}>
              <option value="">Tất cả phân công</option>
              <option value="none">Chưa phân công</option>
              {adminsData?.users?.map((a) => (
                <option key={a._id} value={a._id}>{a.fullName}</option>
              ))}
            </SelectField>
          )}

          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-300 pointer-events-none" />
            <input
              type="text"
              placeholder="Tìm theo tên, liên hệ, nội dung..."
              value={filter.q}
              onChange={(e) => setF('q', e.target.value)}
              className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-4 text-sm text-slate-700 placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500/25 focus:border-blue-400 transition-all"
            />
          </div>

          {hasFilter && (
            <button
              onClick={() => { setFilter({ status: '', assignedTo: '', categoryId: '', q: '' }); setPage(1) }}
              className="h-9 px-3 rounded-xl text-sm text-slate-500 hover:text-red-500 hover:bg-red-50 border border-slate-200 hover:border-red-200 transition-all font-medium"
            >
              Xóa lọc
            </button>
          )}
        </div>
      </div>

      {/* Table card */}
      <div className="rounded-2xl bg-white border border-slate-100 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center h-52 gap-3">
            <Loader2 className="h-7 w-7 animate-spin text-blue-500" />
            <p className="text-sm text-slate-400">Đang tải...</p>
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Inbox className="h-10 w-10 text-slate-200 mb-3" />
            <p className="font-semibold text-slate-500">Không có góp ý nào</p>
            <p className="text-sm text-slate-400 mt-1">Thử thay đổi bộ lọc</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'linear-gradient(135deg, #1d4ed8, #0ea5e9)' }}>
                  <th className="text-left px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-white/80 w-10">#</th>
                  <th className="text-left px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-white/80 w-24">Mã 1022</th>
                  <th className="text-left px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-white/80">Người gửi</th>
                  <th className="text-left px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-white/80">Nội dung</th>
                  <th className="text-left px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-white/80 w-28">Trạng thái</th>
                  <th className="text-left px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-white/80 hidden lg:table-cell">Loại</th>
                  {isLeader && (
                    <th className="text-left px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-white/80 w-32 hidden md:table-cell">Phân công</th>
                  )}
                  <th className="text-left px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-white/80 w-24 hidden sm:table-cell">Ngày gửi</th>
                  <th className="w-16"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {feedbacks.map((fb, i) => (
                  <tr key={fb._id} className="hover:bg-blue-50/40 transition-colors group">
                    <td className="px-4 py-3.5 text-slate-300 text-xs font-mono">
                      {(page - 1) * 20 + i + 1}
                    </td>
                    <td className="px-4 py-3.5 text-xs font-mono">
                      {fb.cgy1022?.gopyId ? (
                        <span className="text-blue-600 font-semibold">{fb.cgy1022.gopyId}</span>
                      ) : (
                        <span
                          className="text-amber-500"
                          title={fb.cgy1022?.lastError || 'Chưa đồng bộ lên Cổng góp ý 1022'}
                        >
                          chờ 1022
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 text-white text-xs font-bold shadow-sm">
                          {(fb.displayName || fb.contact || '?')[0].toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-700 truncate max-w-[120px] group-hover:text-blue-600 transition-colors">
                            {fb.displayName || '(Ẩn danh)'}
                          </p>
                          <p className="text-[11px] text-slate-400">{fb.contact}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="truncate max-w-[220px] text-slate-600">{fb.content}</p>
                      {fb.imageUrl && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 mt-0.5">
                          📷 Có ảnh
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={fb.status} />
                    </td>
                    <td className="px-4 py-3.5 text-xs text-slate-500 hidden lg:table-cell">
                      {fb.categoryId ? (
                        <span className="inline-flex items-center gap-1">
                          <span>{fb.categoryId.icon}</span>
                          <span className="truncate max-w-[120px]">{fb.categoryId.name}</span>
                        </span>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    {isLeader && (
                      <td className="px-4 py-3.5 text-xs text-slate-400 hidden md:table-cell">
                        {fb.assignedTo?.fullName ?? <span className="text-slate-300">—</span>}
                      </td>
                    )}
                    <td className="px-4 py-3.5 text-xs text-slate-400 hidden sm:table-cell">
                      {formatDateShort(fb.createdAt)}
                    </td>
                    <td className="px-4 py-3.5">
                      <Link
                        to={`/feedbacks/${fb._id}`}
                        className="inline-flex items-center gap-1 h-7 px-2.5 rounded-lg text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-100 hover:border-blue-200 transition-all"
                      >
                        <Eye className="h-3 w-3" /> Xem
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-50 bg-slate-50/50">
            <span className="text-xs text-slate-400">
              Trang <b className="text-slate-600">{pagination.page}</b> / {pagination.totalPages}
              &nbsp;·&nbsp; {pagination.total} kết quả
            </span>
            <div className="flex gap-1.5">
              <button
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-white hover:border-blue-300 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-white hover:border-blue-300 hover:text-blue-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
