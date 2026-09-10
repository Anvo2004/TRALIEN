import { useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Search, Bell, Menu, X } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import Sidebar from './Sidebar'
import NotificationBell from './NotificationBell'

const PAGE_TITLES = {
  '/dashboard': { title: 'Tổng quan', subtitle: 'Thống kê & theo dõi góp ý người dân' },
  '/feedbacks':  { title: 'Góp ý & Phản ánh', subtitle: 'Danh sách và xử lý phản ánh' },
  '/users':      { title: 'Tài khoản Admin', subtitle: 'Quản lý tài khoản cán bộ' },
}

function getHourGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Chào buổi sáng'
  if (h < 18) return 'Chào buổi chiều'
  return 'Chào buổi tối'
}

export default function AppLayout() {
  const { user } = useAuth()
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const basePath = '/' + location.pathname.split('/')[1]
  const page = PAGE_TITLES[basePath] ?? { title: 'Trang', subtitle: '' }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <Sidebar />

      {/* Main content */}
      <div className="ml-64 flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Gradient header — màu y hệt NONGSON (xanh sáng → cyan) */}
        <header className="relative shrink-0 overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #1d4ed8 0%, #2563eb 40%, #0ea5e9 100%)' }}>
          <div className="pointer-events-none absolute -top-10 -right-10 h-48 w-48 rounded-full bg-white/5" />
          <div className="pointer-events-none absolute bottom-0 right-32 h-32 w-32 rounded-full bg-cyan-400/10" />
          <div className="pointer-events-none absolute -bottom-6 left-1/3 h-20 w-20 rounded-full bg-blue-300/10" />

          <div className="relative px-6 py-4 flex items-center justify-between gap-4">
            {/* Left: greeting + page title */}
            <div className="min-w-0">
              <h1 className="text-white font-bold text-lg leading-tight">
                {getHourGreeting()}, <span className="text-blue-100">{user?.fullName?.split(' ').pop() ?? 'Admin'}</span>!
              </h1>
              <p className="text-blue-200/80 text-xs mt-0.5 truncate">{page.subtitle}</p>
            </div>

            {/* Right: search + notifications + user */}
            <div className="flex items-center gap-3 shrink-0">
              {/* Search (hidden on small screens) */}
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/50 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Tìm kiếm..."
                  className="h-9 w-48 rounded-xl bg-white/15 border border-white/20 pl-9 pr-4 text-sm text-white placeholder-white/50 focus:outline-none focus:bg-white/22 focus:border-white/40 focus:w-56 transition-all duration-200"
                />
              </div>

              {/* Bell */}
              <NotificationBell />

              {/* User chip */}
              <div className="flex items-center gap-2.5 rounded-xl bg-white/15 border border-white/20 px-3 py-1.5">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-white/30 to-white/10 text-white text-xs font-bold">
                  {user?.fullName?.[0]?.toUpperCase() ?? 'A'}
                </div>
                <div className="hidden sm:block leading-tight">
                  <p className="text-white text-xs font-semibold">{user?.fullName}</p>
                  <p className="text-blue-200/70 text-[10px]">
                    {user?.role === 'superadmin' ? 'Quản trị viên' : 'Nhân viên'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Scrollable page content */}
        <main className="flex-1 overflow-y-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
