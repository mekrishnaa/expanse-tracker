import { useRef } from 'react'
import { Check, Download, Trash2, Upload } from 'lucide-react'
import { db } from '../db/db'
import { CURRENCIES } from '../lib/format'
import {
  clearAllData,
  downloadCSVTemplate,
  exportCSV,
  exportJSON,
  importJSON,
  importTransactionsCSV,
} from '../lib/backup'
import { useTemplates } from '../lib/hooks'
import {
  notificationPermission,
  notificationsSupported,
  requestNotificationPermission,
} from '../lib/notifications'
import { useSettings, type ThemeMode, FONTS, PALETTES } from '../store/useSettings'
import { useTour } from '../store/useTour'
import { useInstall } from '../store/useInstall'
import { useAuth } from '../store/useAuth'
import { cn } from '../lib/utils'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Select } from '../components/ui/Input'
import { PageHeader } from '../components/ui/PageHeader'
import {
  ColorInput,
  SettingRow,
  Slider,
  Toggle,
} from '../components/settings/controls'
import { CloudSync } from '../components/settings/CloudSync'

function Section({
  title,
  icon,
  children,
}: {
  title: string
  icon: string
  children: React.ReactNode
}) {
  return (
    <Card className="mb-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-xl">{icon}</span>
        <h3 className="font-bold">{title}</h3>
      </div>
      <div className="divide-y divide-[var(--color-border)]">{children}</div>
    </Card>
  )
}

export function Settings() {
  const s = useSettings()
  const set = s.set
  const templates = useTemplates()
  const startTour = useTour((t) => t.start)
  const { deferred, installed, isIOS, promptInstall } = useInstall()
  const user = useAuth((a) => a.user)
  const fileRef = useRef<HTMLInputElement>(null)
  const csvRef = useRef<HTMLInputElement>(null)

  const onImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!confirm('Importing will replace all current data. Continue?')) return
    await importJSON(file)
    alert('Backup imported successfully.')
  }

  const onImportCSV = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const count = await importTransactionsCSV(file)
    alert(`Imported ${count} transaction${count === 1 ? '' : 's'}.`)
    e.target.value = ''
  }

  const enableNotifications = async () => {
    const result = await requestNotificationPermission()
    if (result === 'granted') {
      set('remindersEnabled', true)
      new Notification('Reminders enabled', {
        body: "You'll be notified about due bills and exceeded budgets.",
        icon: '/icons/icon-192.png',
      })
    } else {
      alert('Notification permission was not granted.')
    }
  }

  return (
    <div className="max-w-3xl">
      <PageHeader title="Settings" subtitle="Make the app truly yours" />

      {/* Appearance */}
      <Section title="Appearance" icon="🎨">
        <SettingRow label="Theme">
          <div className="flex gap-1 rounded-full bg-[var(--color-surface-2)] p-1">
            {(['light', 'dark', 'system'] as ThemeMode[]).map((m) => (
              <button
                key={m}
                onClick={() => set('mode', m)}
                className={cn(
                  'rounded-full px-3 py-1.5 text-xs font-semibold capitalize',
                  s.mode === m
                    ? 'bg-[var(--color-primary)] text-white'
                    : 'text-[var(--color-text-muted)]',
                )}
              >
                {m}
              </button>
            ))}
          </div>
        </SettingRow>

        <SettingRow label="Color palette" hint="Quick preset themes">
          <div />
        </SettingRow>
        <div className="grid grid-cols-4 gap-2 pb-3 sm:grid-cols-8">
          {PALETTES.map((p) => (
            <button
              key={p.name}
              onClick={() => s.applyPalette(p)}
              title={p.name}
              className={cn(
                'flex h-10 items-center justify-center rounded-xl',
                s.primary === p.primary && 'ring-2 ring-offset-2 ring-offset-[var(--color-surface)]',
              )}
              style={{
                background: `linear-gradient(135deg, ${p.primary}, ${p.secondary})`,
              }}
            >
              {s.primary === p.primary && (
                <Check size={16} className="text-white" />
              )}
            </button>
          ))}
        </div>

        <SettingRow label="Primary color">
          <ColorInput value={s.primary} onChange={(v) => set('primary', v)} />
        </SettingRow>
        <SettingRow label="Secondary color">
          <ColorInput value={s.secondary} onChange={(v) => set('secondary', v)} />
        </SettingRow>
        <SettingRow label="Accent color">
          <ColorInput value={s.accent} onChange={(v) => set('accent', v)} />
        </SettingRow>

        <SettingRow label="Rounded corners" hint={`${s.radius}px`}>
          <Slider value={s.radius} min={0} max={32} onChange={(v) => set('radius', v)} />
        </SettingRow>
        <SettingRow label="Shadow intensity">
          <Slider value={s.shadow} min={0} max={2} step={0.25} onChange={(v) => set('shadow', v)} />
        </SettingRow>
        <SettingRow label="Animation speed">
          <Slider value={s.animSpeed} min={0.5} max={2} step={0.25} onChange={(v) => set('animSpeed', v)} />
        </SettingRow>
        <SettingRow label="Compact spacing">
          <Toggle
            checked={s.spacing === 'compact'}
            onChange={(v) => set('spacing', v ? 'compact' : 'comfortable')}
          />
        </SettingRow>
        <SettingRow label="Glassmorphism">
          <Toggle checked={s.glass} onChange={(v) => set('glass', v)} />
        </SettingRow>
      </Section>

      {/* Typography */}
      <Section title="Typography" icon="🔤">
        <SettingRow label="Font family">
          <Select
            value={s.fontFamily}
            onChange={(e) => set('fontFamily', e.target.value)}
            className="w-40"
          >
            {FONTS.map((f) => (
              <option key={f}>{f}</option>
            ))}
          </Select>
        </SettingRow>
        <SettingRow label="Font size" hint={`${Math.round(s.fontScale * 100)}%`}>
          <Slider value={s.fontScale} min={0.85} max={1.3} step={0.05} onChange={(v) => set('fontScale', v)} />
        </SettingRow>
        <SettingRow label="Font weight">
          <Slider value={s.fontWeight} min={300} max={600} step={100} onChange={(v) => set('fontWeight', v)} />
        </SettingRow>
        <SettingRow label="Letter spacing">
          <Slider value={s.letterSpacing} min={-1} max={2} step={0.25} onChange={(v) => set('letterSpacing', v)} />
        </SettingRow>
        <SettingRow label="Line height">
          <Slider value={s.lineHeight} min={1.2} max={2} step={0.1} onChange={(v) => set('lineHeight', v)} />
        </SettingRow>
      </Section>

      {/* Preferences */}
      <Section title="Preferences" icon="⚙️">
        <SettingRow label="Currency">
          <Select
            value={s.currency}
            onChange={(e) => set('currency', e.target.value)}
            className="w-44"
          >
            {Object.entries(CURRENCIES).map(([code, c]) => (
              <option key={code} value={code}>
                {c.symbol} {code}
              </option>
            ))}
          </Select>
        </SettingRow>
        <SettingRow label="Date format">
          <Select
            value={s.dateFormat}
            onChange={(e) => set('dateFormat', e.target.value)}
            className="w-40"
          >
            <option>DD/MM/YYYY</option>
            <option>MM/DD/YYYY</option>
            <option>YYYY-MM-DD</option>
          </Select>
        </SettingRow>
        {user && (
          <SettingRow label="Reminders enabled">
            <Toggle
              checked={s.remindersEnabled}
              onChange={(v) => set('remindersEnabled', v)}
            />
          </SettingRow>
        )}
        <SettingRow label="App tour" hint="Replay the first-time walkthrough">          <Button variant="outline" size="sm" onClick={startTour}>
            Replay tour
          </Button>
        </SettingRow>
        <SettingRow
          label="Install app"
          hint={
            installed
              ? 'Already installed on this device'
              : isIOS
                ? 'Tap Share → Add to Home Screen in Safari'
                : 'Add to your home screen for offline use'
          }
        >
          {installed ? (
            <span className="text-sm font-semibold text-[var(--color-success)]">
              Installed
            </span>
          ) : (
            <Button
              variant="outline"
              size="sm"
              disabled={!deferred && !isIOS}
              onClick={() => {
                if (isIOS)
                  alert(
                    'In Safari, tap the Share button, then "Add to Home Screen".',
                  )
                else promptInstall()
              }}
            >
              Install
            </Button>
          )}
        </SettingRow>
        {user && (
          <SettingRow
            label="Device notifications"
            hint={
              !notificationsSupported()
                ? 'Not supported on this device'
                : notificationPermission() === 'granted'
                  ? 'Enabled — alerts for due bills & exceeded budgets'
                  : 'Get alerts for due bills & exceeded budgets'
            }
          >
            {notificationPermission() === 'granted' ? (
              <span className="text-sm font-semibold text-[var(--color-success)]">
                Granted
              </span>
            ) : (
              <Button
                size="sm"
                variant="outline"
                onClick={enableNotifications}
                disabled={!notificationsSupported()}
              >
                Enable
              </Button>
            )}
          </SettingRow>
        )}
      </Section>

      {/* Quick templates */}
      <Section title="Quick Templates" icon="⭐">
        {templates.length ? (
          <div className="py-3">
            {templates.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between py-2"
              >
                <span className="text-sm font-semibold">
                  {t.emoji ?? '⭐'} {t.label}
                  <span className="ml-2 text-xs font-normal capitalize text-[var(--color-text-muted)]">
                    {t.type}
                  </span>
                </span>
                <button
                  onClick={() => t.id && db.templates.delete(t.id)}
                  className="rounded-full p-1.5 text-[var(--color-text-muted)] hover:text-[var(--color-danger)]"
                  aria-label="Delete template"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-3 text-xs text-[var(--color-text-muted)]">
            Save a transaction as a template from the Add screen to get one-tap
            entry here.
          </p>
        )}
      </Section>

      {/* Privacy */}
      <Section title="Privacy & Security" icon="🔒">
        <SettingRow label="Hide balances" hint="Blur amounts by default">
          <Toggle checked={s.hideBalances} onChange={(v) => set('hideBalances', v)} />
        </SettingRow>
        <SettingRow label="PIN lock" hint="Ask for a PIN on open">
          <Toggle
            checked={s.pinEnabled}
            onChange={(v) => {
              if (v) {
                const pin = prompt('Set a 4-digit PIN') ?? ''
                if (/^\d{4}$/.test(pin)) {
                  set('pin', pin)
                  set('pinEnabled', true)
                } else if (pin) alert('PIN must be 4 digits.')
              } else {
                set('pinEnabled', false)
                set('pin', '')
              }
            }}
          />
        </SettingRow>
      </Section>

      {/* Accessibility */}
      <Section title="Accessibility" icon="♿">
        <SettingRow label="Large text">
          <Toggle checked={s.largeText} onChange={(v) => set('largeText', v)} />
        </SettingRow>
        <SettingRow label="High contrast">
          <Toggle checked={s.highContrast} onChange={(v) => set('highContrast', v)} />
        </SettingRow>
        <SettingRow label="Reduce motion">
          <Toggle checked={s.reduceMotion} onChange={(v) => set('reduceMotion', v)} />
        </SettingRow>
      </Section>

      {/* Cloud Sync */}
      <CloudSync />

      {/* Backup */}
      <Section title="Backup & Data" icon="💾">
        {user && (
          <div className="flex flex-wrap gap-2 py-3">
            <Button variant="outline" size="sm" onClick={exportJSON}>
              <Download size={16} /> Export JSON
            </Button>
            <Button variant="outline" size="sm" onClick={exportCSV}>
              <Download size={16} /> Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileRef.current?.click()}
            >
              <Upload size={16} /> Import JSON
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={onImport}
            />
          </div>
        )}
        {user && (
          <SettingRow
            label="Bulk import transactions (CSV)"
            hint="Add many transactions at once from a CSV file"
          >
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={downloadCSVTemplate}>
                Template
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => csvRef.current?.click()}
              >
                <Upload size={16} /> Import
              </Button>
            </div>
          </SettingRow>
        )}
        <input
          ref={csvRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={onImportCSV}
        />
        <SettingRow label="Reset appearance" hint="Restore default theme">
          <Button variant="outline" size="sm" onClick={s.reset}>
            Reset
          </Button>
        </SettingRow>
        <SettingRow label="Clear all data" hint="Deletes every transaction">
          <Button
            variant="danger"
            size="sm"
            onClick={() => {
              if (confirm('Delete ALL data permanently?')) clearAllData()
            }}
          >
            Delete
          </Button>
        </SettingRow>
      </Section>

      <p className="pb-4 text-center text-xs text-[var(--color-text-muted)]">
        Family Expense Tracker · Offline-first PWA · All data stays on this device.
      </p>
    </div>
  )
}
