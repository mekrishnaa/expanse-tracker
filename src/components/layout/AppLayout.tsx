import { useEffect, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { TransactionModal } from '../transactions/TransactionModal'
import { Tour } from '../tour/Tour'
import { LoginModal } from '../LoginModal'
import { useTour } from '../../store/useTour'
import { BottomNav } from './BottomNav'
import { MobileDrawer } from './MobileDrawer'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'

export function AppLayout() {
  const [menuOpen, setMenuOpen] = useState(false)
  const startTour = useTour((s) => s.start)
  const hasSeen = useTour((s) => s.hasSeen)

  // Launch the guided tour once for first-time visitors.
  useEffect(() => {
    if (hasSeen()) return
    const t = setTimeout(() => startTour(), 700)
    return () => clearTimeout(t)
  }, [hasSeen, startTour])

  return (
    <div className="flex min-h-svh">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onOpenMenu={() => setMenuOpen(true)} />
        <main className="mx-auto w-full max-w-6xl flex-1 px-3 pb-28 pt-4 sm:px-6 lg:pb-10">
          <Outlet />
        </main>
        <BottomNav />
      </div>
      <MobileDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
      <TransactionModal />
      <LoginModal />
      <Tour />
    </div>
  )
}
