import { NavLink } from 'react-router-dom'
import { LayoutDashboard, MessageSquare, Users, LogOut, Settings, Send, Wallet, Stethoscope, FileText, LayoutGrid } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'
import logoImg from '@/images/logotralien.jpg'

const ROLE_LABELS = {
  superadmin:  'Lãnh đạo Ủy ban',
  dept_leader: 'Lãnh đạo phòng',
  officer:     'Cán bộ phụ trách',
  staff:       'Nhân viên',
}

function NavItem({ to, icon: Icon, label }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200 group',
          isActive
            ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow-md shadow-blue-900/30'
            : 'text-slate-400 hover:bg-white/8 hover:text-white'
        )
      }
    >
      {({ isActive }) => (
        <>
          <span className={cn(
            'flex h-7 w-7 items-center justify-center rounded-lg transition-all',
            isActive ? 'bg-white/20' : 'bg-white/5 group-hover:bg-white/10'
          )}>
            <Icon className="h-4 w-4 shrink-0" />
          </span>
          {label}
        </>
      )}
    </NavLink>
  )
}

export default function Sidebar() {
  const { user, logout } = useAuth()

  return (
    <aside
      className="fixed inset-y-0 left-0 z-50 flex w-64 flex-col"
      style={{ background: 'linear-gradient(180deg, #0c1a42 0%, #16348a 35%, #1d4ed8 70%, #0c1a42 100%)' }}
    >
      {/* Decorative circles */}
      <div className="pointer-events-none absolute -top-12 -left-12 h-40 w-40 rounded-full bg-blue-600/10" />
      <div className="pointer-events-none absolute top-32 -right-8 h-24 w-24 rounded-full bg-cyan-500/5" />

      {/* Brand */}
      <div className="relative flex items-center gap-3 px-5 py-5 border-b border-white/8">
        <div className="h-10 w-10 shrink-0 overflow-hidden rounded-2xl bg-white shadow-lg shadow-blue-800/40">
          <img src={logoImg} alt="Logo Xã Trà Liên" className="h-full w-full object-cover" />
        </div>
        <div className="min-w-0">
          <p className="text-white text-sm font-bold leading-tight truncate">UBND Xã Trà Liên</p>
          <p className="text-blue-200/70 text-[11px] mt-0.5 leading-snug">
            Hệ thống tiếp nhận Phản ánh góp ý và Gửi thông tin thông báo, cảnh báo đến người dân
          </p>
        </div>
      </div>

      {/* Main nav */}
      <nav className="relative flex-1 overflow-y-auto px-3 py-4">
        <p className="px-3 pb-2 text-[10px] font-bold uppercase tracking-widest text-white/25 select-none">
          Menu chính
        </p>
        <div className="space-y-0.5">
          <NavItem to="/dashboard" icon={LayoutDashboard} label="Tổng quan" />
          <NavItem to="/feedbacks"  icon={MessageSquare}   label="Góp ý & Phản ánh" />
          <NavItem to="/tro-cap"    icon={Wallet}          label="Lịch chi trả trợ cấp" />
          <NavItem to="/lich-y-te"  icon={Stethoscope}     label="Lịch y tế" />
          <NavItem to="/thu-tuc-hanh-chinh" icon={FileText} label="Thủ tục hành chính" />
          <NavItem to="/app-links" icon={LayoutGrid} label="Icon & liên kết MiniApp" />
        </div>

        {user?.role === 'superadmin' && (
          <>
            <p className="px-3 pt-5 pb-2 text-[10px] font-bold uppercase tracking-widest text-white/25 select-none">
              Quản trị
            </p>
            <div className="space-y-0.5">
              <NavItem to="/users"    icon={Users}    label="Tài khoản Admin" />
              <NavItem to="/settings" icon={Settings} label="Cài đặt nhóm Zalo" />
              <NavItem to="/messages" icon={Send}     label="Gửi tin nhắn Zalo" />
            </div>
          </>
        )}

        <div className="my-4 mx-2 border-t border-white/8" />
      </nav>

      {/* User footer */}
      <div className="relative px-3 pb-4">
        <div className="flex items-center gap-3 rounded-2xl bg-white/6 border border-white/8 px-3 py-3 backdrop-blur">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 text-white text-sm font-bold shadow-md shadow-blue-900/40">
            {user?.fullName?.[0]?.toUpperCase() ?? 'A'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-xs font-semibold truncate">{user?.fullName}</p>
            <p className="text-white/40 text-[11px] mt-0.5">
              {ROLE_LABELS[user?.role] ?? user?.role}
            </p>
          </div>
          <button
            onClick={() => logout()}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-white/35 hover:text-red-400 hover:bg-red-400/10 transition-all"
            title="Đăng xuất"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  )
}
