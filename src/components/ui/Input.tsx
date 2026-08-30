import { forwardRef } from 'react'
import { cn } from '../../lib/utils'

const base =
  'w-full rounded-[calc(var(--radius)*0.55)] border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3.5 py-2.5 text-sm text-[var(--color-text)] outline-none transition-colors placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20'

export const Input = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, ...props }, ref) => (
  <input ref={ref} className={cn(base, className)} {...props} />
))
Input.displayName = 'Input'

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea ref={ref} className={cn(base, 'min-h-24 resize-y', className)} {...props} />
))
Textarea.displayName = 'Textarea'

export const Select = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <select ref={ref} className={cn(base, 'appearance-none', className)} {...props}>
    {children}
  </select>
))
Select.displayName = 'Select'

export function Field({
  label,
  children,
  hint,
}: {
  label: string
  children: React.ReactNode
  hint?: string
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-semibold text-[var(--color-text-muted)]">
        {label}
      </span>
      {children}
      {hint && (
        <span className="mt-1 block text-xs text-[var(--color-text-muted)]">
          {hint}
        </span>
      )}
    </label>
  )
}
