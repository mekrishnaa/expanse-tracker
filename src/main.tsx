import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { applyTheme, useSettings } from './store/useSettings'
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

// Data seeding, reminders, and cloud restore run per-account inside
// useScopeSync (see App.tsx) so each user only ever sees their own data.

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
