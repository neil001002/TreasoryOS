import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Menu } from 'lucide-react'
import { Sidebar } from './Sidebar'
import { WalletButton } from './WalletButton'
import { CircleWalletButton } from './CircleWalletButton'

export function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="flex min-h-dvh bg-gradient-arc">
      {/* Desktop sidebar */}
      <div className="hidden md:flex flex-shrink-0 self-stretch min-h-dvh sticky top-0">
        <Sidebar />
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={() => setSidebarOpen(false)} />
          <div className="relative z-10">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-10 flex items-center justify-between px-4 md:px-8 py-4 bg-white/80 backdrop-blur-sm border-b border-[var(--border)]">
          <button
            className="md:hidden p-2 rounded-lg hover:bg-[var(--surface-muted)] transition-colors"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={18} className="text-[var(--ink)]" />
          </button>
          <div className="hidden md:block" />
          <div className="flex items-center gap-2">
            <CircleWalletButton />
            <WalletButton />
          </div>
        </header>

        <main className="flex-1 p-4 md:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
