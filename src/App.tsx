import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { AppLayout } from './components/layout/AppLayout'
import { PinLock } from './components/PinLock'
import { AuthGate } from './components/AuthGate'
import { PWAUpdatePrompt } from './components/PWAUpdatePrompt'
import { InstallPrompt } from './components/InstallPrompt'
import { useScopeSync } from './lib/useScopeSync'

const Dashboard = lazy(() =>
  import('./pages/Dashboard').then((m) => ({ default: m.Dashboard })),
)
const Expenses = lazy(() =>
  import('./pages/Transactions').then((m) => ({ default: m.Expenses })),
)
const Income = lazy(() =>
  import('./pages/Transactions').then((m) => ({ default: m.Income })),
)
const Budget = lazy(() =>
  import('./pages/Budget').then((m) => ({ default: m.Budget })),
)
const Savings = lazy(() =>
  import('./pages/Savings').then((m) => ({ default: m.Savings })),
)
const Bills = lazy(() =>
  import('./pages/Bills').then((m) => ({ default: m.Bills })),
)
const Members = lazy(() =>
  import('./pages/Members').then((m) => ({ default: m.Members })),
)
const Reports = lazy(() =>
  import('./pages/Reports').then((m) => ({ default: m.Reports })),
)
const Calendar = lazy(() =>
  import('./pages/Calendar').then((m) => ({ default: m.Calendar })),
)
const Categories = lazy(() =>
  import('./pages/Categories').then((m) => ({ default: m.Categories })),
)
const Accounts = lazy(() =>
  import('./pages/Accounts').then((m) => ({ default: m.Accounts })),
)
const ShoppingLists = lazy(() =>
  import('./pages/ShoppingLists').then((m) => ({ default: m.ShoppingLists })),
)
const Notes = lazy(() =>
  import('./pages/Notes').then((m) => ({ default: m.Notes })),
)
const Settings = lazy(() =>
  import('./pages/Settings').then((m) => ({ default: m.Settings })),
)

function Loader() {
  return (
    <div className="flex h-[60svh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-primary)]" />
    </div>
  )
}

function App() {
  const { ready, version } = useScopeSync()
  return (
    <PinLock>
      <AuthGate>
        {ready ? (
          <Suspense key={version} fallback={<Loader />}>
            <Routes>
              <Route element={<AppLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/expenses" element={<Expenses />} />
                <Route path="/income" element={<Income />} />
                <Route path="/budget" element={<Budget />} />
                <Route path="/savings" element={<Savings />} />
                <Route path="/bills" element={<Bills />} />
                <Route path="/members" element={<Members />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/calendar" element={<Calendar />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/accounts" element={<Accounts />} />
                <Route path="/shopping" element={<ShoppingLists />} />
                <Route path="/notes" element={<Notes />} />
                <Route path="/settings" element={<Settings />} />
              </Route>
            </Routes>
          </Suspense>
        ) : (
          <Loader />
        )}
        <PWAUpdatePrompt />
        <InstallPrompt />
      </AuthGate>
    </PinLock>
  )
}

export default App
