import { cn } from '../../lib/utils'
import type { TxnType } from '../../db/types'
import { useUI } from '../../store/useUI'
import { Modal } from '../ui/Modal'
import { TransactionForm } from './TransactionForm'

const TABS: { type: TxnType; label: string }[] = [
  { type: 'expense', label: 'Expense' },
  { type: 'income', label: 'Income' },
  { type: 'transfer', label: 'Transfer' },
]

export function TransactionModal() {
  const open = useUI((s) => s.txnModalOpen)
  const type = useUI((s) => s.txnModalType)
  const editing = useUI((s) => s.editingTxn)
  const close = useUI((s) => s.closeTxnModal)
  const openTxnModal = useUI((s) => s.openTxnModal)

  return (
    <Modal
      open={open}
      onClose={close}
      title={editing ? 'Edit transaction' : 'Add transaction'}
    >
      {!editing && (
        <div className="mb-4 grid grid-cols-3 gap-1 rounded-full bg-[var(--color-surface-2)] p-1">
          {TABS.map((t) => (
            <button
              key={t.type}
              onClick={() => openTxnModal(t.type)}
              className={cn(
                'rounded-full py-2 text-sm font-semibold transition-colors',
                type === t.type
                  ? 'bg-[var(--color-primary)] text-white shadow-[var(--shadow-sm)]'
                  : 'text-[var(--color-text-muted)]',
              )}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}
      <TransactionForm
        key={type + (editing?.id ?? 'new')}
        type={type}
        editing={editing}
        onDone={close}
      />
    </Modal>
  )
}
