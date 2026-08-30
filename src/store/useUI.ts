import { create } from 'zustand'
import type { Transaction, TxnType } from '../db/types'

interface UIState {
  txnModalOpen: boolean
  txnModalType: TxnType
  editingTxn: Transaction | null
  sidebarCollapsed: boolean
  openTxnModal: (type?: TxnType, txn?: Transaction | null) => void
  closeTxnModal: () => void
  toggleSidebar: () => void
}

export const useUI = create<UIState>((set) => ({
  txnModalOpen: false,
  txnModalType: 'expense',
  editingTxn: null,
  sidebarCollapsed: false,
  openTxnModal: (type = 'expense', txn = null) =>
    set({ txnModalOpen: true, txnModalType: txn?.type ?? type, editingTxn: txn }),
  closeTxnModal: () => set({ txnModalOpen: false, editingTxn: null }),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
}))
