const STATUS = {
  pending: {
    label: 'Chờ xử lý',
    className: 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-100',
    dot: 'bg-amber-400',
  },
  draft: {
    label: 'Chờ duyệt',
    className: 'bg-sky-50 text-sky-700 border-sky-200 ring-sky-100',
    dot: 'bg-sky-400 animate-pulse',
  },
  resolved: {
    label: 'Đã giải quyết',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-100',
    dot: 'bg-emerald-400',
  },
  // Legacy
  processing: {
    label: 'Đang xử lý',
    className: 'bg-sky-50 text-sky-700 border-sky-200 ring-sky-100',
    dot: 'bg-sky-400 animate-pulse',
  },
  done: {
    label: 'Đã xử lý',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-100',
    dot: 'bg-emerald-400',
  },
}

export default function StatusBadge({ status }) {
  const cfg = STATUS[status] ?? {
    label: status,
    className: 'bg-slate-50 text-slate-600 border-slate-200',
    dot: 'bg-slate-400',
  }

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap ${cfg.className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  )
}
