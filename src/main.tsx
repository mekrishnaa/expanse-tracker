import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { seedIfEmpty } from './db/seed'
import { runReminderChecks } from './lib/notifications'
import { applyTheme, useSettings } from './store/useSettings'
import { useAuth } from './store/useAuth'
import { initInstallListeners } from './store/useInstall'

// Capture the browser's install prompt so we can surface a custom banner.
initInstallListeners()

// Apply saved theme before first paint and keep it in sync with the store.
applyTheme(useSettings.getState())
useSettings.subscribe((state) => applyTheme(state))

// React to OS theme changes when in "system" mode.
window
  .matchMedia('(prefers-color-scheme: dark)')
  .addEventListener('change', () => {
    if (useSettings.getState().mode === 'system') {
      applyTheme(useSettings.getState())
    }
  })

// Seed default categories/accounts/member on first run.
seedIfEmpty()

// Fire local reminders for due bills / exceeded budgets (logged-in users only).
if (useAuth.getState().user && useSettings.getState().remindersEnabled) {
  runReminderChecks()
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
