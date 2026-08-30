import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { seedIfEmpty } from './db/seed'
import { runReminderChecks } from './lib/notifications'
import { applyTheme, useSettings } from './store/useSettings'

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

// Fire local reminders for due bills / exceeded budgets (once per day per item).
if (useSettings.getState().remindersEnabled) {
  runReminderChecks()
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
